If you are an affiliated collaborator of this repository, you may check if this pull request leaks
sensitive security secrets or abuses them for purposes other than their intended scopes.

Please take your time to validate how action secrets are propagated and used.
They can be identified in the workflow and action configs. 
Special notice has to be taken for the environment variable `GITHUB_TOKEN` 
and context variable `github.token`.

If you are certain this pull request is safe to check, confirm your approval using the button.
Otherwise, request changes from the author in a review.
If you think it is clear that the author intentionally tries to circumvent security practices in order to gain access to the token
or manipulate repository data, please follow the 
[guidelines](https://docs.github.com/en/free-pro-team@latest/github/building-a-strong-community/reporting-abuse-or-spam) 
to report the user.
