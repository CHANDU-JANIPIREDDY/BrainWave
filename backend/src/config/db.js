const mongoose = require('mongoose');
const { env } = require('./env');

async function connectToMongo() {
  // eslint-disable-next-line no-console
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(env.MONGO_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 15000,
    });
  } catch (err) {
    const hint = /whitelist|IP/i.test(err.message)
      ? ' MongoDB Atlas blocked this IP. Add your current IP under Network Access.'
      : /ECONNREFUSED/i.test(err.message)
        ? ' No MongoDB server is listening at the configured MONGO_URI.'
        : '';
    throw new Error(`MongoDB connection failed.${hint} ${err.message}`);
  }
  // eslint-disable-next-line no-console
  console.log('MongoDB connected');
}

module.exports = { connectToMongo };

