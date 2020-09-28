/* eslint-disable @typescript-eslint/no-var-requires */
import {GitHub} from "@actions/github/lib/utils"
import * as github from "@actions/github"
import {graphql} from "@octokit/graphql"
import {
    AffiliationType, ApiParams, CheckIdParams, CheckParams, CheckRelationParams,
    CommentParams,
    DispatchEventParams, GraphNodeParams,
    IssueParams, FilterParams,
    ListRunsParams, MinimizeReasonParams,
    NewCommentParams,
    Reaction, WorkflowParams, WorkflowRunParams, CheckSelectorParams
} from "./types"
import {
    ActionsGetWorkflowResponseData,
    ActionsListJobsForWorkflowRunResponseData,
    ActionsListWorkflowRunsForRepoResponseData,
    ChecksCreateResponseData,
    ChecksCreateSuiteResponseData, ChecksGetResponseData, ChecksListForRefResponseData,
    ChecksUpdateResponseData,
    IssuesCreateCommentResponseData,
    IssuesGetCommentResponseData,
    IssuesListCommentsResponseData,
    OctokitResponse,
    PullsGetResponseData,
    ReactionsCreateForIssueCommentResponseData,
    ReposListCollaboratorsResponseData
} from "@octokit/types"
import {checkServerIdentity} from "tls";

interface RepoRequest {
    repo: string
    owner: string
}

interface RepoListRequest extends RepoRequest {
    per_page: number
}

export class Api {
    private readonly repo: RepoRequest
    private readonly repoList: RepoListRequest
    octokit: InstanceType<typeof GitHub>
    actionsKit: InstanceType<typeof GitHub>
    graphql: any

    constructor({token, actionsToken, perPage}: ApiParams) {
        this.octokit = github.getOctokit(token)
        this.actionsKit = github.getOctokit(actionsToken)
        this.repo = {
            repo: github.context.repo.repo,
            owner: github.context.repo.owner
        }
        this.repoList = {
            ...this.repo,
            per_page: perPage ?? 30
        }
        this.graphql = graphql.defaults({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            headers: {
                authorization: `token ${actionsToken}`,
            }
        })
    }

    async pullByNumber(number: number): Promise<PullsGetResponseData> {
        const {data: data} = await this.octokit.pulls.get({
            ...this.repo,
            pull_number: number
        })
        return data
    }

    async dispatchEvent({eventName, payload}: DispatchEventParams): Promise<OctokitResponse<void>> {
        return this.octokit.repos.createDispatchEvent({
            ...this.repo,
            event_type: eventName,
            client_payload: payload
        })
    }

    async collaborators(affiliation: AffiliationType = 'all'): Promise<ReposListCollaboratorsResponseData> {
        const {data: data} = await this.octokit.repos.listCollaborators({
            ...this.repoList,
            affiliation: affiliation
        })
        return data
    }
    
    async commentList({issueNumber}: IssueParams): Promise<IssuesListCommentsResponseData> {
        const {data: data} = await this.actionsKit.issues.listComments({
            ...this.repoList,
            issue_number: issueNumber
        })
        return data
    }

    async respond({issueNumber, body}: NewCommentParams): Promise<OctokitResponse<IssuesCreateCommentResponseData>> {
        return this.actionsKit.issues.createComment({
            ...this.repo,
            issue_number: issueNumber,
            body: body
        })
    }

    async commentById({commentId}: CommentParams): Promise<IssuesGetCommentResponseData> {
        const {data: data} = await this.actionsKit.issues.getComment({
            ...this.repo,
            comment_id: commentId
        })
        return data
    }

    async reactToComment({commentId, reaction}: Reaction & CommentParams): Promise<OctokitResponse<ReactionsCreateForIssueCommentResponseData>> {
        return this.actionsKit.reactions.createForIssueComment({
            ...this.repo,
            comment_id: commentId,
            content: reaction
        })
    }

    async reactToIssue({reaction, issueNumber}: Reaction & IssueParams): Promise<OctokitResponse<ReactionsCreateForIssueCommentResponseData>> {
        return this.actionsKit.reactions.createForIssue({
            ...this.repo,
            issue_number: issueNumber,
            content: reaction,
        })
    }

    async listRuns({eventName, status}: ListRunsParams): Promise<ActionsListWorkflowRunsForRepoResponseData> {
        const {data: data} = await this.octokit.actions.listWorkflowRunsForRepo({
            ...this.repoList,
            event: eventName,
            status: status
        })
        return data
    }

    async workflowById({workflowId}: WorkflowParams): Promise<ActionsGetWorkflowResponseData> {
        const {data: data} = await this.octokit.actions.getWorkflow({
            ...this.repo,
            workflow_id: workflowId
        })
        return data
    }

    async jobsForWorkflow({runId, filter}: WorkflowRunParams & FilterParams): Promise<ActionsListJobsForWorkflowRunResponseData> {
        const {data: data} = await this.octokit.actions.listJobsForWorkflowRun({
            ...this.repoList,
            run_id: runId,
            filter: filter
        })
        return data
    }

    async getCheck({name, ref, filter}: CheckSelectorParams & FilterParams): Promise<ChecksListForRefResponseData> {
        const {data: data} = await this.actionsKit.checks.listForRef({
            ...this.repoList,
            ref: ref,
            check_name: name,
            filter: filter
        })
        return data
    }

    async createCheck(params: CheckParams): Promise<ChecksCreateResponseData> {
        const {data: data} = await this.actionsKit.checks.create({
            ...this.repo,
            name: params.name,
            head_sha: params.sha,
            status: params.status,
            conclusion: params.conclusion,
            actions: params.actions,
            details_url: params.detailsUrl,
            external_id: params.externalId,
            started_at: params.startedAt,
            completed_at: params.completedAt,
            output: params.output
        })
        return data
    }

    async updateCheck(params: CheckParams & CheckIdParams): Promise<ChecksUpdateResponseData> {
        const {data: data} = await this.actionsKit.checks.update({
            ...this.repo,
            check_run_id: params.checkId,
            name: params.name,
            head_sha: params.sha,
            status: params.status,
            conclusion: params.conclusion,
            actions: params.actions,
            details_url: params.detailsUrl,
            external_id: params.externalId,
            started_at: params.startedAt,
            completed_at: params.completedAt,
            output: params.output
        })
        return data
    }

    async minimizeComment({nodeId, reason}: GraphNodeParams & MinimizeReasonParams): Promise<void> {
        await this.graphql({
            query: `                
            mutation MinimizeComment($comment: ID!, $reason: ReportedContentClassifiers!) {
              minimizeComment(input:{subjectId:$comment, classifier:$reason}) {
                minimizedComment {
                  isMinimized
                }
              }
            }
        `,
            comment: nodeId,
            reason: reason
        })
    }
}
