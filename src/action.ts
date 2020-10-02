import * as core from '@actions/core'
import {Event} from './event'
import {PullRequestActionEvent} from './approval'
import {PullRequestCommentEvent} from './comment'
import {PullRequestEvent} from './pull'

async function run(): Promise<void> {
	let event: Event
	switch (Event.sourceEvent) {
		case 'check_run':
			event = new PullRequestActionEvent()
			break
		case 'issue_comment':
			event = new PullRequestCommentEvent()
			core.setOutput(
				'command',
				await (<PullRequestCommentEvent>event).command()
			)
			break
		case 'pull_request':
		case 'pull_request_review':
		case 'pull_request_review_comment':
			event = new PullRequestEvent()
			break
		default:
			event = new Event()
			break
	}
	core.setOutput('triggered', await event.triggered())

	await event.dispatch()
}

run().catch(core.setFailed)
