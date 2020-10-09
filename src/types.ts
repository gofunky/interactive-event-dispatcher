import {EventPayloads} from '@octokit/webhooks'

export type AffiliationType = 'direct' | 'outside' | 'all'
export type CheckStatusType = 'queued' | 'in_progress' | 'completed'
export type CheckConclusionType =
	| 'success'
	| 'failure'
	| 'neutral'
	| 'cancelled'
	| 'skipped'
	| 'timed_out'
	| 'action_required'
export type ReactionType =
	| '+1'
	| '-1'
	| 'laugh'
	| 'confused'
	| 'heart'
	| 'hooray'
	| 'rocket'
	| 'eyes'
export type MinimizeReason =
	| 'ABUSE'
	| 'DUPLICATE'
	| 'OFF_TOPIC'
	| 'OUTDATED'
	| 'RESOLVED'
	| 'SPAM'

export interface IssueParams {
	issueNumber: number
}

export interface NewCommentParams extends IssueParams {
	body: string
}

export interface CommentParams {
	commentId: number
}

export interface EventParams {
	eventName: string
}

export interface DispatchEventParams extends EventParams {
	payload: any
}

export interface ListRunsParams extends EventParams {
	status?: CheckStatusType | CheckConclusionType | undefined
}

export interface CheckIdParams {
	checkId: number
}

export interface CheckRelationParams {
	sha: string
}

export interface CheckParams extends CheckRelationParams {
	name: string
	status?: CheckStatusType
	conclusion?: CheckConclusionType
	detailsUrl?: string
	externalId?: string
	startedAt?: string
	completedAt?: string
	actions?: Array<{
		label: string
		description: string
		identifier: string
	}>
	output?: {
		title: string
		summary: string
		text?: string
	}
}

export interface JobParams {
	id: number
	jobData: CheckParams
}

export interface Reaction {
	reaction: ReactionType
}

export interface MinimizeReasonParams {
	reason: MinimizeReason
}

export interface GraphNodeParams {
	nodeId: string
}

export interface WorkflowRunParams {
	runId: number
}

export interface WorkflowParams {
	workflowId: number
}

export interface FilterParams {
	filter?: 'latest' | 'all'
}

export interface CheckSelectorParams {
	name: string | undefined
	ref: string
}

export interface ApiParams {
	token: string
	actionsToken: string
	perPage?: number
}

export interface WorkflowRunPayload
	extends EventPayloads.WebhookPayloadWorkflowRun {
	workflow: {
		badge_url: string
		created_at: string
		html_url: string
		id: number
		name: string
		node_id: string
		path: string
		state: string
		updated_at: string
		url: string
	}
	workflow_run: {
		conclusion: string
		created_at: string
		event: string
		head_branch: string
		head_commit: EventPayloads.WebhookPayloadCheckSuiteCheckSuiteHeadCommit
		head_repository: EventPayloads.WebhookPayloadPullRequestPullRequestHeadRepo
		head_sha: string
		html_url: string
		node_id: string
		repository: EventPayloads.PayloadRepository
		rerun_url: string
		run_number: number
		status: string
		updated_at: string
		url: string
		workflow_id: number
		workflow_url: string
		id: number
	}
}
