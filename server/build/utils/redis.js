"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = require("ioredis");
require("dotenv").config();
const redisClient = () => {
    const redisOptions = {
        maxRetriesPerRequest: null,
        reconnectOnError: (err) => {
            console.error("Redis connection error:", err.message);
            return true;
        },
    };
    if (process.env.REDIS_URL) {
        console.log("Redis connected");
        return new ioredis_1.Redis(process.env.REDIS_URL, redisOptions);
    }
    throw new Error("Redis connection failed: No REDIS_URL provided");
};
exports.redis = redisClient();
