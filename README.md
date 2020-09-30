# interactive event dispatcher

[![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/gofunky/interactive-event-dispatcher/build/master?style=for-the-badge)](https://github.com/gofunky/interactive-event-dispatcher/actions)
[![Renovate Status](https://img.shields.io/badge/renovate-enabled-green?style=for-the-badge&logo=renovatebot&color=1a1f6c)](https://app.renovatebot.com/dashboard#github/gofunky/interactive-event-dispatcher)
[![CodeFactor](https://www.codefactor.io/repository/github/gofunky/interactive-event-dispatcher/badge?style=for-the-badge)](https://www.codefactor.io/repository/github/gofunky/interactive-event-dispatcher)
[![GitHub License](https://img.shields.io/github/license/gofunky/interactive-event-dispatcher.svg?style=for-the-badge)](https://github.com/gofunky/interactive-event-dispatcher/blob/master/LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/gofunky/interactive-event-dispatcher.svg?style=for-the-badge&color=9cf)](https://github.com/gofunky/interactive-event-dispatcher/commits/master)

This [GitHub Action](https://github.com/features/actions) is an effort to correct various shortcomings of the default GitHub action and event system.

## What are these shortcomings?

1. GitHub's events don't distinguish between issue comments and pull requests comments.
1. `pull_request_target` is not made to check forks. The token of this event's context has full permissions.
1. Different events use different context descriptors for the same attributes (e.g., pull request number vs. issue number).
1. Events don't have an integrated permission filter.
1. Pull request actions always run without any previous user interaction.

## How does this action solve this?

This action analyzes the source events based on the maintainer's preferences and conditionally dispatches a custom event.
The event includes a unified source event payload where possible.
The action is able to differentiate permission levels of issues and pull requests, as well as comments.
It is also able to parse comments for user commands and conditionally forward them to a single or dynamic target event.
Pull request events can be delayed until a collaborator checks it for security breaches.
The checks for the triggered events are automatically added to the source event reference. 

<!--- BEGIN_ACTION_DOCS --->
### Inputs
<!--- END_ACTION_DOCS --->

## Example

This is an example that includes all typical inputs.

<!-- add-file: ./.github/workflows/example.yml -->
