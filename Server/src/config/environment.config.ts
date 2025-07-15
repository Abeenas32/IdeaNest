 import dotenv from 'dotenv';
//  import process from 'process';
dotenv.config();

 const validateEnv = () => {
     const required  = [
        'PORT',
        'NODE_ENV',
        'MONGO_URI',
        'JWT_ACCESS_SECRET',
        'JWT_REFRESH_SECRET',
        'BCRYPT_SALT_ROUNDS',
     ];
 for (const key of required) {
         if (!process.env[key]) {
             throw new Error(`Missing environment variable: ${key}`);
         }
     }

 }
  validateEnv();

   export const config = {
     port : parseInt(process.env.PORT || '3000'),
     nodeEnv: process.env.NODE_ENV || 'development',
     mongodb : {
        uri : process.env.MONGODB_URI!,
        options :{
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        }
     },
   jwt:{
     accessSecret: process.env.JWT_ACCESS_SECRET!,
        refreshSecret: process.env.JWT_REFRESH_SECRET!,
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        issuer : process.env.JWT_ISSUER || 'IdeaNest',
        audience : process.env.JWT_AUDIENCE || 'idea-app-users',
   },
   bcrypt: {
        saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10'),
     },
     rateLimit: {
        windowMS : 15*60*1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
     },
    cors: {
          origin: process.env.CORS_ORIGIN || '*',
          methods: process.env.CORS_METHODS || 'GET,HEAD,PUT,PATCH,POST,DELETE',
          allowedHeaders: process.env.CORS_ALLOWED_HEADERS || 'Content-Type,Authorization',
          optionsSuccessStatus: 200,
          credentials: process.env.CORS_CREDENTIALS === 'true',
      },
      cookies: {
        httpOnly: process.env.COOKIES_HTTP_ONLY === 'true',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        maxAge :  7 *24 * 60 * 60 * 1000, // 7 days
        domain : process.env.COOKIES_DOMAIN
      }
    
} as const;