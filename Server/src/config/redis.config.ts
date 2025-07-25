import Redis, { Redis as RedisClient } from 'ioredis';

export default class RedisConfig {
  private static readonly redisURL: string = process.env.REDIS_URL || 'redis://localhost:6379';
  private static instance: RedisClient | null = null;
  private static isConnected = false;
  private static lastReconnectionTime = 0;

  private static log(message: string) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Redis] ${message}`);
    }
  }

//    checking the instance 

  static async getInstance(): Promise<RedisClient> {
    if (!this.instance) {
      try {
        this.instance = this.createConnection();
        await this.instance.connect();
      } catch (err) {
        console.error('[Redis] ❌ Failed to create or connect Redis instance:', err);
        throw err;
      }
    }
    return this.instance;
  }
//  creating the connection with the redis 
  private static createConnection(): RedisClient {
    const redis = new Redis(this.redisURL, {
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      reconnectOnError: (err) => err.message.includes('READONLY'),
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    redis.on('connect', () => this.log('🟡 Connecting...'));
    redis.on('ready', () => {
      this.log('🟢 Connected successfully');
      this.isConnected = true;
    });
    redis.on('error', (err) => console.error('[Redis] ❌ Error:', err));
    redis.on('close', () => {
      this.log('🔴 Connection closed');
      this.isConnected = false;
    });
    redis.on('reconnecting', () => {
      const now = Date.now();
      if (now - this.lastReconnectionTime > 3000) {
        this.log('♻️ Reconnecting...');
        this.lastReconnectionTime = now;
      }
    });

    return redis;
  }

  static isRedisConnected(): boolean {
    return this.isConnected && this.instance?.status === 'ready';
  }

//    cutting the connection with redis
  static async closeConnection(): Promise<void> {
    if (this.instance && this.instance.status !== 'end') {
      try {
        await this.instance.quit();
        this.log('✅ Connection closed successfully');
      } catch (err) {
        console.error('[Redis] ❌ Error closing connection:', err);
      } finally {
        this.instance = null;
        this.isConnected = false;
      }
    }
  }
//    reconnection with redis logic 

  static async reconnect(): Promise<void> {
    try {
      await this.closeConnection();
      this.instance = this.createConnection();
      await this.instance.connect();
    } catch (err) {
      console.error('[Redis] ❌ Reconnection failed:', err);
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      if (!this.instance) return false;
      const result = await this.instance.ping();
      return result === 'PONG';
    } catch (err) {
      console.error('[Redis] ❌ Health check failed:', err);
      return false;
    }
  }

  static async getRedisInfo(): Promise<any> {
    try {
      if (!this.isRedisConnected()) return null;
      const info = await this.instance!.info();
      return {
        connected: this.isConnected,
        status: this.instance!.status,
        info,
      };
    } catch (err) {
      console.error('[Redis] ❌ Failed to get info:', err);
      return null;
    }
  }
}
