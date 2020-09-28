import { IssuesGetCommentResponseData, PullsGetResponseData } from "@octokit/types";
export interface Payload {
    pull_request: PullsGetResponseData;
    comment: IssuesGetCommentResponseData;
    number: number;
    body: string;
    command: string;
    event: string;
    repository: string;
    ref: string;
    sha: string;
}
