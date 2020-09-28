import { AffiliationType } from "./types";
export declare class Inputs {
    static get token(): string;
    static get actionsToken(): string;
    static get prefix(): string;
    static get commandFilter(): Array<RegExp>;
    static get outsiderCommands(): boolean;
    static get body(): string | undefined;
    static get number(): number | undefined;
    static get event(): string;
    static get pullMode(): boolean;
    static get forwardChecks(): boolean;
    static get appendCommand(): boolean;
    static get interval(): number;
    static get perPage(): number;
    static get affiliation(): AffiliationType;
}
