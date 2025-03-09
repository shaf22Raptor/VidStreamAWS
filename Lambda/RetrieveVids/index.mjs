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
  let connection;

    try {
      console.log(`[${new Date().toISOString()}] Retrieving all transcoded videos...`);
      const pool = await connectToDatabase();
      connection = await pool.getConnection();

      const query = "SELECT videoKey, displayName, uploadTime FROM VideoMetadata WHERE isTranscoded = 1";
      const [rows] = await connection.execute(query);

      if (rows.length === 0) {
        console.warn(`[${new Date().toISOString()}] Warning: No videos found. There may be an internal database issue`);
        return { statusCode: 404, body: JSON.stringify({ message: `No videos found. There may be an internal issue` }) };
      }

      console.log(`[${new Date().toISOString()}] Successfully retrieved ${rows.length} transcoded videos.`);

      return { statusCode: 200, body: JSON.stringify({ message: `Videos successfully retrieved` }) };

    } catch (dbError) {
      console.error(`[${new Date().toISOString()}] Database retrieval error:`, dbError);
      return { statusCode: 500, body: JSON.stringify({ message: "Failed to retrieve videos", error: dbError.message }) };
    } finally {
      if (connection) connection.release();
    }
}
