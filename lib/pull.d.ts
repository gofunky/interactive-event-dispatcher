import { Event } from "./event";
import { PullsGetResponseData } from "@octokit/types";
import { Payload } from "./payload";
export declare class PullRequestEvent extends Event {
    get number(): number | undefined;
    triggered(): Promise<boolean>;
    pullRequestData(): Promise<PullsGetResponseData | undefined>;
    repository(): Promise<string>;
    sha(): Promise<string>;
    ref(): Promise<string>;
    branchMatch(branch: string): Promise<boolean>;
    payload(): Promise<Payload>;
    checkAffiliation(): Promise<boolean>;
}
