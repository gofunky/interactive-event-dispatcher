#!/bin/sh

export MATCH=""

if type_match=$(yq read -j -e ./tests.yml "(typeName==$INPUT_ACTIONNAME})"); then
  MATCH="$type_match"
else
  if id_match=$(yq read -j -e ./tests.yml "(id==$INPUT_ACTIONNAME})"); then
    MATCH="$id_match"
  else
    echo "::error:: this event was not defined in the matrix"
    exit 1
  fi
fi

echo "::set-output name=triggered::$(echo "$MATCH" | yq read - "triggered" --defaultValue "false")"
echo "::set-output name=number::$(echo "$MATCH" | yq read - "number")"
echo "::set-output name=command::$(echo "$MATCH" | yq read - "command")"
echo "::set-output name=body::$(echo "$MATCH" | yq read - "body")"
