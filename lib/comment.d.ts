import { Payload } from "./payload";
import { PullRequestEvent } from "./pull";
import { IssuesGetCommentResponseData } from "@octokit/types";
import { ReactionType } from "./types";
interface Match {
    triggered: boolean;
    command?: string;
    sha?: string;
}
export declare class PullRequestCommentEvent extends PullRequestEvent {
    get number(): number;
    triggerEvent(): Promise<string>;
    commentData(): Promise<IssuesGetCommentResponseData>;
    body(): Promise<string>;
    command(): Promise<string>;
    feedback(reaction: ReactionType): Promise<void>;
    matchedCheck(command: string): Promise<Match>;
    fromCollaborator(): Promise<boolean>;
    matchedPrefix(): Promise<Match>;
    triggered(): Promise<boolean>;
    sha(): Promise<string>;
    payload(): Promise<Payload>;
    dispatch(): Promise<void>;
}
export {};
