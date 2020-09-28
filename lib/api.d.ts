import { GitHub } from "@actions/github/lib/utils";
import { AffiliationType, ApiParams, CheckIdParams, CheckParams, CommentParams, DispatchEventParams, GraphNodeParams, IssueParams, FilterParams, ListRunsParams, MinimizeReasonParams, NewCommentParams, Reaction, WorkflowParams, WorkflowRunParams, CheckSelectorParams } from "./types";
import { ActionsGetWorkflowResponseData, ActionsListJobsForWorkflowRunResponseData, ActionsListWorkflowRunsForRepoResponseData, ChecksCreateResponseData, ChecksListForRefResponseData, ChecksUpdateResponseData, IssuesCreateCommentResponseData, IssuesGetCommentResponseData, IssuesListCommentsResponseData, OctokitResponse, PullsGetResponseData, ReactionsCreateForIssueCommentResponseData, ReposListCollaboratorsResponseData } from "@octokit/types";
export declare class Api {
    private readonly repo;
    private readonly repoList;
    octokit: InstanceType<typeof GitHub>;
    actionsKit: InstanceType<typeof GitHub>;
    graphql: any;
    constructor({ token, actionsToken, perPage }: ApiParams);
    pullByNumber(number: number): Promise<PullsGetResponseData>;
    dispatchEvent({ eventName, payload }: DispatchEventParams): Promise<OctokitResponse<void>>;
    collaborators(affiliation?: AffiliationType): Promise<ReposListCollaboratorsResponseData>;
    commentList({ issueNumber }: IssueParams): Promise<IssuesListCommentsResponseData>;
    respond({ issueNumber, body }: NewCommentParams): Promise<OctokitResponse<IssuesCreateCommentResponseData>>;
    commentById({ commentId }: CommentParams): Promise<IssuesGetCommentResponseData>;
    reactToComment({ commentId, reaction }: Reaction & CommentParams): Promise<OctokitResponse<ReactionsCreateForIssueCommentResponseData>>;
    reactToIssue({ reaction, issueNumber }: Reaction & IssueParams): Promise<OctokitResponse<ReactionsCreateForIssueCommentResponseData>>;
    listRuns({ eventName, status }: ListRunsParams): Promise<ActionsListWorkflowRunsForRepoResponseData>;
    workflowById({ workflowId }: WorkflowParams): Promise<ActionsGetWorkflowResponseData>;
    jobsForWorkflow({ runId, filter }: WorkflowRunParams & FilterParams): Promise<ActionsListJobsForWorkflowRunResponseData>;
    getCheck({ name, ref, filter }: CheckSelectorParams & FilterParams): Promise<ChecksListForRefResponseData>;
    createCheck(params: CheckParams): Promise<ChecksCreateResponseData>;
    updateCheck(params: CheckParams & CheckIdParams): Promise<ChecksUpdateResponseData>;
    minimizeComment({ nodeId, reason }: GraphNodeParams & MinimizeReasonParams): Promise<void>;
}
