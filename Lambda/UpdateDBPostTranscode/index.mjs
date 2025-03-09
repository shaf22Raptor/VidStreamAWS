import mysql from "mysql2/promise";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const RDS_SECRET_NAME = "videoRDSCredentials";
const client = new SecretsManagerClient({ region: "ap-southeast-2" });

let pool;
let cachedCredentials = null;

async function getDatabaseCredentials() {
  if (cachedCredentials) return cachedCredentials;

  console.log(`[${new Date().toISOString()}] Fetching database credentials...`);
  const command = new GetSecretValueCommand({ SecretId: RDS_SECRET_NAME });

  try {
    const secretValue = await client.send(command);
    cachedCredentials = JSON.parse(secretValue.SecretString);
    console.log(`[${new Date().toISOString()}] Database credentials retrieved. Retrieved: ${secretValue.SecretString}`);
    return cachedCredentials;
  } catch (error) {
    console.error("Error retrieving database credentials:", error);
    throw new Error("Failed to retrieve database credentials");
  }
}

async function connectToDatabase() {
  if (!pool) {
    console.log(`[${new Date().toISOString()}] Creating MySQL connection pool...`);
    pool = mysql.createPool({
      host: "video-metadata.c10o8ymii83k.ap-southeast-2.rds.amazonaws.com",
      user: "admin",
      password: "Shiftyfifty.50",
      database: "video-metadata",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return pool;
}


export const handler = async (event) => {
  try {
    console.log(`[${new Date().toISOString()}] Lambda function triggered.`);

    const record = event.Records[0];
    const bucketName = record.s3.bucket.name;
    const objectKey = record.s3.object.key;
    const videoKey = objectKey.split("processed/")[1];

    console.log(`[${new Date().toISOString()}] Processing video ID: ${videoId}`);

    // connect to RDS
    const pool = await connectToDatabase();
    const connection = await pool.getConnection();

    try {
      const query = "UPDATE VideoMetadata SET isTranscoded = 1 WHERE videoKey = ?";
      const result = await connection.execute(query, [videoKey]);

      if (result.affectedRows > 0) {
        console.log(`[${new Date().toISOString()}] Video ${videoKey} updated successfully in RDS.`);
      } else {
        console.warn(`[${new Date().toISOString()}] Warning: No rows updated. Video key ${videoKey} may not exist.`);
      }
    } catch (dbError) {
      console.error("Database update error:", dbError);
    } finally {
      connection.release();
    }

    return { statusCode: 200, body: JSON.stringify({ message: `Successfully updated video: ${videoKey} to show it has been transcoded` }) };
  } catch (error) {
    console.error("Error in Lambda execution:", error);
    return { statusCode: 500, body: JSON.stringify("Failed to update RDS after transcode")};
  }
}
