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
exports.PullRequestActionEvent = void 0;
const pull_1 = require("./pull");
const github = __importStar(require("@actions/github"));
const core_1 = require("@type-cacheable/core");
const inputs_1 = require("./inputs");
const core = __importStar(require("@actions/core"));
const lazy_get_decorator_1 = require("lazy-get-decorator");
const node_cache_1 = __importDefault(require("node-cache"));
const node_cache_adapter_1 = require("@type-cacheable/node-cache-adapter");
const client = new node_cache_1.default();
node_cache_adapter_1.useAdapter(client);
class PullRequestActionEvent extends pull_1.PullRequestEvent {
    get number() {
        var _a;
        return (_a = super.number) !== null && _a !== void 0 ? _a : github.context.payload.requested_action.identifier;
    }
    get checkEvent() {
        const payload = github.context.payload;
        if (payload.check_run.name != undefined && payload.check_run.name != '') {
            return payload;
        }
    }
    sha() {
        const _super = Object.create(null, {
            sha: { get: () => super.sha }
        });
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            return (_b = (_a = this.checkEvent) === null || _a === void 0 ? void 0 : _a.check_run.head_sha) !== null && _b !== void 0 ? _b : yield _super.sha.call(this);
        });
    }
    triggered() {
        const _super = Object.create(null, {
            triggered: { get: () => super.triggered }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return (yield _super.triggered.call(this)) && (yield this.checkAction());
        });
    }
    fromCollaborator() {
        return __awaiter(this, void 0, void 0, function* () {
            const collaborators = yield this.api.collaborators(inputs_1.Inputs.affiliation);
            return !!collaborators.find(col => { var _a; return col.id == ((_a = this.checkEvent) === null || _a === void 0 ? void 0 : _a.sender.id); });
        });
    }
    checkAction() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (((_a = this.checkEvent) === null || _a === void 0 ? void 0 : _a.check_run.name) != pull_1.CHECK_NAME) {
                core.info('The requested action does not match the expected action.');
                return false;
            }
            if ((yield this.sha()) == '') {
                core.warning('No sha was provided from the action request.');
                return false;
            }
            if (!(yield this.fromCollaborator())) {
                core.warning('Can not accept an action request from a non-affiliated user.');
                return false;
            }
            return true;
        });
    }
}
__decorate([
    lazy_get_decorator_1.LazyGetter()
], PullRequestActionEvent.prototype, "number", null);
__decorate([
    lazy_get_decorator_1.LazyGetter()
], PullRequestActionEvent.prototype, "checkEvent", null);
__decorate([
    core_1.Cacheable()
], PullRequestActionEvent.prototype, "sha", null);
__decorate([
    core_1.Cacheable()
], PullRequestActionEvent.prototype, "triggered", null);
__decorate([
    core_1.Cacheable()
], PullRequestActionEvent.prototype, "fromCollaborator", null);
exports.PullRequestActionEvent = PullRequestActionEvent;
