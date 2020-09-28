import * as core from '@actions/core'
import { Event } from './event'

async function run(): Promise<void> {
  // TODO Check for event type
  const event = new Event()
  //core.setOutput('command', event.command)
  core.setOutput('triggered', event.triggered)

  await event.dispatch()
}

run().catch(core.setFailed)
