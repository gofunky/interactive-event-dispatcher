import {graphql} from '@octokit/graphql'
import type {
	AffiliationType,
	ApiParams,
	CheckIdParams,
	CheckParams,
	CommentParams,
	DispatchEventParams,
	GraphNodeParams,
	IssueParams,
	FilterParams,
	MinimizeReasonParams,
	NewCommentParams,
	Reaction,
	WorkflowRunParams,
	CheckSelectorParams,
	WorkflowParams,
	ListRunsParams,
	JobId
} from './types'
import type {
	ActionsGetWorkflowResponseData,
	ActionsListJobsForWorkflowRunResponseData,
	ActionsListWorkflowRunsForRepoResponseData,
	ChecksCreateResponseData,
	ChecksListForRefResponseData,
	ChecksUpdateResponseData,
	IssuesCreateCommentResponseData,
	IssuesGetCommentResponseData,
	IssuesListCommentsResponseData,
	OctokitResponse,
	PullsGetResponseData,
	ReactionsCreateForIssueCommentResponseData,
	ReposListCollaboratorsResponseData
} from '@octokit/types'
import {getOctokitOptions, GitHub} from '@actions/github/lib/utils'
import {context} from '@actions/github'
import * as core from '@actions/core'
import {CatchAll as catchAll} from '@magna_shogun/catch-decorator'
import {retry} from '@octokit/plugin-retry'

const ConstLogger = {
	debug: core.debug,
	info: core.info,
	warn: core.warning,
	error: core.error
}

const RetryingOctokit = GitHub.plugin(retry)

interface RepoRequest {
	repo: string
	owner: string
}

interface RepoListRequest extends RepoRequest {
	per_page: number
}

@catchAll((err) => {
	core.error(err.stack ?? err)
	throw new Error('This API call failed')
})
export class Api {
	octokit: InstanceType<typeof GitHub>
	actionsKit: InstanceType<typeof GitHub>
	graphql: any

	private readonly repo: RepoRequest
	private readonly repoList: RepoListRequest

	constructor({token, actionsToken, perPage}: ApiParams) {
		this.octokit = new RetryingOctokit(
			getOctokitOptions(token, {
				log: ConstLogger,
				userAgent: 'gofunky/interactive-event-dispatcher/pat'
			})
		)
		this.actionsKit = new RetryingOctokit(
			getOctokitOptions(actionsToken, {
				log: ConstLogger,
				userAgent: 'gofunky/interactive-event-dispatcher/gh'
			})
		)
		this.repo = {
			repo: context.repo.repo,
			owner: context.repo.owner
		}
		this.repoList = {
			...this.repo,
			per_page: perPage ?? 30
		}
		this.graphql = graphql.defaults({
			owner: context.repo.owner,
			repo: context.repo.repo,
			headers: {
				authorization: `token ${actionsToken}`
			}
		})
	}

	async pullByNumber(
		pull_number: number
	): Promise<PullsGetResponseData | undefined> {
		try {
			const {data} = await this.octokit.pulls.get({
				...this.repo,
				pull_number
			})
			return data
		} catch {
			core.warning(`Issue number ${pull_number} is not a pull request`)
			return undefined
		}
	}

	async dispatchEvent({
		eventName,
		payload
	}: DispatchEventParams): Promise<OctokitResponse<void>> {
		return this.octokit.repos.createDispatchEvent({
			...this.repo,
			event_type: eventName,
			client_payload: payload
		})
	}

	async collaborators(
		affiliation: AffiliationType = 'all'
	): Promise<ReposListCollaboratorsResponseData> {
		const {data} = await this.octokit.repos.listCollaborators({
			...this.repoList,
			affiliation
		})
		return data
	}

	async commentList({
		issueNumber
	}: IssueParams): Promise<IssuesListCommentsResponseData> {
		const {data} = await this.actionsKit.issues.listComments({
			...this.repoList,
			issue_number: issueNumber
		})
		return data
	}

	async respond({
		issueNumber,
		body
	}: NewCommentParams): Promise<
		OctokitResponse<IssuesCreateCommentResponseData>
	> {
		return this.actionsKit.issues.createComment({
			...this.repo,
			issue_number: issueNumber,
			body
		})
	}

	async commentById({
		commentId
	}: CommentParams): Promise<IssuesGetCommentResponseData> {
		const {data} = await this.actionsKit.issues.getComment({
			...this.repo,
			comment_id: commentId
		})
		return data
	}

	async reactToComment({
		commentId,
		reaction
	}: Reaction & CommentParams): Promise<
		OctokitResponse<ReactionsCreateForIssueCommentResponseData>
	> {
		return this.actionsKit.reactions.createForIssueComment({
			...this.repo,
			comment_id: commentId,
			content: reaction
		})
	}

	async reactToIssue({
		reaction,
		issueNumber
	}: Reaction & IssueParams): Promise<
		OctokitResponse<ReactionsCreateForIssueCommentResponseData>
	> {
		return this.actionsKit.reactions.createForIssue({
			...this.repo,
			issue_number: issueNumber,
			content: reaction
		})
	}

	async listRuns({
		status,
		eventName
	}: ListRunsParams): Promise<ActionsListWorkflowRunsForRepoResponseData> {
		const {data} = await this.octokit.actions.listWorkflowRunsForRepo({
			...this.repoList,
			event: eventName,
			// @ts-expect-error
			status
		})
		return data
	}

	async workflowById({
		workflowId
	}: WorkflowParams): Promise<ActionsGetWorkflowResponseData> {
		const {data} = await this.octokit.actions.getWorkflow({
			...this.repo,
			workflow_id: workflowId
		})
		return data
	}

	async jobsForWorkflow({
		runId,
		filter
	}: WorkflowRunParams & FilterParams): Promise<
		ActionsListJobsForWorkflowRunResponseData
	> {
		const {data} = await this.octokit.actions.listJobsForWorkflowRun({
			...this.repoList,
			run_id: runId,
			filter
		})
		return data
	}

	async logForJob({id}: JobId): Promise<string> {
		const {data} = await this.octokit.actions.downloadJobLogsForWorkflowRun({
			...this.repo,
			job_id: id
		})
		return data
	}

	async getCheck({
		name,
		ref,
		filter
	}: CheckSelectorParams & FilterParams): Promise<
		ChecksListForRefResponseData
	> {
		const {data} = await this.actionsKit.checks.listForRef({
			...this.repoList,
			ref,
			check_name: name,
			filter
		})
		return data
	}

	async createCheck(
		parameters: CheckParams
	): Promise<ChecksCreateResponseData> {
		const {data} = await this.actionsKit.checks.create({
			...this.repo,
			name: parameters.name,
			head_sha: parameters.sha,
			status: parameters.status,
			conclusion: parameters.conclusion,
			actions: parameters.actions,
			details_url: parameters.detailsUrl,
			external_id: parameters.externalId,
			started_at: parameters.startedAt,
			completed_at: parameters.completedAt,
			output: parameters.output
		})
		return data
	}

	async updateCheck(
		parameters: CheckParams & CheckIdParams
	): Promise<ChecksUpdateResponseData> {
		const {data} = await this.actionsKit.checks.update({
			...this.repo,
			check_run_id: parameters.checkId,
			name: parameters.name,
			head_sha: parameters.sha,
			status: parameters.status,
			conclusion: parameters.conclusion,
			actions: parameters.actions,
			details_url: parameters.detailsUrl,
			external_id: parameters.externalId,
			started_at: parameters.startedAt,
			completed_at: parameters.completedAt,
			output: parameters.output
		})
		return data
	}

	async minimizeComment({
		nodeId,
		reason
	}: GraphNodeParams & MinimizeReasonParams): Promise<void> {
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
			reason
		})
	}
}
