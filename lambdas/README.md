# Lambdas

## `research-lineups`

Async worker that pre-populates a game's batting orders from AI + web search,
then writes the rosters back to the games DynamoDB table. Invoked
fire-and-forget (`InvocationType: "Event"`) from the Next.js API route via
`lib/autofill.ts`; the browser polls the game record until `autofillStatus`
flips to `done`/`error` (`app/components/autofill-status.tsx`).

It has **no bundled dependencies** — the AWS SDK v3 and global `fetch`/`crypto`
are built into the `nodejs20.x` runtime. The deploy artifact is just the single
`.mjs` file zipped at the archive root.

### Configuration

| Setting        | Value                                                  |
| -------------- | ------------------------------------------------------ |
| Runtime        | `nodejs20.x`                                            |
| Handler        | `research-lineups.handler`                              |
| Timeout        | `300` s (web search + two model calls is slow)          |
| Memory         | `256` MB is plenty                                      |
| Env vars       | `ANTHROPIC_API_KEY`, `DYNAMO_GAMES_TABLE_NAME`, `DYNAMO_REGION` |

### Execution role

The function's role needs to write the games table:

```json
{
  "Effect": "Allow",
  "Action": "dynamodb:UpdateItem",
  "Resource": "arn:aws:dynamodb:<region>:<acct>:table/<DYNAMO_GAMES_TABLE_NAME>"
}
```

### Caller permission (Amplify SSR compute role)

The app invokes the function, so the **Amplify Hosting compute role** needs:

```json
{
  "Effect": "Allow",
  "Action": "lambda:InvokeFunction",
  "Resource": "arn:aws:lambda:<region>:<acct>:function:baseball-scorecard-research-lineups"
}
```

The app picks the function up by name via `RESEARCH_LINEUPS_FUNCTION_NAME`
(default `baseball-scorecard-research-lineups`).

### Deploy

```sh
cd lambdas
./deploy.sh        # zips + creates-or-updates the function and its config
```

Or manually:

```sh
zip -j research-lineups.zip research-lineups.mjs
aws lambda update-function-code \
  --function-name baseball-scorecard-research-lineups \
  --zip-file fileb://research-lineups.zip
```

### Local development

No Lambda required. With `USE_LAMBDA` unset, `lib/autofill.ts` runs the exact
same logic inline in the Next dev server (`runLocalAutofill`). Set `USE_LAMBDA=1`
to exercise the real Lambda path locally (you'll need AWS creds + the function
deployed).
