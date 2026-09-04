const dns = require('dns');
const mongoose = require('mongoose');
const { env } = require('./env');

// Node on Windows often uses the router's IPv6 DNS, which refuses SRV lookups
// for mongodb+srv:// (querySrv ECONNREFUSED). Prefer public IPv4 resolvers.
function configureMongoDns() {
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch (_) {
    /* Node < 16 */
  }

  const current = dns.getServers();
  const usableV4 = current.filter((server) => /^\d+\.\d+\.\d+\.\d+(:\d+)?$/.test(server) && !server.startsWith('127.'));
  if (usableV4.length === 0) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
}

function connectionHint(message) {
  if (/whitelist|IP/i.test(message)) {
    return ' MongoDB Atlas blocked this IP. Add your current IP under Network Access.';
  }
  if (/querySrv|ENOTFOUND|EAI_AGAIN/i.test(message)) {
    return ' DNS could not resolve the Atlas cluster. Check internet/DNS or use a standard mongodb:// URI.';
  }
  if (/ECONNREFUSED/i.test(message)) {
    return ' No MongoDB server is listening at the configured MONGO_URI.';
  }
  return '';
}

async function connectToMongo() {
  configureMongoDns();
  // eslint-disable-next-line no-console
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(env.MONGO_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 20000,
      family: 4,
    });
  } catch (err) {
    throw new Error(`MongoDB connection failed.${connectionHint(err.message)} ${err.message}`);
  }
  // eslint-disable-next-line no-console
  console.log('MongoDB connected');
}

module.exports = { connectToMongo };

