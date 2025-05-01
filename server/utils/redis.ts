import { Redis } from "ioredis";
require("dotenv").config();

const redisClient = () => {
  const redisOptions = {
    maxRetriesPerRequest: null,
    reconnectOnError: (err: Error) => {
      console.error("Redis connection error:", err.message);
      return true; 
    },
  };

  if (process.env.REDIS_URL) {
    console.log("Redis connected");
    return new Redis(process.env.REDIS_URL, redisOptions);
  }

  throw new Error("Redis connection failed: No REDIS_URL provided");
};

export const redis = redisClient();
