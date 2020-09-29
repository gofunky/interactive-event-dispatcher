import { PullRequestEvent } from "./pull";
import { EventPayloads } from "@octokit/webhooks";
export declare class PullRequestActionEvent extends PullRequestEvent {
    get number(): number;
    get checkEvent(): EventPayloads.WebhookPayloadCheckRun | undefined;
    sha(): Promise<string>;
    triggered(): Promise<boolean>;
    fromCollaborator(): Promise<boolean>;
    checkAction(): Promise<boolean>;
}
