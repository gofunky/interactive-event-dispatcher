import type {
	IssuesGetCommentResponseData,
	PullsGetResponseData
} from '@octokit/types'
import type {EventPayloads} from '@octokit/webhooks'

export interface Payload {
	pull_request:
		| PullsGetResponseData
		| EventPayloads.WebhookPayloadPullRequestPullRequest
	comment: IssuesGetCommentResponseData
	number: number
	body: string
	command: string
	sourceEvent: string
	repository: string
	ref: string
	sha: string
}
