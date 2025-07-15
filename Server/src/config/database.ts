import mongoose from "mongoose";
import { config } from "./environment.config";

 export const connectDatabase = async () => {
      try {
        mongoose.set('strictQuery', false);
       const conn =  await mongoose.connect(config.mongodb.uri, config.mongodb.options);
      console.log(`MongoDB connected: ${conn.connection.host}`);
       
       process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('Mongo DB connection connection clsoed');
        process.exit(0);
         
       })
    } catch (error) {
        console.error('MongoDB connection error', error);
        setTimeout(connectDatabase , 5000);
        process.exit(0);
        
      }
       mongoose.connection.on('error', (error)=> {
          console.error('MOngoDb connection error:',error);
       })
        mongoose.connection.on('disconnected', ()=> {
              console.log('MongoDb Connection disconnected')
        });
        mongoose.connection.on('reconnected', ()=> {
              console.log('MongoDb reconnected');
        })
    }
 