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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Inputs = exports.NOTICE = void 0;
const core = __importStar(require("@actions/core"));
const lazy_get_decorator_1 = require("lazy-get-decorator");
exports.NOTICE = require('!!mustache-loader!html-loader!markdown-loader!../templates/notice.md');
class Inputs {
    static get token() {
        return core.getInput('token');
    }
    static get actionsToken() {
        return core.getInput('actionsToken');
    }
    static get prefix() {
        return core.getInput('prefix');
    }
    static get commandFilter() {
        return core.getInput('commandFilter')
            .split("\n")
            .filter(x => x !== "")
            .map(cmd => RegExp(cmd).compile());
    }
    static get outsiderCommands() {
        return core.getInput('outsiderCommands').toLowerCase() == 'true';
    }
    static get body() {
        const bodyOpt = core.getInput('body');
        if (bodyOpt == '') {
            return undefined;
        }
        return bodyOpt;
    }
    static get number() {
        const numberOpt = Number(core.getInput('number'));
        if (numberOpt <= 0) {
            return undefined;
        }
        return numberOpt;
    }
    static get event() {
        return core.getInput('event');
    }
    static get pullMode() {
        return core.getInput('pullMode').toLowerCase() == 'true';
    }
    static get forwardChecks() {
        return core.getInput('forwardChecks').toLowerCase() == 'true';
    }
    static get appendCommand() {
        return core.getInput('appendCommand').toLowerCase() == 'true';
    }
    static get interval() {
        return Number(core.getInput('interval'));
    }
    static get perPage() {
        return Number(core.getInput('perPage'));
    }
    static get affiliation() {
        const value = core.getInput('affiliation');
        return value;
    }
}
__decorate([
    lazy_get_decorator_1.LazyGetter(true, true)
], Inputs, "token", null);
__decorate([
    lazy_get_decorator_1.LazyGetter(true, true)
], Inputs, "actionsToken", null);
__decorate([
    lazy_get_decorator_1.LazyGetter(true, true)
], Inputs, "prefix", null);
__decorate([
    lazy_get_decorator_1.LazyGetter(true, true)
], Inputs, "commandFilter", null);
__decorate([
    lazy_get_decorator_1.LazyGetter(true, true)
], Inputs, "outsiderCommands", null);
__decorate([
    lazy_get_decorator_1.LazyGetter(true, true)
], Inputs, "body", null);
__decorate([
    lazy_get_decorator_1.LazyGetter(true, true)
], Inputs, "number", null);
__decorate([
    lazy_get_decorator_1.LazyGetter(true, true)
], Inputs, "event", null);
__decorate([
    lazy_get_decorator_1.LazyGetter(true, true)
], Inputs, "pullMode", null);
__decorate([
    lazy_get_decorator_1.LazyGetter(true, true)
], Inputs, "forwardChecks", null);
__decorate([
    lazy_get_decorator_1.LazyGetter(true, true)
], Inputs, "appendCommand", null);
__decorate([
    lazy_get_decorator_1.LazyGetter(true, true, value => value >= 200)
], Inputs, "interval", null);
__decorate([
    lazy_get_decorator_1.LazyGetter(true, true, value => value >= 10 && value <= 100)
], Inputs, "perPage", null);
__decorate([
    lazy_get_decorator_1.LazyGetter(true, true, value => ['direct', 'outside', 'all'].includes(value))
], Inputs, "affiliation", null);
exports.Inputs = Inputs;
