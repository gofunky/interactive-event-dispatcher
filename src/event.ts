import {Inputs} from "./inputs";
import * as github from "@actions/github";
import * as core from "@actions/core";
import {Api} from "./api";
import {Payload} from "./payload";
import {
    ActionsGetJobForWorkflowRunResponseData,
    ActionsGetWorkflowResponseData,
    ChecksCreateResponseData,
    ChecksUpdateResponseData
} from "@octokit/types";
import {CheckConclusionType, CheckParams, CheckStatusType} from "./types";
import {memoize} from "memoize-cache-decorator";

export class Event {
    api: Api
    runs = new Map<number, {jobs: ActionsGetJobForWorkflowRunResponseData[], wf: ActionsGetWorkflowResponseData}>()
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

    @memoize()
    async triggerEvent(): Promise<string> {
        return Inputs.event
    }

    @memoize()
    async triggered(): Promise<boolean> {
        return true
    }

    @memoize()
    async repository(): Promise<string> {
        return `${github.context.repo.owner}/${github.context.repo.repo}`
    }

    @memoize()
    async sha(): Promise<string> {
        return github.context.sha
    }

    @memoize()
    async short(): Promise<string> {
        const sha = await this.sha()
        return sha.substr(0, 7)
    }

    @memoize()
    async ref(): Promise<string> {
        return github.context.ref
    }

    async branchMatch(branch: string): Promise<boolean> {
        return branch == await this.ref()
    }

    @memoize()
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

        for (const [runId, {wf}] of this.runs) {
            const jobs = await this.api.jobsForWorkflow({
                runId,
                filter: 'latest'
            })
            this.runs.set(runId, {jobs: jobs.jobs, wf})
            await this.updateChecks(jobs.jobs, wf)
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
                const run = this.runs.get(wfRun.id)
                let wf = run?.wf

                if (!wf) {
                    wf = await this.api.workflowById({
                        workflowId: wfRun.workflow_id
                    })
                }
                this.runs.set(wfRun.id, {
                    jobs: jobs.jobs,
                    wf
                })
                await this.updateChecks(jobs.jobs, wf)
            }
        }

        if (Array.from(this.runs.values()).every((run) => run.jobs.every((job) => job.status == 'completed'))) {
            core.info("All triggered workflow runs are completed.")
            return
        }

        return this.checkWorkflows()
    }

    async updateChecks(jobs: ActionsGetJobForWorkflowRunResponseData[], wf: ActionsGetWorkflowResponseData): Promise<void> {
        const eventName = await this.triggerEvent()
        for (const job of jobs) {
            const name = `${wf.name} / ${job.name} (${eventName})`
            const jobData: CheckParams = {
                sha: await this.sha(),
                name,
                conclusion: job.conclusion ? <CheckConclusionType>job.conclusion : undefined,
                status: <CheckStatusType>job.status,
                completedAt: job.completed_at,
                startedAt: job.started_at,
                externalId: String(job.id),
                detailsUrl: job.html_url
            }
            const existing = this.checks.get(job.id)
            if (existing) {
                const updated = await this.api.updateCheck({
                    checkId: existing.id,
                    ...jobData
                })
                this.checks.set(job.id, updated)
            } else {
                const existing = await this.api.getCheck({
                    ref: await this.ref(),
                    filter: 'latest',
                    name: name
                })
                if (existing.total_count == 1) {
                    const updated = await this.api.updateCheck({
                        checkId: existing.check_runs[0].id,
                        ...jobData
                    })
                    this.checks.set(job.id, updated)
                } else {
                    const created = await this.api.createCheck(jobData)
                    this.checks.set(job.id, created)
                }
            }
        }
    }
}
