---
title: Overview
---
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
## Inputs

### actionsToken
![Required](https://img.shields.io/badge/Required-no-inactive?style=flat-square)
![Default](https://img.shields.io/badge/Default-${{_github.token_}}-ef2366?style=flat-square)

\*\*WARNING:\*\* Do not change this! It will be used for API requests that only the default token can perform.


### affiliation
![Required](https://img.shields.io/badge/Required-no-inactive?style=flat-square)
![Default](https://img.shields.io/badge/Default-all-d87c44?style=flat-square)

Collaborators are determined by the given affiliation status.
Can be either of `direct`, `outside`, or `all`.
Outside collaborators and unaffiliated outsiders are different things.
`outside` defines collaborators who are not part of your organization.


### appendCommand
![Required](https://img.shields.io/badge/Required-no-inactive?style=flat-square)
![Default](https://img.shields.io/badge/Default-false-7cb6ef?style=flat-square)

By default, this action always triggers the same output event type as defined in [prefixFilter](#prefixFilter).
The type name can be extended by the determined command name.

### Example

```yaml
event: dispatched
prefixFilter: '\$action(s?)'
commandFilter: \|
  publish docs
  publish release
appendCommand: true
```

#### Comment

```
$actions publish docs
```

The triggered event type will be `dispatched\_publish\_docs`.



### commandFilter
![Required](https://img.shields.io/badge/Required-no-inactive?style=flat-square)
![Default](https://img.shields.io/badge/Default-'_'-inactive?style=flat-square)

Besides the prefix, comments can further be filtered for their commands.
If enabled, only the given command expressions are accpeted for events to trigger.
The filter accepts regular expression syntax.
The input is enabled if any non-zero value is set.
A list can be set via a line separation.



### event
![Required](https://img.shields.io/badge/Required-yes-important?style=flat-square)
![Default](https://img.shields.io/badge/Default-none-inactive?style=flat-square)

This input defines the type name of the `repository\_dispatch` event to trigger.


### interval
![Required](https://img.shields.io/badge/Required-no-inactive?style=flat-square)
![Default](https://img.shields.io/badge/Default-500-f83a38?style=flat-square)

If [observingChecks](#observingChecks) is enabled, the workflows are observed with a given tick rate.
This interval defines the the miliseconds to sleep between each tick.



### observingChecks
![Required](https://img.shields.io/badge/Required-no-inactive?style=flat-square)
![Default](https://img.shields.io/badge/Default-true-5ffe53?style=flat-square)

Triggered events do not create any checks by default because they naturally do not belong to any commit.
This action can still create the checks by observing the triggered workflows and updating the checks as they
progress.
This input allows to disable this behavior.


### outsiderCommands
![Required](https://img.shields.io/badge/Required-no-inactive?style=flat-square)
![Default](https://img.shields.io/badge/Default-false-7cb6ef?style=flat-square)

By default, comments will only be accepted and dispatched if they originate from collaborators of the repository.
This behavior can be extended to all users, regardless of affiliation status, by enabling this input.


### perPage
![Required](https://img.shields.io/badge/Required-no-inactive?style=flat-square)
![Default](https://img.shields.io/badge/Default-30-22d200?style=flat-square)

For repositories with frequent and large numbers of comments or workflows, the API might not return all
nodes for all requests. That is because not every endpoint provides the appropriate filtering methods.
This input can compensate for this limitation. It can be set up to 100.

\*\*Recommendation:\*\* Leave this parameter untouched unless checks are missing in the commit reference.


### prefixFilter
![Required](https://img.shields.io/badge/Required-no-inactive?style=flat-square)
![Default](https://img.shields.io/badge/Default-'_'-inactive?style=flat-square)

Incoming comment events can be filtered by their content.
This input enables a filter for trigger events to contain the given prefix to be matched.
If enabled, the suffix of this prefix will be passed as [outputs.command](#command)
and as `github.event.client\_payload.command` to the target event.
The filter accepts regular expression syntax.
This input is enabled if any non-empty value is set.

### Example

```yaml
prefixFilter: '\$action(s?)'
```

#### Comment

```
$action publish something
```

The determined command will be `publish something`.


### pullMode
![Required](https://img.shields.io/badge/Required-no-inactive?style=flat-square)
![Default](https://img.shields.io/badge/Default-true-5ffe53?style=flat-square)

\*\*WARNING:\*\* Do not disable this for target workflows that execute code or tests on pull requests.
By default, pull requests events are checked for the author's affiliation status.
If the author is not affiliated, they will receive a friendly comment that notifies them
that not all checks can be run yet until a collaborator's approval.
Collaborators can then check the pull request and approve a specific commit by commenting a command
or by using an action button provided by the check itself that approves the most recent commit.

If disabled, this action will skip the affiliation check and always forward events
from any source (i.e. pull requests and issues). Check commands will not be processed.



### token
![Required](https://img.shields.io/badge/Required-yes-important?style=flat-square)
![Default](https://img.shields.io/badge/Default-none-inactive?style=flat-square)

A repository-scoped personal access token is necessary because for API access.
The default GitHub token will not work because events from this token are ignored by GitHub's event controller.


## Outputs

### command

If [inputs.prefixFilter](#prefixFilter) is enabled,
this output contains the matched subsequent command of a filtered command comment.


### triggered

If [inputs.prefixFilter](#prefixFilter) is enabled, only true if the prefix was matched, otherwise always true.

<!--- END_ACTION_DOCS --->

## Example

This is an example that includes all typical inputs.

<!-- add-file: ./.github/workflows/example.yml -->
``` yml 

```
