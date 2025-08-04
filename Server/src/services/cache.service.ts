import RedisConfig from "../config/redis.config";
import { redis } from "../config/redis.config"

export interface CacheOptions {
    ttl?: number;
    prefix?: string;
}

export class CacheService {
    private static readonly DEFAULT_TTL = 300;
    private static readonly DEFAULT_PREFIX = 'ideanest';
    static async set(key: string,
        value: any,
        options: CacheOptions = {}

    ): Promise<boolean> {
        try {
            if (!RedisConfig.isRedisConnected()) {
                console.warn('Redis is not connected, skipping cache set')
                return false;
            }
            const { ttl = this.DEFAULT_TTL, prefix = this.DEFAULT_PREFIX } = options;
            const cacheKey = `${prefix}: ${key}`;
            const serializedValue = JSON.stringify(value);
            (await redis).setex(cacheKey, ttl, serializedValue);
            return true;
        } catch (error) {
            console.error('Cache set error', error);
            return false;
        }
    }

    static async get<T = any>(
        key: string,
        options: Pick<CacheOptions, 'prefix'> = {}
    ): Promise<T | null> {
        try {
            if (!RedisConfig.isRedisConnected()) return null;
            const { prefix = this.DEFAULT_PREFIX } = options;
            const cacheKey = `${prefix} : ${key}`;
            const cachedValue = await redis.get(cacheKey);
            if (!cachedValue) return null;
            try {
                return JSON.parse(cachedValue) as T;
            } catch (error) {
                console.error('JSON parse error in cache get', error);
                return null;
            }
        } catch (error) {
            console.error('Cache get error', error);
            return null;
        }
    }
    static async delete(key: string, options: Pick<CacheOptions, 'prefix'> = {}): Promise<boolean> {
        try {
            if (!RedisConfig.isRedisConnected()) return false;
            const { prefix = this.DEFAULT_PREFIX } = options;
            const cacheKey = `${prefix} : ${key}`;
            const result = await redis.del(cacheKey);
            return (result > 0);
        } catch (error) {
            console.error('cache delete error', error);
            return false;
        }
    }
    static async exists(key: string, options: Pick<CacheOptions, 'prefix'> = {}): Promise<boolean> {
        try {
            if (!RedisConfig.isRedisConnected()) return false;
            const { prefix = this.DEFAULT_PREFIX } = options;
            const cacheKey = `${prefix}:${key}`;
            const result = await redis.exists(cacheKey);
            return (result === 1);
        } catch (error) {
            console.error('cache exists error', error);
            return false;
        }
    }

    static async setWithSliding(key: string, value: any, ttl: number = this.DEFAULT_TTL,
        options: Pick<CacheOptions, 'prefix'> = {}
    ): Promise<boolean> {
        try {
            if (!RedisConfig.isRedisConnected()) return false;

            const { prefix = this.DEFAULT_PREFIX } = options;
            const cacheKey = `${prefix}:${key}`;
            const serializedValue = JSON.stringify({
                data: value,
                slidingTtl: ttl,
                lastAccessed: Date.now()
            });
            await redis.setex(cacheKey, ttl, serializedValue);
            return true;
        } catch (error) {
            console.error('Caches setwith sliding error', error);
            return false;

        }
    }

    static async getWithSliding<T = any>(key: string, options: Pick<CacheOptions, 'prefix'> & { extendedTtl?: boolean }): Promise<T | null> {
        try {
            if (!RedisConfig.isRedisConnected()) return null;
            const { prefix = this.DEFAULT_PREFIX, extendedTtl = true } = options;
            const cacheKey = `${prefix}: ${key}`;
            const cachedValue = await redis.get(cacheKey);
            if (!cachedValue) return null;
            const parsed = JSON.parse(cachedValue);
            const { data, slidingTtl } = parsed;
            if (extendedTtl) {
                await redis.expire(cacheKey, slidingTtl);
            }
            return data as T;
        } catch (error) {
            console.error('Cache getWithSliding error: ', error);
            return null;
        }
    }


    static async cacheTrendingIdeas(ideas: any[], ttl = 600) {
        return this.set('trending:ideas', ideas, { ttl });
    }

    static async getCachedTrendingIdeas() {
        return this.get<any[]>('trending:ideas');
    }

    static async cacheTopIdeas(timeframe: string, ideas: any[], ttl = 900) {
        return this.set(`top:ideas:${timeframe}`, ideas, { ttl });
    }

    static async getCachedTopIdeas(timeframe: string) {
        return this.get<any[]>(`top:ideas:${timeframe}`);
    }

    static async cacheUserSession(userId: string, data: any, ttl = 3600) {
        return this.set(`session:${userId}`, data, { ttl });
    }

    static async getCachedUserSession(userId: string) {
        return this.get(`session:${userId}`);
    }

    static async cacheRefreshToken(tokenId: string, data: any, ttl = 604800) {
        return this.set(`refresh:${tokenId}`, data, { ttl });
    }

    static async getCachedRefreshToken(tokenId: string) {
        return this.get(`refresh:${tokenId}`);
    }

    static async invalidateRefreshToken(tokenId: string) {
        return this.delete(`refresh:${tokenId}`);
    }

    static async cacheLikeCount(ideaId: string, count: number, ttl = 300) {
        return this.set(`likes:count:${ideaId}`, count, { ttl });
    }

    static async getCachedLikeCount(ideaId: string) {
        return this.get<number>(`likes:count:${ideaId}`);
    }
    static async incrementLikeCount(ideaId: string): Promise<number | null> {
        try {
            if (!RedisConfig.isRedisConnected()) return null;
            const key = `${this.DEFAULT_PREFIX}:likes:count:${ideaId}`;
            const result = await redis.incr(key);
            if (result === 1) {
                await redis.expire(key, 300);
            }
            return result;
        } catch (error) {
            console.error('cache increment error', error);
            return null;
        }
    }

    static async decrementLikeCount(ideaId: string): Promise<number | null> {
        try {
            if (!RedisConfig.isRedisConnected()) return null;

            const key = `${this.DEFAULT_PREFIX}:likes:count:${ideaId}`;
            const result = await redis.decr(key);

            if (result <= 0) {
                await redis.del(key);
                return 0;
            }
            return result;
        } catch (error) {
            console.error('Cache decrement error:', error);
            return null;
        }
    }
static async clearCacheByPattern(pattern: string): Promise<number> {
  try {
    if (!RedisConfig.isRedisConnected()) return 0;

    const redis = await RedisConfig.getInstance();
    const matchedKeys: string[] = [];
    let cursor = '0';

    do {
      try {
        // Use individual parameters for scan command
        const result = await redis.scan(
          cursor,
          'MATCH',
          `${this.DEFAULT_PREFIX}:${pattern}`,
          'COUNT',
          '100'
        );

        cursor = result[0];
        const keys = result[1];
        matchedKeys.push(...keys);
      } catch (scanError) {
        console.error('❌ Redis scan error:', scanError);
        // Exit the loop on scan error
        break; 
      }
    } while (cursor !== '0');

    if (matchedKeys.length === 0) return 0;

    try {
      // ❗ Only delete if keys found
      return await redis.del(...matchedKeys);
    } catch (deleteError) {
      console.error('❌ Redis delete error:', deleteError);
      return 0;
    }
  } catch (error) {
    console.error('❌ Cache clear error:', error);
    return 0;
  }
}


  static async getCacheStats(): Promise<any> {
    try {
      if (!RedisConfig.isRedisConnected()) return null;

      const info = await redis.info('memory');
      const keyspace = await redis.info('keyspace');

      return {
        connected: RedisConfig.isRedisConnected(),
        memory: info,
        keyspace
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

}