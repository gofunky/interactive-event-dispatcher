import {context} from '@actions/github'
import {
	CheckConclusionType,
	CheckParams,
	CheckStatusType,
	JobParams
} from './types'
import {Observer} from './observe'
import {Payload} from './payload'
import {Dispatchable, Reference} from './reference'
import {EventPayloads} from '@octokit/webhooks'
import * as core from '@actions/core'

export class WorkflowRun extends Observer implements Dispatchable {
	get completed(): boolean {
		return context.action === 'completed'
	}

	get workflowData(): EventPayloads.WebhookPayloadWorkflowRun | undefined {
		const payload = context.payload as EventPayloads.WebhookPayloadWorkflowRun

		if (
			payload?.workflow_run !== undefined &&
			payload.workflow_run?.event !== ''
		) {
			return payload
		}

		return undefined
	}

	async *jobDataFor(): AsyncGenerator<JobParams> {
		const payload = this.workflowData

		if (!payload) {
			return
		}

		if (
			payload.workflow_run?.event !== 'repository_dispatch' ||
			payload.workflow?.name === undefined
		) {
			core.error(`The workflow payload seems to be missing.`)
			return
		}

		const runId = payload.workflow_run.id
		const jobs = await this.api.jobsForWorkflow({
			runId,
			filter: 'latest'
		})

		if (!jobs || jobs.jobs.length === 0) {
			core.warning(`No jobs could be found with run id ${runId}.`)
			return
		}

		const clientPayloadMatcher = /<interactive-event-dispatcher>(.*)<interactive-event-dispatcher>/.compile()

		const jobLogPromises = jobs.jobs.map(async (value) => {
			const log = await this.api.logForJob({
				runId: value.id
			})
			const payloadOpt = clientPayloadMatcher.exec(log ?? '')
			let clientPayload

			if (payloadOpt && payloadOpt.length === 2 && payloadOpt[0] !== '') {
				clientPayload = <Payload>JSON.parse(payloadOpt[1])
			}

			return {
				job: value,
				clientPayload
			}
		})
		const jobsWithLogs = await Promise.all(jobLogPromises)

		for (const {job, clientPayload} of jobsWithLogs) {
			if (clientPayload) {
				const jobData = <CheckParams>{
					sha: clientPayload.sha,
					name: `${payload.workflow.name} / ${job.name} (${clientPayload.triggerEvent})`,
					conclusion: job.conclusion
						? <CheckConclusionType>job.conclusion
						: undefined,
					status: <CheckStatusType>job.status,
					externalId: String(job.id),
					detailsUrl: job.html_url,
					completedAt: job.completed_at,
					startedAt: job.started_at
				}

				yield {
					id: job.id,
					jobData
				}
			}
		}
	}

	async dispatch(): Promise<void> {
		if (!this.completed) {
			core.warning(
				`This workflow is triggered by type ${context.action} but should be filtered for 'completed'.`
			)
			return
		}

		for await (const job of this.jobDataFor()) {
			await Reference.sleep(1000)
			await this.updateCheck(job)
		}
	}
}
