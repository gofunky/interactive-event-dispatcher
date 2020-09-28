Thank you for this pull request, @{{user}}.

For security reasons, pull requests from non-affiliated contributors need approval for all checks to run.
<details>
<summary>How to approve the pull request checks as a collaborator</summary>
<p><br>
If you are an affiliated collaborator of this repository, you may check if this pull request leaks
sensitive security secrets or abuses them for purposes other than their intended scopes.

Please take your time to validate how action secrets are propagated and used.
They can be identified in the workflow and action configs. 
Special notice has to be taken for the environment variable `GITHUB_TOKEN` 
and context variable `github.token`.

Use the check action button to approve the check of the current pull request state and press `Approve Check`.
To approve a specific commit, create a comment that contains `{{cmd}}`.
</p>
</details>
