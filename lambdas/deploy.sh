#!/usr/bin/env bash
# Deploy the research-lineups Lambda. Creates the function on first run,
# updates code + config thereafter. Requires the AWS CLI + credentials.
set -euo pipefail

FUNCTION_NAME="${RESEARCH_LINEUPS_FUNCTION_NAME:-baseball-scorecard-research-lineups}"
REGION="${DYNAMO_REGION:-us-east-2}"
TABLE="${DYNAMO_GAMES_TABLE_NAME:-baseball-scorecard-games}"
ROLE_ARN="${RESEARCH_LINEUPS_ROLE_ARN:-}"   # required only on first create
: "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY}"

cd "$(dirname "$0")"
zip -j -q research-lineups.zip research-lineups.mjs

ENV_VARS="Variables={ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY,DYNAMO_GAMES_TABLE_NAME=$TABLE,DYNAMO_REGION=$REGION}"

if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" >/dev/null 2>&1; then
  echo "Updating $FUNCTION_NAME…"
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" --region "$REGION" \
    --zip-file fileb://research-lineups.zip >/dev/null
  aws lambda wait function-updated --function-name "$FUNCTION_NAME" --region "$REGION"
  aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" --region "$REGION" \
    --timeout 300 --memory-size 256 --environment "$ENV_VARS" >/dev/null
else
  : "${ROLE_ARN:?first deploy needs RESEARCH_LINEUPS_ROLE_ARN (execution role)}"
  echo "Creating $FUNCTION_NAME…"
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" --region "$REGION" \
    --runtime nodejs20.x --handler research-lineups.handler \
    --role "$ROLE_ARN" --timeout 300 --memory-size 256 \
    --environment "$ENV_VARS" \
    --zip-file fileb://research-lineups.zip >/dev/null
fi

echo "Done."
