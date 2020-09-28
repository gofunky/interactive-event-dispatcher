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
exports.check = void 0;
/* eslint-disable @typescript-eslint/no-var-requires */
const core = __importStar(require("@actions/core"));
const event_1 = require("./event");
const NOTICE_HEADER = '<!-- pull request condition notice -->';
const NOTICE = require('!!mustache-loader!html-loader!markdown-loader!../templates/notice.md');
const ACCEPTED_ASSOCIATIONS = ['OWNER', 'MEMBER', 'COLLABORATOR'];
function check(event) {
    return __awaiter(this, void 0, void 0, function* () {
        const pullRequest = yield event.pullRequestData();
        if (!pullRequest) {
            core.info("Event condition check passed because the source event is not related to a pull request.");
            return false;
        }
        if (ACCEPTED_ASSOCIATIONS.includes(pullRequest.author_association)) {
            core.info("Event condition check passed because the pull request author has the required association level.");
            return false;
        }
        const collaborators = yield event.api.collaborators(event_1.Event.affiliation);
        const comments = yield event.api.comments(event_1.Event.number);
        const notice = comments.find(value => {
            return value.body.includes(NOTICE_HEADER);
        });
        if (!notice) {
            yield event.api.respond({
                issueNumber: event_1.Event.number,
                body: NOTICE({
                    user: pullRequest.user.id
                }) + NOTICE_HEADER
            });
        }
        return true;
    });
}
exports.check = check;
