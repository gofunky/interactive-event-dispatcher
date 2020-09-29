import {IssuesGetCommentResponseData, PullsGetResponseData} from "@octokit/types";
import {EventPayloads} from "@octokit/webhooks";

export interface Payload {
    pull_request: PullsGetResponseData | EventPayloads.WebhookPayloadPullRequestPullRequest
    comment: IssuesGetCommentResponseData
    number: number
    body: string
    command: string
    event: string
    repository: string
    ref: string
    sha: string
}
