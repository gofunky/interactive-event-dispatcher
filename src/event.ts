import {Inputs} from "./inputs";
import * as github from "@actions/github";
import * as core from "@actions/core";
import {Api} from "./api";
import {Payload} from "./payload";
import { useAdapter } from '@type-cacheable/node-cache-adapter'
import NodeCache from "node-cache"
import {Cacheable} from "@type-cacheable/core";
import {
    ActionsGetJobForWorkflowRunResponseData,
    ActionsGetWorkflowResponseData,
    ChecksCreateResponseData,
    ChecksUpdateResponseData
} from "@octokit/types";
import {CheckConclusionType, CheckParams, CheckStatusType} from "./types";

const client = new NodeCache()
useAdapter(client)

export class Event {
    api: Api
    workflows = new Map<number, ActionsGetWorkflowResponseData>()
    jobs = new Map<number, Array<ActionsGetJobForWorkflowRunResponseData>>()
    checks = new Map<number, ChecksCreateResponseData | ChecksUpdateResponseData>()

    constructor() {
        this.api = new Api({
            token: Inputs.token,
            actionsToken: Inputs.actionsToken,
            perPage: Inputs.perPage
        })
    }

    get sourceEvent(): string {
        return github.context.eventName
    }

    @Cacheable()
    async triggerEvent(): Promise<string> {
        return Inputs.event
    }

    @Cacheable()
    async triggered(): Promise<boolean> {
        return true
    }

    @Cacheable()
    async repository(): Promise<string> {
        return `${github.context.repo.owner}/${github.context.repo.repo}`
    }

    @Cacheable()
    async sha(): Promise<string> {
        return github.context.sha
    }

    @Cacheable()
    async short(): Promise<string> {
        const sha = await this.sha()
        return sha.substr(0, 7)
    }

    @Cacheable()
    async ref(): Promise<string> {
        return github.context.ref
    }

    async branchMatch(branch: string): Promise<boolean> {
        return branch == await this.ref()
    }

    @Cacheable()
    async payload(): Promise<Payload> {
        return <Payload>{
            event: this.sourceEvent,
            repository: await this.repository(),
            ref: await this.ref(),
            sha: await this.sha()
        }
    }

    async sleep(): Promise<void> {
        return new Promise( resolve => setTimeout(resolve, Inputs.interval) )
    }

    async dispatch(): Promise<void> {
        if (!await this.triggered()) {
            core.info("Skipping event dispatch because trigger condition is not true.")
            return
        }
        await this.api.dispatchEvent({
            eventName: await this.triggerEvent(),
            payload: await this.payload()
        })

        if (!Inputs.forwardChecks) {
            core.info("Skipping workflow check tracing because `inputs.forwardChecks` is disabled.")
            return
        }
        await this.sleep()
        return this.checkWorkflows()
    }

    async checkWorkflows(): Promise<void> {
        await this.sleep()

        for (const [runId] of this.jobs) {
            const jobs = await this.api.jobsForWorkflow({
                runId: runId,
                filter: 'latest'
            })
            this.jobs[runId] = jobs.jobs
            await this.updateChecks()
        }

        await this.sleep()

        const runWindow = await this.api.listRuns({
            eventName: 'repository_dispatch'
        })

        for (const wfRun of runWindow.workflow_runs) {
            if (wfRun.head_sha == await this.sha()
                && wfRun.head_repository.full_name == await this.repository()
                && await this.branchMatch(wfRun.head_branch)
            ) {
                const jobs = await this.api.jobsForWorkflow({
                    runId: wfRun.id,
                    filter: 'latest'
                })
                this.jobs[wfRun.id] = jobs.jobs

                if (!(wfRun.id in this.workflows.keys())) {
                    this.workflows[wfRun.id] = await this.api.workflowById({
                        workflowId: wfRun.workflow_id
                    })
                }
                await this.updateChecks()
            }
        }

        if (Array.from(this.jobs.values()).every(jobs => jobs.every(job => job.status == 'completed'))) {
            core.info("All triggered workflow runs are completed.")
            return
        }

        return this.checkWorkflows()
    }

    async updateChecks(): Promise<void> {
        const eventName = await this.triggerEvent()
        for (const [runId, jobs] of this.jobs) {
            for (const job of jobs) {
                const wf = this.workflows[runId]
                const name = `${wf.name} / ${job.name} (${eventName})`
                const jobData: CheckParams = {
                    sha: await this.sha(),
                    name: name,
                    conclusion: job.conclusion ? <CheckConclusionType>job.conclusion : undefined,
                    status: <CheckStatusType>job.status,
                    completedAt: job.completed_at,
                    startedAt: job.started_at,
                    externalId: String(runId),
                    detailsUrl: job.html_url
                }
                if (this.checks.has(job.id)) {
                    this.checks[job.id] = await this.api.updateCheck({
                        checkId: this.checks[job.id].id,
                        ...jobData
                    })
                } else {
                    const existing = await this.api.getCheck({
                        ref: await this.ref(),
                        filter: 'latest',
                        name: name
                    })
                    if (existing.total_count == 1) {
                        this.checks[job.id] = await this.api.updateCheck({
                            checkId: existing.check_runs[0].id,
                            ...jobData
                        })
                    } else {
                        this.checks[job.id] = await this.api.createCheck(jobData)
                    }
                }
            }
        }
    }
}
