import * as core from '@actions/core'
import {LazyGetter as lazy} from 'lazy-get-decorator'
import type {AffiliationType} from './types'

export class Inputs {
	@lazy(true, true)
	static get token(): string {
		return core.getInput('token')
	}

	@lazy(true, true)
	static get actionsToken(): string {
		return core.getInput('actionsToken')
	}

	@lazy(true, true)
	static get prefixFilter(): string {
		return core.getInput('prefixFilter')
	}

	@lazy(true, true)
	static get commandFilter(): RegExp[] {
		return core
			.getInput('commandFilter')
			.split('\n')
			.filter((x) => x !== '')
			.map((cmd) => new RegExp(cmd).compile())
	}

	@lazy(true, true)
	static get outsiderCommands(): boolean {
		return core.getInput('outsiderCommands').toLowerCase() === 'true'
	}

	@lazy(true, true)
	static get body(): string | undefined {
		const bodyOpt = core.getInput('body')

		if (bodyOpt === '') {
			return undefined
		}

		return bodyOpt
	}

	@lazy(true, true)
	static get number(): number | undefined {
		const numberOpt = Number(core.getInput('number'))

		if (numberOpt <= 0) {
			return undefined
		}

		return numberOpt
	}

	@lazy(true, true)
	static get commentId(): number | undefined {
		const commentIdOpt = Number(core.getInput('commentId'))

		if (commentIdOpt <= 0) {
			return undefined
		}

		return commentIdOpt
	}

	@lazy(true, true)
	static get sourceEvent(): string | undefined {
		const sourceEventOpt = core.getInput('sourceEvent')

		if (sourceEventOpt === '') {
			return undefined
		}

		return sourceEventOpt
	}

	@lazy(true, true)
	static get event(): string {
		return core.getInput('event')
	}

	@lazy(true, true)
	static get pullMode(): boolean {
		return core.getInput('pullMode').toLowerCase() === 'true'
	}

	@lazy(true, true)
	static get observingChecks(): boolean {
		return core.getInput('observingChecks').toLowerCase() === 'true'
	}

	@lazy(true, true)
	static get appendCommand(): boolean {
		return core.getInput('appendCommand').toLowerCase() === 'true'
	}

	@lazy(true, true, (value: number) => value >= 200)
	static get interval(): number {
		return Number(core.getInput('interval'))
	}

	@lazy(true, true, (value: number) => value >= 10 && value <= 100)
	static get perPage(): number {
		return Number(core.getInput('perPage'))
	}

	@lazy(true, true, (value: string) =>
		['direct', 'outside', 'all'].includes(value)
	)
	static get affiliation(): AffiliationType {
		return <AffiliationType>core.getInput('perPage')
	}
}
