import {Inputs} from './inputs'
import * as github from '@actions/github'
import * as core from '@actions/core'
import {Api} from './api'
import type {Payload} from './payload'
import type {
	ActionsGetJobForWorkflowRunResponseData,
	ActionsGetWorkflowResponseData,
	ActionsListJobsForWorkflowRunResponseData,
	ChecksCreateResponseData,
	ChecksUpdateResponseData
} from '@octokit/types'
import type {CheckConclusionType, CheckParams, CheckStatusType} from './types'
import {memoize} from 'memoize-cache-decorator'
import {wrapMap} from './helpers'
import {ClassLogger as classLogger} from 'rich-logger-decorator/dist/src/class-logger.decorator'

@classLogger({
	methodOptions: {
		logFunction: core.debug,
		withTime: false
	}
})
export class Event {
	api: Api

	runs = new Map<number, Promise<ActionsListJobsForWorkflowRunResponseData>>()

	workflows = new Map<number, Promise<ActionsGetWorkflowResponseData>>()

	checks = new Map<
		number,
		ChecksCreateResponseData | ChecksUpdateResponseData
	>()

	constructor() {
		this.api = new Api({
			token: Inputs.token,
			actionsToken: Inputs.actionsToken,
			perPage: Inputs.perPage
		})
	}

	static get sourceEvent(): string {
		return Inputs.sourceEvent ?? github.context.eventName
	}

	@memoize()
	async triggerEvent(): Promise<string> {
		return Inputs.event
	}

	@memoize()
	async triggered(): Promise<boolean> {
		return true
	}

	@memoize()
	async repository(): Promise<string> {
		return `${github.context.repo.owner}/${github.context.repo.repo}`
	}

	@memoize()
	async sha(): Promise<string> {
		return github.context.sha
	}

	@memoize()
	async short(): Promise<string> {
		const sha = await this.sha()
		return sha.slice(0, 7)
	}

	@memoize()
	async ref(): Promise<string> {
		return github.context.ref
	}

	@memoize()
	async payload(): Promise<Payload> {
		return <Payload>{
			sourceEvent: Event.sourceEvent,
			repository: await this.repository(),
			ref: await this.ref(),
			sha: await this.sha()
		}
	}

	async branchMatch(branch: string): Promise<boolean> {
		return branch === (await this.ref())
	}

	async sleep(): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, Inputs.interval))
	}

	async dispatch(): Promise<void> {
		if (!(await this.triggered())) {
			core.info(
				'Skipping event dispatch because trigger condition is not true.'
			)
			return
		}
		await this.api.dispatchEvent({
			eventName: await this.triggerEvent(),
			payload: await this.payload()
		})

		if (!Inputs.observingChecks) {
			core.info(
				'Skipping workflow check tracing because `inputs.observingChecks` is disabled.'
			)
			return
		}
		await this.sleep()
		return this.checkWorkflows()
	}

	async checkWorkflows(): Promise<void> {
		await this.sleep()

		for (const [runId] of this.runs) {
			const jobs = this.api.jobsForWorkflow({
				runId,
				filter: 'latest'
			})
			this.runs.set(runId, jobs)
		}

		await this.updateChecks()
		await this.sleep()

		const runWindow = await this.api.listRuns({
			eventName: 'repository_dispatch'
		})

		const repo = await this.repository()
		const sha = await this.sha()
		const runSelectionPromise = runWindow.workflow_runs.filter(
			async (run) =>
				run.head_sha === sha &&
				run.head_repository.full_name === repo &&
				(await this.branchMatch(run.head_branch))
		)
		const runSelection = await Promise.all(runSelectionPromise)
		for (const wfRun of runSelection) {
			const jobs = this.api.jobsForWorkflow({
				runId: wfRun.id,
				filter: 'latest'
			})
			this.runs.set(wfRun.id, jobs)

			if (!this.workflows.has(wfRun.id)) {
				const wf = this.api.workflowById({
					workflowId: wfRun.workflow_id
				})
				this.workflows.set(wfRun.id, wf)
			}
		}
		await this.updateChecks()

		const jobs = await Promise.all(this.runs.values())

		if (
			jobs.every((nested) =>
				nested.jobs.every((job) => job.status === 'completed')
			)
		) {
			core.info('All triggered workflow runs are completed.')
			return
		}

		return this.checkWorkflows()
	}

	async *jobDataFor(): AsyncGenerator<{id: number; jobData: CheckParams}> {
		const eventName = await this.triggerEvent()
		const sha = await this.sha()
		const workflows = await wrapMap(this.workflows)
		const allJobs = await wrapMap(this.runs)
		const jobMap = allJobs.reduce((previous, {key, value}) => {
			previous.set(key, value.jobs)
			return previous
		}, new Map<number, ActionsGetJobForWorkflowRunResponseData[]>())

		for (const wf of workflows) {
			const jobs = jobMap.get(wf.key)

			if (!jobs) {
				continue
			}
			for (const job of jobs) {
				const name = `${wf.value.name} / ${job.name} (${eventName})`
				yield {
					id: job.id,
					jobData: {
						sha,
						name,
						conclusion: job.conclusion
							? <CheckConclusionType>job.conclusion
							: undefined,
						status: <CheckStatusType>job.status,
						completedAt: job.completed_at,
						startedAt: job.started_at,
						externalId: String(job.id),
						detailsUrl: job.html_url
					}
				}
			}
		}
	}

	async updateChecks(): Promise<void> {
		for await (const job of this.jobDataFor()) {
			const existing = this.checks.get(job.id)

			if (existing) {
				const updated = await this.api.updateCheck({
					checkId: existing.id,
					...job.jobData
				})
				this.checks.set(job.id, updated)
			} else {
				const existing = await this.api.getCheck({
					ref: await this.ref(),
					filter: 'latest',
					name: job.jobData.name
				})

				if (existing.total_count === 1) {
					const updated = await this.api.updateCheck({
						checkId: existing.check_runs[0].id,
						...job.jobData
					})
					this.checks.set(job.id, updated)
				} else {
					const created = await this.api.createCheck(job.jobData)
					this.checks.set(job.id, created)
				}
			}
		}
	}
}
