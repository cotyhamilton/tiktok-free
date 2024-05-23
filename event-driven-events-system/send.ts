#!/usr/bin/env -S deno run -A
import { createClient } from "npm:redis";

const redisClient = createClient();
await redisClient.connect();

await redisClient.publish(
    "subscriptions",
    JSON.stringify({ subscriber: "me", subscribee: "you" }),
);

console.log(" [x] Sent event to Redis");
await redisClient.disconnect();
