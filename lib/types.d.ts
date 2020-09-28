export declare type AffiliationType = 'direct' | 'outside' | 'all';
export declare type WorkflowStatusType = "status" | "completed" | "conclusion";
export declare type CheckStatusType = "queued" | "in_progress" | "completed";
export declare type CheckConclusionType = "success" | "failure" | "neutral" | "cancelled" | "skipped" | "timed_out" | "action_required";
export declare type ReactionType = "+1" | "-1" | "laugh" | "confused" | "heart" | "hooray" | "rocket" | "eyes";
export declare type MinimizeReason = "ABUSE" | "DUPLICATE" | "OFF_TOPIC" | "OUTDATED" | "RESOLVED" | "SPAM";
export interface IssueParams {
    issueNumber: number;
}
export interface NewCommentParams extends IssueParams {
    body: string;
}
export interface CommentParams {
    commentId: number;
}
export interface EventParams {
    eventName: string;
}
export interface DispatchEventParams extends EventParams {
    payload: any;
}
export interface ListRunsParams extends EventParams {
    status?: WorkflowStatusType | undefined;
}
export interface CheckIdParams {
    checkId: number;
}
export interface CheckRelationParams {
    sha: string;
}
export interface CheckParams extends CheckRelationParams {
    name: string;
    status?: CheckStatusType;
    conclusion?: CheckConclusionType;
    detailsUrl?: string;
    externalId?: string;
    startedAt?: string;
    completedAt?: string;
    actions?: {
        label: string;
        description: string;
        identifier: string;
    }[];
    output?: {
        title: string;
        summary: string;
        text?: string;
    };
}
export interface Reaction {
    reaction: ReactionType;
}
export interface MinimizeReasonParams {
    reason: MinimizeReason;
}
export interface GraphNodeParams {
    nodeId: string;
}
export interface WorkflowRunParams {
    runId: number;
}
export interface WorkflowParams {
    workflowId: number;
}
export interface FilterParams {
    filter?: "latest" | "all";
}
export interface CheckSelectorParams {
    name: string;
    ref: string;
}
export interface ApiParams {
    token: string;
    actionsToken: string;
    perPage?: number;
}
