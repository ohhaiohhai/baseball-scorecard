import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const GAMES_TABLE_NAME =
  process.env.DYNAMO_GAMES_TABLE_NAME || "baseball-scorecard-games";

/**
 * Returns a DynamoDB Document client. Explicit credentials are used when
 * provided (local dev); otherwise the AWS SDK falls back to the ambient
 * credential chain — the Amplify compute role in production.
 */
export function getDocClient() {
  const config: ConstructorParameters<typeof DynamoDBClient>[0] = {
    region: process.env.DYNAMO_REGION || "us-east-2",
  };
  if (process.env.DYNAMO_ACCESS_KEY_ID && process.env.DYNAMO_SECRET_ACCESS_KEY) {
    config.credentials = {
      accessKeyId: process.env.DYNAMO_ACCESS_KEY_ID,
      secretAccessKey: process.env.DYNAMO_SECRET_ACCESS_KEY,
    };
  }
  return DynamoDBDocumentClient.from(new DynamoDBClient(config), {
    // Our items have optional fields (e.g. a player's jersey number) that are
    // `undefined` when unknown. DynamoDB rejects undefined unless we strip them.
    marshallOptions: { removeUndefinedValues: true },
  });
}
