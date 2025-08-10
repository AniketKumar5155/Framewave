const { createClient } = require('redis');

const client = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

client.on('error', err => console.error('Redis Client Error:', err));

const connectRedis = async () => {
  if (!client.isOpen) {
    await client.connect();
    console.log('✅ Redis connected');
  }
};

module.exports = { client, connectRedis };