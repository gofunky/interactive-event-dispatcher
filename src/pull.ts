import * as core from '@actions/core'
import {Event} from './event'
import type {PullsGetResponseData} from '@octokit/types'
import type {Payload} from './payload'
import {Inputs} from './inputs'
import type {CheckParams} from './types'
import type {EventPayloads} from '@octokit/webhooks'
import {LazyGetter as lazy} from 'lazy-get-decorator'
import {memoize} from 'memoize-cache-decorator'
import {context} from '@actions/github'
import {compile} from 'micromustache'

export const NOTICE_HEADER = '<!-- pull request condition notice -->'
export const noticeTpl = compile(
	require('!!html-loader!markdown-loader!../templates/notice.md')
)
export const checkMessageTpl = compile(
	require('!!html-loader!markdown-loader!../templates/check.md')
)
export const ACCEPTED_ASSOCIATIONS = ['OWNER', 'MEMBER', 'COLLABORATOR']
export const CHECK_NAME = 'Pending Check'

export class PullRequestEvent extends Event {
	@lazy()
	get number(): number | undefined {
		return Inputs.number ?? context.payload.pull_request?.number
	}

	@lazy()
	get pullEvent():
		| EventPayloads.WebhookPayloadPullRequestPullRequest
		| undefined {
		const payload = context.payload as EventPayloads.WebhookPayloadPullRequest

		if (
			payload.pull_request !== undefined &&
			payload.pull_request?.title !== ''
		) {
			return payload.pull_request
		}

		return undefined
	}

	@memoize()
	async triggered(): Promise<boolean> {
		return (await super.triggered()) && (await this.checkAffiliation())
	}

	@memoize()
	async pullData(): Promise<
		| PullsGetResponseData
		| EventPayloads.WebhookPayloadPullRequestPullRequest
		| undefined
	> {
		if (!this.number) {
			core.warning(
				'The issue number could not be determined. No pull request data will be passed in the event.'
			)
			return undefined
		}

		return this.pullEvent ?? (await this.api.pullByNumber(this.number))
	}

	@memoize()
	async repository(): Promise<string> {
		const data = await this.pullData()
		return data?.head.repo.full_name ?? (await super.repository())
	}

	@memoize()
	async sha(): Promise<string> {
		const data = await this.pullData()
		return data?.head.sha ?? (await super.sha())
	}

	@memoize()
	async ref(): Promise<string> {
		const data = await this.pullData()
		const pullRef = data?.merged ? 'head' : 'merge'
		return this.number
			? `refs/pull/${this.number}/${pullRef}`
			: data?.head.ref ?? (await super.ref())
	}

	@memoize()
	async payload(): Promise<Payload> {
		const inner = await super.payload()
		inner.pull_request = (await this.pullData()) ?? inner.pull_request
		inner.number = this.number ?? inner.number
		return inner
	}

	@memoize()
	async checkAffiliation(): Promise<boolean> {
		if (!Inputs.pullMode) {
			core.info(
				'Event condition check passed because `inputs.pullMode` is disabled.'
			)
			return true
		}

		if (!this.number) {
			core.error(
				'Event condition check failed because the issue number could not be determined.'
			)
			return false
		}

		const pullRequest = await this.pullData()

		if (!pullRequest) {
			core.info(
				'Event condition check failed because the pull request could not be determined.'
			)
			return false
		}

		if (ACCEPTED_ASSOCIATIONS.includes(pullRequest.author_association)) {
			core.info(
				'Event condition check passed because the pull request author has the required association level.'
			)
			return true
		}

		const comments = await this.api.commentList({issueNumber: this.number})
		const notice = comments.find((value) => value.body.includes(NOTICE_HEADER))

		if (!notice) {
			core.info(
				"Notifying pull request author since the notice comment doesn't exist yet."
			)
			await this.api.reactToIssue({
				issueNumber: this.number,
				reaction: '+1'
			})
			await this.api.respond({
				issueNumber: this.number,
				body:
					noticeTpl.render({
						user: pullRequest.user.id,
						cmd:
							Inputs.prefixFilter !== ''
								? `${Inputs.prefixFilter} check <sha>`
								: 'check <sha>'
					}) + NOTICE_HEADER
			})
		}

		const sha = await this.sha()
		const short = await this.short()
		const approveAction = await this.api.getCheck({
			ref: await this.ref(),
			filter: 'latest',
			name: CHECK_NAME
		})
		const checkData: CheckParams = {
			name: CHECK_NAME,
			sha,
			status: 'completed',
			conclusion: 'action_required',
			output: {
				title: `Pending check of ${short}`,
				summary: `This pull request is waiting for an approval to run all of its checks`,
				text: checkMessageTpl.render({})
			},
			actions: [
				{
					label: 'Approve Check',
					description: `Confirm that commit ${short} is safe to check`,
					identifier: String(this.number)
				}
			]
		}

		if (approveAction.total_count === 1) {
			const [matchedAction] = approveAction.check_runs

			if (matchedAction.head_sha !== sha) {
				await this.api.updateCheck({
					checkId: matchedAction.id,
					...checkData
				})
			}
		} else {
			await this.api.createCheck(checkData)
		}

		return false
	}

	async branchMatch(branch: string): Promise<boolean> {
		const data = await this.pullData()

		if (!this.number) {
			return false
		}

		return [
			`refs/pull/${this.number}/head`,
			`refs/pull/${this.number}/merge`,
			`pull/${this.number}/head`,
			`pull/${this.number}/merge`,
			data?.head.ref
		].includes(branch)
	}
}
