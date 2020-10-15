import type {
	IssuesGetCommentResponseData,
	PullsGetResponseData
} from '@octokit/types'
import type {EventPayloads} from '@octokit/webhooks'

export interface Payload {
	pull_request:
		| PullsGetResponseData
		| EventPayloads.WebhookPayloadPullRequestPullRequest
		| undefined
	comment: IssuesGetCommentResponseData | undefined
	number: number | undefined
	body: string | undefined
	command: string | undefined
	sourceEvent: string
	triggerEvent: string
	repository: string
	ref: string
	sha: string
	short: string
}
