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
exports.PullRequestEvent = exports.CHECK_NAME = exports.ACCEPTED_ASSOCIATIONS = exports.CHECK_MSG = exports.NOTICE = exports.NOTICE_HEADER = void 0;
/* eslint-disable @typescript-eslint/no-var-requires */
const core = __importStar(require("@actions/core"));
const event_1 = require("./event");
const core_1 = require("@type-cacheable/core");
const github = __importStar(require("@actions/github"));
const inputs_1 = require("./inputs");
const node_cache_1 = __importDefault(require("node-cache"));
const node_cache_adapter_1 = require("@type-cacheable/node-cache-adapter");
const lazy_get_decorator_1 = require("lazy-get-decorator");
const client = new node_cache_1.default();
node_cache_adapter_1.useAdapter(client);
exports.NOTICE_HEADER = '<!-- pull request condition notice -->';
exports.NOTICE = require('!!mustache-loader!html-loader!markdown-loader!../templates/notice.md');
exports.CHECK_MSG = require('!!mustache-loader!html-loader!markdown-loader!../templates/check.md');
exports.ACCEPTED_ASSOCIATIONS = ['OWNER', 'MEMBER', 'COLLABORATOR'];
exports.CHECK_NAME = 'Pending Check';
class PullRequestEvent extends event_1.Event {
    get number() {
        var _a, _b;
        return (_a = inputs_1.Inputs.number) !== null && _a !== void 0 ? _a : (_b = github.context.payload.pull_request) === null || _b === void 0 ? void 0 : _b.number;
    }
    get pullEvent() {
        const payload = github.context.payload;
        if (payload.pull_request.title != undefined && payload.pull_request.title != '') {
            return payload.pull_request;
        }
    }
    triggered() {
        const _super = Object.create(null, {
            triggered: { get: () => super.triggered }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return (yield _super.triggered.call(this)) && (yield this.checkAffiliation());
        });
    }
    pullData() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.number) {
                core.warning('The issue number could not be determined. No pull request data will be passed in the event.');
                return undefined;
            }
            return (_a = this.pullEvent) !== null && _a !== void 0 ? _a : yield this.api.pullByNumber(this.number);
        });
    }
    repository() {
        const _super = Object.create(null, {
            repository: { get: () => super.repository }
        });
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.pullData();
            return (_a = data === null || data === void 0 ? void 0 : data.head.repo.full_name) !== null && _a !== void 0 ? _a : yield _super.repository.call(this);
        });
    }
    sha() {
        const _super = Object.create(null, {
            sha: { get: () => super.sha }
        });
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.pullData();
            return (_a = data === null || data === void 0 ? void 0 : data.head.sha) !== null && _a !== void 0 ? _a : yield _super.sha.call(this);
        });
    }
    ref() {
        const _super = Object.create(null, {
            ref: { get: () => super.ref }
        });
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.pullData();
            const pullRef = (data === null || data === void 0 ? void 0 : data.merged) ? 'head' : 'merge';
            return this.number ? `refs/pull/${this.number}/${pullRef}` : (_a = data === null || data === void 0 ? void 0 : data.head.ref) !== null && _a !== void 0 ? _a : yield _super.ref.call(this);
        });
    }
    branchMatch(branch) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.pullData();
            return [
                `refs/pull/${this.number}/head`,
                `refs/pull/${this.number}/merge`,
                `pull/${this.number}/head`,
                `pull/${this.number}/merge`,
                data === null || data === void 0 ? void 0 : data.head.ref
            ].includes(branch);
        });
    }
    payload() {
        const _super = Object.create(null, {
            payload: { get: () => super.payload }
        });
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const inner = yield _super.payload.call(this);
            inner.pull_request = (_a = yield this.pullData()) !== null && _a !== void 0 ? _a : inner.pull_request;
            inner.number = (_b = this.number) !== null && _b !== void 0 ? _b : inner.number;
            return inner;
        });
    }
    checkAffiliation() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!inputs_1.Inputs.pullMode) {
                core.info("Event condition check passed because `inputs.pullMode` is disabled.");
                return true;
            }
            if (!this.number) {
                core.error('Event condition check failed because the issue number could not be determined.');
                return false;
            }
            const pullRequest = yield this.pullData();
            if (!pullRequest) {
                core.info("Event condition check failed because the pull request could not be determined.");
                return false;
            }
            if (exports.ACCEPTED_ASSOCIATIONS.includes(pullRequest.author_association)) {
                core.info("Event condition check passed because the pull request author has the required association level.");
                return true;
            }
            const comments = yield this.api.commentList({ issueNumber: this.number });
            const notice = comments.find(value => value.body.includes(exports.NOTICE_HEADER));
            if (!notice) {
                core.info("Notifying pull request author since the notice comment doesn't exist yet.");
                yield this.api.reactToIssue({
                    issueNumber: this.number,
                    reaction: "+1"
                });
                yield this.api.respond({
                    issueNumber: this.number,
                    body: exports.NOTICE({
                        user: pullRequest.user.id,
                        cmd: inputs_1.Inputs.prefix != '' ? `${inputs_1.Inputs.prefix} check <sha>` : 'check <sha>'
                    }) + exports.NOTICE_HEADER
                });
            }
            const sha = yield this.sha();
            const short = yield this.short();
            const approveAction = yield this.api.getCheck({
                ref: yield this.ref(),
                filter: 'latest',
                name: exports.CHECK_NAME
            });
            const checkData = {
                name: exports.CHECK_NAME,
                sha: sha,
                status: "completed",
                conclusion: "action_required",
                output: {
                    title: `Pending check of ${short}`,
                    summary: `This pull request is waiting for an approval to run all of its checks`,
                    text: exports.CHECK_MSG
                },
                actions: [
                    {
                        label: "Approve Check",
                        description: `Confirm that commit ${short} is safe to check`,
                        identifier: String(this.number)
                    }
                ]
            };
            if (approveAction.total_count == 1) {
                const matchedAction = approveAction.check_runs[0];
                if (matchedAction.head_sha != sha) {
                    yield this.api.updateCheck(Object.assign({ checkId: matchedAction.id }, checkData));
                }
            }
            else {
                yield this.api.createCheck(checkData);
            }
            return false;
        });
    }
}
__decorate([
    lazy_get_decorator_1.LazyGetter()
], PullRequestEvent.prototype, "number", null);
__decorate([
    lazy_get_decorator_1.LazyGetter()
], PullRequestEvent.prototype, "pullEvent", null);
__decorate([
    core_1.Cacheable()
], PullRequestEvent.prototype, "triggered", null);
__decorate([
    core_1.Cacheable()
], PullRequestEvent.prototype, "pullData", null);
__decorate([
    core_1.Cacheable()
], PullRequestEvent.prototype, "repository", null);
__decorate([
    core_1.Cacheable()
], PullRequestEvent.prototype, "sha", null);
__decorate([
    core_1.Cacheable()
], PullRequestEvent.prototype, "ref", null);
__decorate([
    core_1.Cacheable()
], PullRequestEvent.prototype, "payload", null);
__decorate([
    core_1.Cacheable()
], PullRequestEvent.prototype, "checkAffiliation", null);
exports.PullRequestEvent = PullRequestEvent;
