import mongoose from "mongoose";

const globalForMongoose = globalThis as unknown as {
  mongoosePromise?: Promise<typeof mongoose> | null;
};

export async function connectMongo(uri: string): Promise<typeof mongoose> {
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!globalForMongoose.mongoosePromise) {
    mongoose.set("strictQuery", true);
    globalForMongoose.mongoosePromise = mongoose
      .connect(uri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
        socketTimeoutMS: 8000,
        maxPoolSize: 10,
      })
      .catch((err) => {
        // Allow next request to retry instead of caching a failed promise forever
        globalForMongoose.mongoosePromise = null;
        throw err;
      });
  }

  return globalForMongoose.mongoosePromise;
}

export function getMongoConnection(): typeof mongoose {
  return mongoose;
}
