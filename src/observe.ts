import {JobParams} from './types'
import {Reference} from './reference'

export class Observer extends Reference {
	async updateCheck(job: JobParams): Promise<void> {
		const existing = await this.api.getCheck({
			ref: await this.ref(),
			filter: 'latest',
			name: job.jobData.name
		})

		if (existing.total_count === 1) {
			await this.api.updateCheck({
				checkId: existing.check_runs[0].id,
				...job.jobData
			})
		} else {
			await this.api.createCheck(job.jobData)
		}
	}
}
