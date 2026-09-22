import mongoose from "mongoose";

const globalForMongoose = globalThis as unknown as {
  mongoosePromise?: Promise<typeof mongoose>;
};

export async function connectMongo(uri: string): Promise<typeof mongoose> {
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  if (!globalForMongoose.mongoosePromise) {
    mongoose.set("strictQuery", true);
    globalForMongoose.mongoosePromise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  return globalForMongoose.mongoosePromise;
}

export function getMongoConnection(): typeof mongoose {
  return mongoose;
}
