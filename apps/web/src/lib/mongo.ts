import { connectMongo } from "@nexus-twin/database";

export async function db() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }
  try {
    return await connectMongo(uri);
  } catch (err) {
    const message = err instanceof Error ? err.message : "MongoDB connection failed";
    throw new Error(
      `Database unavailable (${message}). Start MongoDB locally or fix MONGODB_URI.`
    );
  }
}
