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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Api = void 0;
const github = __importStar(require("@actions/github"));
const graphql_1 = require("@octokit/graphql");
class Api {
    constructor({ token, actionsToken, perPage }) {
        this.octokit = github.getOctokit(token);
        this.actionsKit = github.getOctokit(actionsToken);
        this.repo = {
            repo: github.context.repo.repo,
            owner: github.context.repo.owner
        };
        this.repoList = Object.assign(Object.assign({}, this.repo), { per_page: perPage !== null && perPage !== void 0 ? perPage : 30 });
        this.graphql = graphql_1.graphql.defaults({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            headers: {
                authorization: `token ${actionsToken}`,
            }
        });
    }
    pullByNumber(number) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: data } = yield this.octokit.pulls.get(Object.assign(Object.assign({}, this.repo), { pull_number: number }));
            return data;
        });
    }
    dispatchEvent({ eventName, payload }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.octokit.repos.createDispatchEvent(Object.assign(Object.assign({}, this.repo), { event_type: eventName, client_payload: payload }));
        });
    }
    collaborators(affiliation = 'all') {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: data } = yield this.octokit.repos.listCollaborators(Object.assign(Object.assign({}, this.repoList), { affiliation: affiliation }));
            return data;
        });
    }
    commentList({ issueNumber }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: data } = yield this.actionsKit.issues.listComments(Object.assign(Object.assign({}, this.repoList), { issue_number: issueNumber }));
            return data;
        });
    }
    respond({ issueNumber, body }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.actionsKit.issues.createComment(Object.assign(Object.assign({}, this.repo), { issue_number: issueNumber, body: body }));
        });
    }
    commentById({ commentId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: data } = yield this.actionsKit.issues.getComment(Object.assign(Object.assign({}, this.repo), { comment_id: commentId }));
            return data;
        });
    }
    reactToComment({ commentId, reaction }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.actionsKit.reactions.createForIssueComment(Object.assign(Object.assign({}, this.repo), { comment_id: commentId, content: reaction }));
        });
    }
    reactToIssue({ reaction, issueNumber }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.actionsKit.reactions.createForIssue(Object.assign(Object.assign({}, this.repo), { issue_number: issueNumber, content: reaction }));
        });
    }
    listRuns({ eventName, status }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: data } = yield this.octokit.actions.listWorkflowRunsForRepo(Object.assign(Object.assign({}, this.repoList), { event: eventName, status: status }));
            return data;
        });
    }
    workflowById({ workflowId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: data } = yield this.octokit.actions.getWorkflow(Object.assign(Object.assign({}, this.repo), { workflow_id: workflowId }));
            return data;
        });
    }
    jobsForWorkflow({ runId, filter }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: data } = yield this.octokit.actions.listJobsForWorkflowRun(Object.assign(Object.assign({}, this.repoList), { run_id: runId, filter: filter }));
            return data;
        });
    }
    getCheck({ name, ref, filter }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: data } = yield this.actionsKit.checks.listForRef(Object.assign(Object.assign({}, this.repoList), { ref: ref, check_name: name, filter: filter }));
            return data;
        });
    }
    createCheck(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: data } = yield this.actionsKit.checks.create(Object.assign(Object.assign({}, this.repo), { name: params.name, head_sha: params.sha, status: params.status, conclusion: params.conclusion, actions: params.actions, details_url: params.detailsUrl, external_id: params.externalId, started_at: params.startedAt, completed_at: params.completedAt, output: params.output }));
            return data;
        });
    }
    updateCheck(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: data } = yield this.actionsKit.checks.update(Object.assign(Object.assign({}, this.repo), { check_run_id: params.checkId, name: params.name, head_sha: params.sha, status: params.status, conclusion: params.conclusion, actions: params.actions, details_url: params.detailsUrl, external_id: params.externalId, started_at: params.startedAt, completed_at: params.completedAt, output: params.output }));
            return data;
        });
    }
    minimizeComment({ nodeId, reason }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.graphql({
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
                reason: reason
            });
        });
    }
}
exports.Api = Api;
