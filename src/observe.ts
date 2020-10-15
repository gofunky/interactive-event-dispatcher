import {JobParams} from './types'
import {Reference} from './reference'
import * as core from '@actions/core'

export class Observer extends Reference {
	async updateCheck(job: JobParams): Promise<void> {
		const existing = await this.api.getCheck({
			ref: await this.ref(),
			filter: 'latest',
			name: job.jobData.name
		})

		if (existing.total_count === 1) {
			const check = await this.api.updateCheck({
				checkId: existing.check_runs[0].id,
				...job.jobData
			})
			core.info(
				`The check '${job.jobData.name}' has been updated successfully with id '${check.id}'.`
			)
		} else {
			const check = await this.api.createCheck(job.jobData)
			core.info(
				`The check '${job.jobData.name}' has been created successfully with id '${check.id}'.`
			)
		}
	}
}
