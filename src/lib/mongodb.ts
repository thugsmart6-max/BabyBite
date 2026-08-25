import mongoose from "mongoose";
import dns from "node:dns";
import { isMongoSrvError, resolveMongoSrvUri } from "@/lib/mongodb-srv";

const MONGODB_URI = process.env.MONGODB_URI;

if (typeof window === "undefined") {
  dns.setDefaultResultOrder("ipv4first");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  resolvedUri?: string;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

/** HMR can leave a rejected promise cached — drop it so the next connect retries. */
if (cached.promise && !cached.conn) {
  cached.promise = null;
}

const CONNECT_OPTS = {
  bufferCommands: false,
  serverSelectionTimeoutMS: 15000,
  family: 4 as const,
  maxPoolSize: 24,
  minPoolSize: 1,
  maxIdleTimeMS: 30000,
};

function startConnection(uri: string): Promise<typeof mongoose> {
  return mongoose.connect(uri, CONNECT_OPTS);
}

async function connectWithSrvFallback(uri: string): Promise<typeof mongoose> {
  try {
    return await startConnection(cached.resolvedUri ?? uri);
  } catch (error) {
    if (!uri.startsWith("mongodb+srv://") || !isMongoSrvError(error)) {
      throw error;
    }
    await mongoose.disconnect().catch(() => undefined);
    const standardUri = await resolveMongoSrvUri(uri);
    cached.resolvedUri = standardUri;
    return startConnection(standardUri);
  }
}

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI environment variable");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = connectWithSrvFallback(MONGODB_URI);
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}
