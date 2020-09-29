/* eslint-disable @typescript-eslint/no-var-requires */
import {Cacheable} from "@type-cacheable/core";
import * as github from "@actions/github";
import {Payload} from "./payload";
import {PullRequestEvent} from "./pull";
import {Inputs} from "./inputs";
import * as core from "@actions/core";
import NodeCache from "node-cache";
import {useAdapter} from "@type-cacheable/node-cache-adapter"
import {IssuesGetCommentResponseData} from "@octokit/types"
import {ReactionType} from "./types";
import {LazyGetter} from "lazy-get-decorator";
import {EventPayloads} from "@octokit/webhooks";
import WebhookPayloadIssueCommentComment = EventPayloads.WebhookPayloadIssueCommentComment;

const client = new NodeCache()
useAdapter(client)

interface Match {
    triggered: boolean
    command?: string
    sha?: string
}

export class PullRequestCommentEvent extends PullRequestEvent {

    @LazyGetter()
    get number(): number {
        return super.number ?? github.context.issue.number
    }

    @Cacheable()
    async triggerEvent(): Promise<string> {
        const prefix = await super.triggerEvent()
        if (!Inputs.appendCommand) {
            return prefix
        }
        const command = await this.command()
        if (command == '') {
            return prefix
        }
        return `${prefix}_${command}`
    }

    @LazyGetter()
    get commentEvent(): EventPayloads.WebhookPayloadIssueComment | undefined {
        const payload = <EventPayloads.WebhookPayloadIssueComment>github.context.payload
        if (payload.comment.id != undefined && payload.comment.id != 0) {
            return payload
        }
    }

    @Cacheable()
    async commentData(): Promise<IssuesGetCommentResponseData | WebhookPayloadIssueCommentComment> {
        const commentId = <number>github.context.payload.comment?.id
        return this.commentEvent?.comment ?? await this.api.commentById({commentId: commentId})
    }

    @Cacheable()
    async body(): Promise<string> {
        const comment = await this.commentData()
        return Inputs.body ?? comment.body
    }

    @Cacheable()
    async command(): Promise<string> {
        if (Inputs.prefix == '') {
            return ''
        }
        const {command: command} = await this.matchedPrefix()
        return command ?? ''
    }

    async feedback(reaction: ReactionType): Promise<void> {
        const commentId = github.context.payload.comment?.id
        if (commentId) {
            await this.api.reactToComment({
                reaction: reaction,
                commentId: commentId
            })
        }
    }

    @Cacheable()
    async matchedCheck(command: string): Promise<Match> {
        const checkExp = new RegExp(`^check\\s+([0-9a-f]+)$`)
        const checkMatch = checkExp.exec(command)
        if (checkMatch && checkMatch.length >= 2 && checkMatch[0] != '') {
            if (await this.fromCollaborator()) {
                await this.feedback("rocket")
                return {triggered: true, command: 'check', sha: checkMatch[1]}
            }
            return {triggered: false}
        }
        return {triggered: false}
    }

    @Cacheable()
    async fromCollaborator(): Promise<boolean> {
        const collaborators = await this.api.collaborators(Inputs.affiliation)
        const comment = await this.commentData()
        return !!collaborators.find(col => col.id == comment.user.id)
    }

    @Cacheable()
    async matchedPrefix(): Promise<Match> {
        const body = await this.body()
        const regex = new RegExp(`${Inputs.prefix}\\s*(.*)\\s*$`)
        const matches = regex.exec(body)
        if (!matches || matches.length < 2 || matches[0] == '') {
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
            await this.feedback("-1")
            core.warning('Can not accept a command from a non-affiliated user.')
            return {triggered: false, command: command}
        }
        if (Inputs.commandFilter.length == 0) {
            await this.feedback("+1")
            core.info('The issue comment matches the given prefix.')
            return {triggered: true, command: command}
        }

        const cmdMatch = Inputs.commandFilter.find(cmd => cmd.exec(command))
        if (cmdMatch) {
            await this.feedback("+1")
            core.warning(`The issue command '${command}' was accepted.`)
            return {triggered: true, command: command}
        }

        await this.feedback("confused")
        core.warning(`The issue command '${command}' was not accepted.`)
        return {triggered: false, command: command}
    }

    @Cacheable()
    async triggered(): Promise<boolean> {
        const {triggered: triggered} = await this.matchedPrefix()
        return await super.triggered() && triggered
    }

    @Cacheable()
    async sha(): Promise<string> {
        const {sha: sha} = await this.matchedPrefix()
        return sha ?? await super.sha()
    }

    @Cacheable()
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
            nodeId: nodeId,
            reason: "RESOLVED"
        })
    }
}
