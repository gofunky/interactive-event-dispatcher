import { Api } from "./api";
import { Payload } from "./payload";
import { ActionsGetJobForWorkflowRunResponseData, ActionsGetWorkflowResponseData, ChecksCreateResponseData, ChecksUpdateResponseData } from "@octokit/types";
export declare class Event {
    api: Api;
    workflows: Map<number, ActionsGetWorkflowResponseData>;
    jobs: Map<number, ActionsGetJobForWorkflowRunResponseData[]>;
    checks: Map<number, ChecksUpdateResponseData | ChecksCreateResponseData>;
    constructor();
    get sourceEvent(): string;
    triggerEvent(): Promise<string>;
    triggered(): Promise<boolean>;
    repository(): Promise<string>;
    sha(): Promise<string>;
    short(): Promise<string>;
    ref(): Promise<string>;
    branchMatch(branch: string): Promise<boolean>;
    payload(): Promise<Payload>;
    sleep(): Promise<void>;
    dispatch(): Promise<void>;
    checkWorkflows(): Promise<void>;
    updateChecks(): Promise<void>;
}
