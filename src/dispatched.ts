import {context} from '@actions/github'
import {EventPayloads} from '@octokit/webhooks'
import * as core from '@actions/core'
import {Payload} from './payload'
import {CheckParams} from './types'
import {memoize} from 'memoize-cache-decorator'
import {Observer} from './observe'
import {LazyGetter as lazy} from 'lazy-get-decorator'
import {Dispatchable, Reference} from './reference'

export class RepositoryDispatch extends Observer implements Dispatchable {
	@lazy()
	get postStep(): boolean {
		return process.env.interactiveEventDispatcher === 'true'
	}

	@lazy()
	get clientPayload(): Payload {
		const payload = context.payload as EventPayloads.WebhookPayloadRepositoryDispatch

		if (payload?.client_payload !== undefined) {
			const clientPayload = payload.client_payload as Payload

			if (clientPayload?.repository !== undefined) {
				return clientPayload
			}
		}

		throw new Error(
			'This repository_dispatch event does not contain the expected client payload.'
		)
	}

	@lazy()
	get jobData(): {id: number; jobData: CheckParams} {
		const jobData = <CheckParams>{
			sha: this.clientPayload.sha,
			name: `${context.workflow} / ${context.job} (${Reference.action})`,
			externalId: String(context.runId)
		}

		if (this.postStep) {
			jobData.completedAt = new Date().toISOString()
			jobData.status = 'completed'
			jobData.conclusion = 'neutral'
		} else {
			jobData.startedAt = new Date().toISOString()
			jobData.status = 'in_progress'
		}

		return {
			id: context.runId,
			jobData
		}
	}

	@memoize()
	async sha(): Promise<string> {
		return this.clientPayload.sha
	}

	@memoize()
	async triggerEvent(): Promise<string> {
		return Reference.action
	}

	@memoize()
	async repository(): Promise<string> {
		return this.clientPayload.repository
	}

	@memoize()
	async ref(): Promise<string> {
		return this.clientPayload.ref
	}

	async dispatch(): Promise<void> {
		if (!this.postStep) {
			core.info(
				`<interactive-event-dispatcher>${JSON.stringify(
					this.clientPayload
				)}</interactive-event-dispatcher>`
			)
			core.exportVariable('interactiveEventDispatcher', true)
			core.exportVariable('sha', this.clientPayload.sha)
			core.exportVariable('repository', this.clientPayload.repository)
			core.exportVariable('ref', this.clientPayload.ref)
			core.exportVariable('event', this.clientPayload.sourceEvent)
		}
		await this.updateCheck(this.jobData)
	}
}
