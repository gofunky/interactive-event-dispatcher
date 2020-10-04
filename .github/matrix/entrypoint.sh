#!/bin/sh

export MATCH=""

if type_match=$(yq read -j -e ./matrix.yml "(typeName==$INPUTS_ACTIONNAME})"); then
  MATCH="$type_match"
else
  MATCH=$(yq read -j -e ./matrix.yml "(id==$INPUTS_ACTIONNAME)")
fi

echo "::set-output name=triggered::$(echo "$MATCH" | yq read - "triggered" --defaultValue "false")"
echo "::set-output name=number::$(echo "$MATCH" | yq read - "number")"
echo "::set-output name=command::$(echo "$MATCH" | yq read - "command")"
echo "::set-output name=body::$(echo "$MATCH" | yq read - "body")"
