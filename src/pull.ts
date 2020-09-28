/* eslint-disable @typescript-eslint/no-var-requires */
import * as core from "@actions/core"
import { Event } from "./event"
import {Cacheable} from "@type-cacheable/core";
import * as github from "@actions/github";
import {PullsGetResponseData} from "@octokit/types";
import {Payload} from "./payload";
import {Inputs} from "./inputs";
import NodeCache from "node-cache";
import {useAdapter} from "@type-cacheable/node-cache-adapter";
import {CheckParams} from "./types";

const client = new NodeCache()
useAdapter(client)

const NOTICE_HEADER = '<!-- pull request condition notice -->'
const NOTICE = require('!!mustache-loader!html-loader!markdown-loader!../templates/notice.md')
const CHECK_MSG = require('!!mustache-loader!html-loader!markdown-loader!../templates/check.md')
const ACCEPTED_ASSOCIATIONS = ['OWNER', 'MEMBER', 'COLLABORATOR']

export class PullRequestEvent extends Event {
    get number(): number | undefined {
        return Inputs.number ?? github.context.payload.pull_request?.number
    }

    @Cacheable()
    async triggered(): Promise<boolean> {
        return await super.triggered() && await this.checkAffiliation()
    }

    @Cacheable()
    async pullRequestData(): Promise<PullsGetResponseData | undefined> {
        if (!this.number) {
            core.warning('The issue number could not be determined. No pull request data will be passed in the event.')
            return undefined
        }
        return this.api.pullByNumber(this.number)
    }

    @Cacheable()
    async repository(): Promise<string> {
        const data = await this.pullRequestData()
        return data?.head.repo.full_name ?? await super.repository()
    }

    @Cacheable()
    async sha(): Promise<string> {
        const data = await this.pullRequestData()
        return data?.head.sha ?? await super.sha()
    }

    @Cacheable()
    async ref(): Promise<string> {
        const data = await this.pullRequestData()
        const pullRef = data?.merged ? 'head' : 'merge'
        return this.number ? `refs/pull/${this.number}/${pullRef}` : data?.head.ref ?? await super.ref()
    }

    async branchMatch(branch: string): Promise<boolean> {
        const data = await this.pullRequestData()
        return [
            `refs/pull/${this.number}/head`,
            `refs/pull/${this.number}/merge`,
            `pull/${this.number}/head`,
            `pull/${this.number}/merge`,
            data?.head.ref
        ].includes(branch)
    }

    @Cacheable()
    async payload(): Promise<Payload> {
        const inner = await super.payload()
        inner.pull_request = await this.pullRequestData() ?? inner.pull_request
        inner.number = this.number ?? inner.number
        return inner
    }

    @Cacheable()
    async checkAffiliation(): Promise<boolean> {
        if (!Inputs.pullMode) {
            core.info("Event condition check passed because `inputs.pullMode` is disabled.")
            return true
        }
        if (!this.number) {
            core.error('Event condition check failed because the issue number could not be determined.')
            return false
        }

        const pullRequest = await this.pullRequestData()
        if (!pullRequest) {
            core.info("Event condition check failed because the pull request could not be determined.")
            return false
        }
        if (ACCEPTED_ASSOCIATIONS.includes(pullRequest.author_association)) {
            core.info("Event condition check passed because the pull request author has the required association level.")
            return true
        }

        const comments = await this.api.commentList({issueNumber: this.number})
        const notice = comments.find(value => value.body.includes(NOTICE_HEADER))
        if (!notice) {
            core.info("Notifying pull request author since the notice comment doesn't exist yet.")
            await this.api.reactToIssue({
                issueNumber: this.number,
                reaction: "+1"
            })
            await this.api.respond({
                issueNumber: this.number,
                body: NOTICE({
                    user: pullRequest.user.id,
                    cmd: Inputs.prefix != '' ? `${Inputs.prefix} check <sha>` : 'check <sha>'
                }) + NOTICE_HEADER
            })
        }

        const checkName = `Pending Check`
        const short = await this.short()
        const approveAction = await this.api.getCheck({
            ref: await this.ref(),
            filter: 'latest',
            name: checkName
        })
        const checkData: CheckParams = {
            name: checkName,
            sha: await this.sha(),
            status: "completed",
            conclusion: "action_required",
            output: {
                title: `Pending check of ${short}`,
                summary: `This pull request is waiting for an approval to run all of its checks`,
                text: CHECK_MSG
            },
            actions: [
                {
                    label: "Approve Check",
                    description: `Confirm that commit ${short} is safe to check`,
                    identifier: String(this.number)
                }
            ]
        }
        if (approveAction.total_count == 1) {
            await this.api.updateCheck({
                checkId: approveAction.check_runs[0].id,
                ...checkData
            })
        } else {
            await this.api.createCheck(checkData)
        }

        return false
    }
}
