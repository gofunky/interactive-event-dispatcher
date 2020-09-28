import * as core from "@actions/core";
import {LazyGetter} from "lazy-get-decorator";
import {AffiliationType} from "./types";

export class Inputs {
    @LazyGetter(true, true)
    static get token(): string {
        return core.getInput('token')
    }

    @LazyGetter(true, true)
    static get actionsToken(): string {
        return core.getInput('actionsToken')
    }

    @LazyGetter(true, true)
    static get prefix(): string {
        return core.getInput('prefix')
    }

    @LazyGetter(true, true)
    static get commandFilter(): Array<RegExp> {
        return core.getInput('commandFilter')
            .split("\n")
            .filter(x => x !== "")
            .map(cmd => RegExp(cmd).compile())
    }

    @LazyGetter(true, true)
    static get outsiderCommands(): boolean {
        return core.getInput('outsiderCommands').toLowerCase() == 'true'
    }

    @LazyGetter(true, true)
    static get body(): string | undefined {
        const bodyOpt = core.getInput('body')
        if (bodyOpt == '') {
            return undefined
        }
        return bodyOpt
    }

    @LazyGetter(true, true)
    static get number(): number | undefined {
        const numberOpt = Number(core.getInput('number'))
        if (numberOpt <= 0) {
            return undefined
        }
        return numberOpt
    }

    @LazyGetter(true, true)
    static get event(): string {
        return core.getInput('event')
    }

    @LazyGetter(true, true)
    static get pullMode(): boolean {
        return core.getInput('pullMode').toLowerCase() == 'true'
    }

    @LazyGetter(true, true)
    static get forwardChecks(): boolean {
        return core.getInput('forwardChecks').toLowerCase() == 'true'
    }

    @LazyGetter(true, true)
    static get appendCommand(): boolean {
        return core.getInput('appendCommand').toLowerCase() == 'true'
    }

    @LazyGetter(true, true, value => value >= 200)
    static get interval(): number {
        return Number(core.getInput('interval'))
    }

    @LazyGetter(true, true, value => value >= 10 && value <= 100)
    static get perPage(): number {
        return Number(core.getInput('perPage'))
    }

    @LazyGetter(true, true, value => ['direct', 'outside', 'all'].includes(value))
    static get affiliation(): AffiliationType {
        const value = core.getInput('affiliation')
        return <AffiliationType>value
    }
}
