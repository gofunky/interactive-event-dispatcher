import {Inputs} from './inputs'
import * as core from '@actions/core'
import type {Payload} from './payload'
import {memoize} from 'memoize-cache-decorator'
import {context} from '@actions/github'
import {CheckParams} from './types'
import {Dispatchable, Reference} from './reference'

export class Event extends Reference implements Dispatchable {
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
		return `${context.repo.owner}/${context.repo.repo}`
	}

	@memoize()
	async sha(): Promise<string> {
		return context.sha
	}

	@memoize()
	async short(): Promise<string> {
		const sha = await this.sha()
		return sha.slice(0, 7)
	}

	@memoize()
	async payload(): Promise<Payload> {
		return <Payload>{
			sourceEvent: Event.sourceEvent,
			triggerEvent: await this.triggerEvent(),
			repository: await this.repository(),
			ref: await this.ref(),
			sha: await this.sha(),
			short: await this.short()
		}
	}

	async dispatch(): Promise<void> {
		if (!(await this.triggered())) {
			core.info(
				'Skipping event dispatch because trigger condition is not true.'
			)
			return
		}

		const eventName = await this.triggerEvent()
		const payload = await this.payload()
		await this.api.dispatchEvent({
			eventName,
			payload
		})
		core.info(
			`Event with type '${eventName}' has been dispatched successfully.`
		)

		await Reference.sleep(1000)
		await this.checkWorkflows()
	}

	async checkWorkflows(): Promise<void> {
		const ref = await this.ref()

		for await (const job of this.jobDataFor()) {
			const existing = await this.api.getCheck({
				ref,
				filter: 'latest',
				name: job.jobData.name
			})

			if (existing.total_count > 0) {
				core.info(
					`Skipping check creation since there already exists at least one check with this ref and name '${job.jobData.name}'.`
				)
				continue
			}

			const check = await this.api.createCheck(job.jobData)
			core.info(
				`The check '${job.jobData.name}' has been created successfully with id '${check.id}'.`
			)
		}
	}

	async *jobDataFor(): AsyncGenerator<{id: number; jobData: CheckParams}> {
		const eventName = await this.triggerEvent()
		const sha = await this.sha()

		const runWindow = await this.api.listRuns({
			eventName: 'repository_dispatch'
		})

		// TODO Check workflow file if it contains the observer

		const merged = runWindow.workflow_runs
			.filter((run) => run.status in ['queued', 'in_progress'])
			.map(async (run) => {
				const wf = await this.api.workflowById({
					workflowId: run.workflow_id
				})
				const jobs = await this.api.jobsForWorkflow({
					runId: run.id,
					filter: 'latest'
				})
				return {
					wf,
					jobs
				}
			})

		for await (const {wf, jobs} of merged) {
			for (const job of jobs.jobs) {
				if (job.status !== 'queued') {
					continue
				}
				const name = `${wf.name} / ${job.name} (${eventName})`
				yield {
					id: job.id,
					jobData: {
						sha,
						name,
						status: job.status,
						externalId: String(job.id),
						detailsUrl: job.html_url
					}
				}
			}
		}
	}
}
