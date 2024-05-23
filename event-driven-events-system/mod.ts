import "@std/dotenv/load";
// @deno-types="npm:@types/amqplib"
import amqplib from "npm:amqplib";
import mqtt from "npm:mqtt";
import { createClient } from "npm:redis";

const EVENT = "subscriptions";
const RABBITMQ_URL = Deno.env.get("RABBITMQ_URL")!;
const MQTT_URL = Deno.env.get("MQTT_URL")!;
const REDIS_URL = Deno.env.get("REDIS_URL")!;

// rabbit
const rabbitConnection = await amqplib.connect(RABBITMQ_URL);
const rabbitChannel = await rabbitConnection.createChannel();
await rabbitChannel.assertQueue(EVENT);
rabbitChannel.consume(EVENT, (msg) => {
  if (msg !== null) {
    console.log(" [x] Received event from RabbitMQ");
    console.log(" [x] Sent email");
    rabbitChannel.ack(msg);
  }
});

// mqtt
const mqttClient = mqtt.connect(MQTT_URL);
mqttClient.on("connect", () => {
  mqttClient.subscribe(EVENT);
});
mqttClient.on("message", async (_topic, message) => {
  console.log(" [x] Received event from MQTT broker");
  const rabbitChannel = await rabbitConnection.createChannel();
  await rabbitChannel.assertQueue(EVENT);
  rabbitChannel.sendToQueue(EVENT, message, {
    contentType: "application/json",
  });
  console.log(" [x] Sent event to RabbitMQ");
  await rabbitChannel.close();
});

// redis
const redisClient = createClient({ url: REDIS_URL });
await redisClient.connect();
const listener = (message: string) => {
  console.log(" [x] Received event from Redis");
  mqttClient.publish(EVENT, message);
  console.log(" [x] Sent event to MQTT Broker");
};
redisClient.subscribe(EVENT, listener);

console.log(" [x] Listening for events");
