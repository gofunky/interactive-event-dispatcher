import { Event } from "./event";
import { PullsGetResponseData } from "@octokit/types";
import { Payload } from "./payload";
import { EventPayloads } from "@octokit/webhooks";
export declare const NOTICE_HEADER = "<!-- pull request condition notice -->";
export declare const NOTICE: any;
export declare const CHECK_MSG: any;
export declare const ACCEPTED_ASSOCIATIONS: string[];
export declare const CHECK_NAME = "Pending Check";
export declare class PullRequestEvent extends Event {
    get number(): number | undefined;
    get pullEvent(): EventPayloads.WebhookPayloadPullRequestPullRequest | undefined;
    triggered(): Promise<boolean>;
    pullData(): Promise<PullsGetResponseData | EventPayloads.WebhookPayloadPullRequestPullRequest | undefined>;
    repository(): Promise<string>;
    sha(): Promise<string>;
    ref(): Promise<string>;
    branchMatch(branch: string): Promise<boolean>;
    payload(): Promise<Payload>;
    checkAffiliation(): Promise<boolean>;
}
