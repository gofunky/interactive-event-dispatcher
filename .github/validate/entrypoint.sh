#!/bin/sh

if checks=$( \
    curl "/repos/gofunky/interactive-event-dispatcher/commits/$INPUT_SHA/check-runs" \
        -H "Accept: application/vnd.github.antiope-preview+json" \
        -H "Authorization: Bearer $INPUT_TOKEN"
  );
then
  if ! echo "$checks" | yq read - "check_runs.(name==test*($INPUT_TYPENAME))" --collect; then
    echo "::error:: no check could be found with type name '$INPUT_TYPENAME' and workflow name 'test'"
    exit 1
  fi
else
  echo "::error:: no check could be found with ref '$INPUT_SHA'"
  exit 1
fi
