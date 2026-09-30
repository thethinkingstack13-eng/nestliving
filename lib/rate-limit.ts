import { createHmac } from 'node:crypto';
import { MongoClient, type Collection } from 'mongodb';

interface RateLimitBucket {
  _id: string;
  count: number;
  expiresAt: Date;
}

interface MongoState {
  client?: MongoClient;
  clientPromise?: Promise<MongoClient>;
  indexPromise?: Promise<string>;
}

const mongoState = globalThis as typeof globalThis & { authRateLimitMongo?: MongoState };
const state = mongoState.authRateLimitMongo ?? (mongoState.authRateLimitMongo = {});

async function getCollection(): Promise<Collection<RateLimitBucket>> {
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error('DATABASE_URL is required for rate limiting.');
  state.clientPromise ??= new MongoClient(uri).connect().catch((error) => {
    state.clientPromise = undefined;
    throw error;
  });
  state.client ??= await state.clientPromise;
  const collection = state.client.db().collection<RateLimitBucket>('auth_rate_limits');
  state.indexPromise ??= collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch((error) => {
    state.indexPromise = undefined;
    throw error;
  });
  await state.indexPromise;
  return collection;
}

export async function checkRateLimit(
  request: Request,
  scope: string,
  maximum: number,
  windowMs: number,
  identity?: string
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is required for rate limiting.');

  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = (request.headers.get('x-real-ip')?.trim() || forwarded || 'unknown').slice(0, 100);
  const addressHash = createHmac('sha256', secret).update(address).digest('hex');
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const retryAfterSeconds = Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000));
  const keys = [`${scope}:ip:${addressHash}:${windowStart}`];
  if (identity) {
    const identityHash = createHmac('sha256', secret).update(identity.trim().toLowerCase()).digest('hex');
    keys.push(`${scope}:identity:${identityHash}:${windowStart}`);
  }
  const collection = await getCollection();

  for (const key of keys) {
    try {
      await collection.findOneAndUpdate(
        { _id: key, count: { $lt: maximum } },
        {
          $inc: { count: 1 },
          $setOnInsert: { expiresAt: new Date(windowStart + windowMs * 2) },
        },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 11000)) throw error;

      // Concurrent first inserts race on _id; retry as an update and let the count guard decide.
      const retry = await collection.updateOne({ _id: key, count: { $lt: maximum } }, { $inc: { count: 1 } });
      if (retry.modifiedCount !== 1) return { allowed: false, retryAfterSeconds };
    }
  }
  return { allowed: true, retryAfterSeconds };
}