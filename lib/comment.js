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
exports.PullRequestCommentEvent = void 0;
/* eslint-disable @typescript-eslint/no-var-requires */
const core_1 = require("@type-cacheable/core");
const github = __importStar(require("@actions/github"));
const pull_1 = require("./pull");
const inputs_1 = require("./inputs");
const core = __importStar(require("@actions/core"));
const node_cache_1 = __importDefault(require("node-cache"));
const node_cache_adapter_1 = require("@type-cacheable/node-cache-adapter");
const lazy_get_decorator_1 = require("lazy-get-decorator");
const client = new node_cache_1.default();
node_cache_adapter_1.useAdapter(client);
class PullRequestCommentEvent extends pull_1.PullRequestEvent {
    get number() {
        var _a;
        return (_a = super.number) !== null && _a !== void 0 ? _a : github.context.issue.number;
    }
    triggerEvent() {
        const _super = Object.create(null, {
            triggerEvent: { get: () => super.triggerEvent }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const prefix = yield _super.triggerEvent.call(this);
            if (!inputs_1.Inputs.appendCommand) {
                return prefix;
            }
            const command = yield this.command();
            if (command == '') {
                return prefix;
            }
            return `${prefix}_${command}`;
        });
    }
    get commentEvent() {
        const payload = github.context.payload;
        if (payload.comment.id != undefined && payload.comment.id != 0) {
            return payload;
        }
    }
    commentData() {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const commentId = (_a = github.context.payload.comment) === null || _a === void 0 ? void 0 : _a.id;
            return (_c = (_b = this.commentEvent) === null || _b === void 0 ? void 0 : _b.comment) !== null && _c !== void 0 ? _c : yield this.api.commentById({ commentId: commentId });
        });
    }
    body() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const comment = yield this.commentData();
            return (_a = inputs_1.Inputs.body) !== null && _a !== void 0 ? _a : comment.body;
        });
    }
    command() {
        return __awaiter(this, void 0, void 0, function* () {
            if (inputs_1.Inputs.prefix == '') {
                return '';
            }
            const { command: command } = yield this.matchedPrefix();
            return command !== null && command !== void 0 ? command : '';
        });
    }
    feedback(reaction) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const commentId = (_a = github.context.payload.comment) === null || _a === void 0 ? void 0 : _a.id;
            if (commentId) {
                yield this.api.reactToComment({
                    reaction: reaction,
                    commentId: commentId
                });
            }
        });
    }
    matchedCheck(command) {
        return __awaiter(this, void 0, void 0, function* () {
            const checkExp = new RegExp(`^check\\s+([0-9a-f]+)$`);
            const checkMatch = checkExp.exec(command);
            if (checkMatch && checkMatch.length >= 2 && checkMatch[0] != '') {
                if (yield this.fromCollaborator()) {
                    yield this.feedback("rocket");
                    return { triggered: true, command: 'check', sha: checkMatch[1] };
                }
                return { triggered: false };
            }
            return { triggered: false };
        });
    }
    fromCollaborator() {
        return __awaiter(this, void 0, void 0, function* () {
            const collaborators = yield this.api.collaborators(inputs_1.Inputs.affiliation);
            const comment = yield this.commentData();
            return !!collaborators.find(col => col.id == comment.user.id);
        });
    }
    matchedPrefix() {
        return __awaiter(this, void 0, void 0, function* () {
            const body = yield this.body();
            const regex = new RegExp(`${inputs_1.Inputs.prefix}\\s*(.*)\\s*$`);
            const matches = regex.exec(body);
            if (!matches || matches.length < 2 || matches[0] == '') {
                core.info(`The issue comment does not match the given prefix.`);
                return { triggered: false };
            }
            const command = matches[matches.length];
            if (inputs_1.Inputs.pullMode) {
                const checkMatch = yield this.matchedCheck(command);
                if (checkMatch.triggered) {
                    return checkMatch;
                }
            }
            if (!inputs_1.Inputs.outsiderCommands && !(yield this.fromCollaborator())) {
                yield this.feedback("-1");
                core.warning('Can not accept a command from a non-affiliated user.');
                return { triggered: false, command: command };
            }
            if (inputs_1.Inputs.commandFilter.length == 0) {
                yield this.feedback("+1");
                core.info('The issue comment matches the given prefix.');
                return { triggered: true, command: command };
            }
            const cmdMatch = inputs_1.Inputs.commandFilter.find(cmd => cmd.exec(command));
            if (cmdMatch) {
                yield this.feedback("+1");
                core.warning(`The issue command '${command}' was accepted.`);
                return { triggered: true, command: command };
            }
            yield this.feedback("confused");
            core.warning(`The issue command '${command}' was not accepted.`);
            return { triggered: false, command: command };
        });
    }
    triggered() {
        const _super = Object.create(null, {
            triggered: { get: () => super.triggered }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const { triggered: triggered } = yield this.matchedPrefix();
            return (yield _super.triggered.call(this)) && triggered;
        });
    }
    sha() {
        const _super = Object.create(null, {
            sha: { get: () => super.sha }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const { sha: sha } = yield this.matchedPrefix();
            return sha !== null && sha !== void 0 ? sha : yield _super.sha.call(this);
        });
    }
    payload() {
        const _super = Object.create(null, {
            payload: { get: () => super.payload }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const inner = yield _super.payload.call(this);
            inner.body = yield this.body();
            inner.command = yield this.command();
            inner.comment = yield this.commentData();
            return inner;
        });
    }
    dispatch() {
        const _super = Object.create(null, {
            dispatch: { get: () => super.dispatch }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.dispatch.call(this);
            const { node_id: nodeId } = yield this.commentData();
            yield this.api.minimizeComment({
                nodeId: nodeId,
                reason: "RESOLVED"
            });
        });
    }
}
__decorate([
    lazy_get_decorator_1.LazyGetter()
], PullRequestCommentEvent.prototype, "number", null);
__decorate([
    core_1.Cacheable()
], PullRequestCommentEvent.prototype, "triggerEvent", null);
__decorate([
    lazy_get_decorator_1.LazyGetter()
], PullRequestCommentEvent.prototype, "commentEvent", null);
__decorate([
    core_1.Cacheable()
], PullRequestCommentEvent.prototype, "commentData", null);
__decorate([
    core_1.Cacheable()
], PullRequestCommentEvent.prototype, "body", null);
__decorate([
    core_1.Cacheable()
], PullRequestCommentEvent.prototype, "command", null);
__decorate([
    core_1.Cacheable()
], PullRequestCommentEvent.prototype, "matchedCheck", null);
__decorate([
    core_1.Cacheable()
], PullRequestCommentEvent.prototype, "fromCollaborator", null);
__decorate([
    core_1.Cacheable()
], PullRequestCommentEvent.prototype, "matchedPrefix", null);
__decorate([
    core_1.Cacheable()
], PullRequestCommentEvent.prototype, "triggered", null);
__decorate([
    core_1.Cacheable()
], PullRequestCommentEvent.prototype, "sha", null);
__decorate([
    core_1.Cacheable()
], PullRequestCommentEvent.prototype, "payload", null);
exports.PullRequestCommentEvent = PullRequestCommentEvent;
