import * as core from '@actions/core'
import {Event} from './event'
import {PullRequestActionEvent} from './approval'
import {PullRequestCommentEvent} from './comment'
import {PullRequestEvent} from './pull'
import {WorkflowRun} from './run'
import {RepositoryDispatch} from './dispatched'
import {Dispatchable, Reference} from './reference'

async function run(): Promise<void> {
	let ref: Reference & Dispatchable
	switch (Event.sourceEvent) {
		case 'workflow_run':
			ref = new WorkflowRun()
			break
		case 'repository_dispatch':
			ref = new RepositoryDispatch()
			break
		case 'check_run':
			ref = new PullRequestActionEvent()
			break
		case 'issue_comment':
			ref = new PullRequestCommentEvent()
			break
		case 'pull_request':
		case 'pull_request_review':
		case 'pull_request_review_comment':
			ref = new PullRequestEvent()
			break
		default:
			ref = new Event()
			break
	}

	if (ref instanceof Event) {
		core.setOutput('typeName', await ref.triggerEvent())
		core.setOutput('triggered', await ref.triggered())

		if (ref instanceof PullRequestCommentEvent) {
			core.setOutput('command', await ref.command())
		}
	}

	await ref.dispatch()
}

run().catch((error) => {
	core.setFailed(error.stack ?? error)
})
