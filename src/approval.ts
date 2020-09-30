import {CHECK_NAME, PullRequestEvent} from './pull'
import * as github from '@actions/github'
import {Inputs} from './inputs'
import type {EventPayloads} from '@octokit/webhooks'
import * as core from '@actions/core'
import {LazyGetter as lazy} from 'lazy-get-decorator'
import {memoize} from 'memoize-cache-decorator'

export class PullRequestActionEvent extends PullRequestEvent {
	@lazy()
	get number(): number {
		return super.number ?? github.context.payload.requested_action.identifier
	}

	@lazy()
	get checkEvent(): EventPayloads.WebhookPayloadCheckRun | undefined {
		const payload = <EventPayloads.WebhookPayloadCheckRun>github.context.payload

		if (payload.check_run.name !== undefined && payload.check_run.name !== '') {
			return payload
		}

		return undefined
	}

	@memoize()
	async sha(): Promise<string> {
		return this.checkEvent?.check_run.head_sha ?? (await super.sha())
	}

	@memoize()
	async triggered(): Promise<boolean> {
		return (await super.triggered()) && (await this.checkAction())
	}

	@memoize()
	async fromCollaborator(): Promise<boolean> {
		const collaborators = await this.api.collaborators(Inputs.affiliation)
		return Boolean(
			collaborators.find((col) => col.id === this.checkEvent?.sender.id)
		)
	}

	async checkAction(): Promise<boolean> {
		if (this.checkEvent?.check_run.name !== CHECK_NAME) {
			core.info('The requested action does not match the expected action.')
			return false
		}

		if (github.context.payload.requested_action.identifier === undefined) {
			core.info('The check run does not seem to be of type `requested_action`.')
			return false
		}

		if ((await this.sha()) === '') {
			core.warning('No sha was provided from the action request.')
			return false
		}

		if (!(await this.fromCollaborator())) {
			core.warning(
				'Can not accept an action request from a non-affiliated user.'
			)
			return false
		}

		return true
	}
}
