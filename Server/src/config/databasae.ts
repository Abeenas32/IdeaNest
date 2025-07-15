import mongoose from "mongoose";
import { config } from "./environment.config";

 export const connectDatabase = async () => {
      try {
        mongoose.set('strictQuery', false);
       const conn =  await mongoose.connect(config.mongodb.uri, config.mongodb.options);
      console.log(`MongoDB connected: ${conn.connection.host}`);  
    } catch (error) {
        
      }
 }