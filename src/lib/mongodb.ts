import mongoose from "mongoose";
import dns from "node:dns";
import { isMongoSrvError, resolveMongoSrvUri } from "@/lib/mongodb-srv";
import { ensureTestMotherAccount } from "@/lib/test-mother";

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
  const hasMongoUri = Boolean(MONGODB_URI);
  if (!MONGODB_URI) {
    // #region agent log
    fetch('http://127.0.0.1:7803/ingest/95f350a3-7db0-463e-a25d-1bd09a11d00d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'422235'},body:JSON.stringify({sessionId:'422235',location:'src/lib/mongodb.ts:connectDB',message:'mongodb uri missing',data:{hasMongoUri:false},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw new Error("Please define MONGODB_URI environment variable");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = connectWithSrvFallback(MONGODB_URI);
  }

  try {
    cached.conn = await cached.promise;
    try {
      await ensureTestMotherAccount();
      // #region agent log
      fetch('http://127.0.0.1:7803/ingest/95f350a3-7db0-463e-a25d-1bd09a11d00d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'422235'},body:JSON.stringify({sessionId:'422235',location:'src/lib/mongodb.ts:seed',message:'test mother seed ok',data:{hasMongoUri,seeded:true},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      const err = error instanceof Error ? error : new Error("unknown");
      // #region agent log
      fetch('http://127.0.0.1:7803/ingest/95f350a3-7db0-463e-a25d-1bd09a11d00d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'422235'},body:JSON.stringify({sessionId:'422235',location:'src/lib/mongodb.ts:seed',message:'test mother seed failed',data:{hasMongoUri,seeded:false,name:err.name,text:err.message.slice(0,180)},timestamp:Date.now(),hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      console.error("[babybite] kitchen test login could not be prepared", error);
    }
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    const err = error instanceof Error ? error : new Error("unknown");
    // #region agent log
    fetch('http://127.0.0.1:7803/ingest/95f350a3-7db0-463e-a25d-1bd09a11d00d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'422235'},body:JSON.stringify({sessionId:'422235',location:'src/lib/mongodb.ts:connect',message:'mongodb connect failed',data:{hasMongoUri,name:err.name,text:err.message.slice(0,180)},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw error;
  }
}
