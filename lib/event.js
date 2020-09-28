"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const inputs_1 = require("./inputs");
const github = __importStar(require("@actions/github"));
const core = __importStar(require("@actions/core"));
const api_1 = require("./api");
const node_cache_adapter_1 = require("@type-cacheable/node-cache-adapter");
const node_cache_1 = __importDefault(require("node-cache"));
const core_1 = require("@type-cacheable/core");
const client = new node_cache_1.default();
node_cache_adapter_1.useAdapter(client);
class Event {
    constructor() {
        this.workflows = new Map();
        this.jobs = new Map();
        this.checks = new Map();
        this.api = new api_1.Api({
            token: inputs_1.Inputs.token,
            actionsToken: inputs_1.Inputs.actionsToken,
            perPage: inputs_1.Inputs.perPage
        });
    }
    get sourceEvent() {
        return github.context.eventName;
    }
    triggerEvent() {
        return __awaiter(this, void 0, void 0, function* () {
            return inputs_1.Inputs.event;
        });
    }
    triggered() {
        return __awaiter(this, void 0, void 0, function* () {
            return true;
        });
    }
    repository() {
        return __awaiter(this, void 0, void 0, function* () {
            return `${github.context.repo.owner}/${github.context.repo.repo}`;
        });
    }
    sha() {
        return __awaiter(this, void 0, void 0, function* () {
            return github.context.sha;
        });
    }
    short() {
        return __awaiter(this, void 0, void 0, function* () {
            const sha = yield this.sha();
            return sha.substr(0, 7);
        });
    }
    ref() {
        return __awaiter(this, void 0, void 0, function* () {
            return github.context.ref;
        });
    }
    branchMatch(branch) {
        return __awaiter(this, void 0, void 0, function* () {
            return branch == (yield this.ref());
        });
    }
    payload() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                event: this.sourceEvent,
                repository: yield this.repository(),
                ref: yield this.ref(),
                sha: yield this.sha()
            };
        });
    }
    sleep() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, inputs_1.Inputs.interval));
        });
    }
    dispatch() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield this.triggered())) {
                core.info("Skipping event dispatch because trigger condition is not true.");
                return;
            }
            yield this.api.dispatchEvent({
                eventName: yield this.triggerEvent(),
                payload: yield this.payload()
            });
            if (!inputs_1.Inputs.forwardChecks) {
                core.info("Skipping workflow check tracing because `inputs.forwardChecks` is disabled.");
                return;
            }
            yield this.sleep();
            return this.checkWorkflows();
        });
    }
    checkWorkflows() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sleep();
            for (const [runId] of this.jobs) {
                const jobs = yield this.api.jobsForWorkflow({
                    runId: runId,
                    filter: 'latest'
                });
                this.jobs[runId] = jobs.jobs;
                yield this.updateChecks();
            }
            yield this.sleep();
            const runWindow = yield this.api.listRuns({
                eventName: 'repository_dispatch'
            });
            for (const wfRun of runWindow.workflow_runs) {
                if (wfRun.head_sha == (yield this.sha())
                    && wfRun.head_repository.full_name == (yield this.repository())
                    && (yield this.branchMatch(wfRun.head_branch))) {
                    const jobs = yield this.api.jobsForWorkflow({
                        runId: wfRun.id,
                        filter: 'latest'
                    });
                    this.jobs[wfRun.id] = jobs.jobs;
                    if (!(wfRun.id in this.workflows.keys())) {
                        this.workflows[wfRun.id] = yield this.api.workflowById({
                            workflowId: wfRun.workflow_id
                        });
                    }
                    yield this.updateChecks();
                }
            }
            if (Array.from(this.jobs.values()).every(jobs => jobs.every(job => job.status == 'completed'))) {
                core.info("All triggered workflow runs are completed.");
                return;
            }
            return this.checkWorkflows();
        });
    }
    updateChecks() {
        return __awaiter(this, void 0, void 0, function* () {
            const eventName = yield this.triggerEvent();
            for (const [runId, jobs] of this.jobs) {
                for (const job of jobs) {
                    const wf = this.workflows[runId];
                    const name = `${wf.name} / ${job.name} (${eventName})`;
                    const jobData = {
                        sha: yield this.sha(),
                        name: name,
                        conclusion: job.conclusion ? job.conclusion : undefined,
                        status: job.status,
                        completedAt: job.completed_at,
                        startedAt: job.started_at,
                        externalId: String(runId),
                        detailsUrl: job.html_url
                    };
                    if (this.checks.has(job.id)) {
                        this.checks[job.id] = yield this.api.updateCheck(Object.assign({ checkId: this.checks[job.id].id }, jobData));
                    }
                    else {
                        const existing = yield this.api.getCheck({
                            ref: yield this.ref(),
                            filter: 'latest',
                            name: name
                        });
                        if (existing.total_count == 1) {
                            this.checks[job.id] = yield this.api.updateCheck(Object.assign({ checkId: existing.check_runs[0].id }, jobData));
                        }
                        else {
                            this.checks[job.id] = yield this.api.createCheck(jobData);
                        }
                    }
                }
            }
        });
    }
}
__decorate([
    core_1.Cacheable()
], Event.prototype, "triggerEvent", null);
__decorate([
    core_1.Cacheable()
], Event.prototype, "triggered", null);
__decorate([
    core_1.Cacheable()
], Event.prototype, "repository", null);
__decorate([
    core_1.Cacheable()
], Event.prototype, "sha", null);
__decorate([
    core_1.Cacheable()
], Event.prototype, "short", null);
__decorate([
    core_1.Cacheable()
], Event.prototype, "ref", null);
__decorate([
    core_1.Cacheable()
], Event.prototype, "payload", null);
exports.Event = Event;
