import { connectMongo } from "@nexus-twin/database";

export async function db() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  return connectMongo(uri);
}
