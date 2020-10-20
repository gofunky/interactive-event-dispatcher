import {Inputs} from './inputs'
import {Api} from './api'
import {context} from '@actions/github'

export interface Dispatchable {
	dispatch: () => Promise<void>
}

interface NameParams {
	workflowName: string
	jobName: string
	eventName?: string
}

export class Reference {
	api: Api

	constructor() {
		this.api = new Api({
			token: Inputs.token,
			actionsToken: Inputs.actionsToken,
			perPage: Inputs.perPage
		})
	}

	static get sourceEvent(): string {
		return Inputs.sourceEvent ?? context.eventName
	}

	static get action(): string {
		return context.payload.action ?? ''
	}

	static checkName({workflowName, jobName, eventName}: NameParams): string {
		return `${workflowName}_${jobName}_${eventName ?? Reference.action}`
	}

	protected static async sleep(duration: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, duration))
	}

	async ref(): Promise<string> {
		return context.ref
	}
}
