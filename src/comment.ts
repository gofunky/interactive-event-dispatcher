import type {Payload} from './payload'
import {PullRequestEvent} from './pull'
import {Inputs} from './inputs'
import * as core from '@actions/core'
import type {IssuesGetCommentResponseData} from '@octokit/types'
import type {ReactionType} from './types'
import {LazyGetter as lazy} from 'lazy-get-decorator'
import type {EventPayloads} from '@octokit/webhooks'
import {memoize} from 'memoize-cache-decorator'
import {context} from '@actions/github'

interface Match {
	triggered: boolean
	command?: string
	sha?: string
}

export class PullRequestCommentEvent extends PullRequestEvent {
	@lazy()
	get number(): number {
		return super.number ?? context.issue.number
	}

	@lazy()
	get commentEvent(): EventPayloads.WebhookPayloadIssueComment | undefined {
		const payload = context.payload as EventPayloads.WebhookPayloadIssueComment

		if (payload.comment !== undefined && payload.comment?.id !== 0) {
			return payload
		}

		return undefined
	}

	@memoize()
	async triggerEvent(): Promise<string> {
		const prefix = await super.triggerEvent()

		if (!Inputs.appendCommand) {
			return prefix
		}
		const command = await this.command()

		if (command === '') {
			return prefix
		}
		const escapedCommand = command.replace(' ', '_')
		return `${prefix}_${escapedCommand}`
	}

	@memoize()
	async commentData(): Promise<
		| IssuesGetCommentResponseData
		| EventPayloads.WebhookPayloadIssueCommentComment
	> {
		const commentId = context.payload.comment?.id ?? 0
		return (
			this.commentEvent?.comment ?? (await this.api.commentById({commentId}))
		)
	}

	@memoize()
	async body(): Promise<string> {
		const comment = await this.commentData()
		return Inputs.body ?? comment.body
	}

	@memoize()
	async command(): Promise<string> {
		if (Inputs.prefixFilter === '') {
			return ''
		}
		const {command} = await this.matchedPrefix()
		return command ?? ''
	}

	@memoize()
	async fromCollaborator(): Promise<boolean> {
		const collaborators = await this.api.collaborators(Inputs.affiliation)
		const comment = await this.commentData()
		return Boolean(collaborators.find((col) => col.id === comment.user.id))
	}

	@memoize()
	async matchedPrefix(): Promise<Match> {
		const body = await this.body()
		const regex = new RegExp(`${Inputs.prefixFilter}\\s*(.*)\\s*$`)
		const matches = regex.exec(body)

		if (!matches || matches.length < 2 || matches[0] === '') {
			core.info(`The issue comment does not match the given prefix.`)
			return {triggered: false}
		}

		const command = matches[matches.length]

		if (Inputs.pullMode) {
			const checkMatch = await this.matchedCheck(command)

			if (checkMatch.triggered) {
				return checkMatch
			}
		}

		if (!Inputs.outsiderCommands && !(await this.fromCollaborator())) {
			await this.feedback('-1')
			core.warning('Can not accept a command from a non-affiliated user.')
			return {triggered: false, command}
		}

		if (Inputs.commandFilter.length === 0) {
			await this.feedback('+1')
			core.info('The issue comment matches the given prefix.')
			return {triggered: true, command}
		}

		const cmdMatch = Inputs.commandFilter.find((cmd) => cmd.exec(command))

		if (cmdMatch) {
			await this.feedback('+1')
			core.warning(`The issue command '${command}' was accepted.`)
			return {triggered: true, command}
		}

		await this.feedback('confused')
		core.warning(`The issue command '${command}' was not accepted.`)
		return {triggered: false, command}
	}

	@memoize()
	async triggered(): Promise<boolean> {
		const {triggered} = await this.matchedPrefix()
		return (await super.triggered()) && triggered
	}

	@memoize()
	async sha(): Promise<string> {
		const {sha} = await this.matchedPrefix()
		return sha ?? (await super.sha())
	}

	@memoize()
	async payload(): Promise<Payload> {
		const inner = await super.payload()
		inner.body = await this.body()
		inner.command = await this.command()
		inner.comment = await this.commentData()
		return inner
	}

	async dispatch(): Promise<void> {
		await super.dispatch()
		const {node_id: nodeId} = await this.commentData()
		await this.api.minimizeComment({
			nodeId,
			reason: 'RESOLVED'
		})
	}

	async feedback(reaction: ReactionType): Promise<void> {
		const commentId = context.payload.comment?.id

		if (commentId) {
			await this.api.reactToComment({
				reaction,
				commentId
			})
		}
	}

	async matchedCheck(command: string): Promise<Match> {
		const checkExp = /^check\\s+([\da-f]+)$/
		const checkMatch = checkExp.exec(command)

		if (checkMatch && checkMatch.length >= 2 && checkMatch[0] !== '') {
			if (await this.fromCollaborator()) {
				await this.feedback('rocket')
				return {triggered: true, command: 'check', sha: checkMatch[1]}
			}

			return {triggered: false}
		}

		return {triggered: false}
	}
}
