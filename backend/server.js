const path = require('path');

// Load root .env (keeps secrets out of source).
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });
// Secrets are loaded from the project-root .env file, which is not committed.

const { createApp } = require('./src/app');
const { connectToMongo } = require('./src/config/db');
const { seedIfNeeded } = require('./src/seed/seed');

async function main() {
  await connectToMongo();
  await seedIfNeeded();

  const app = createApp();
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`BrainWave backend listening on port ${port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Backend startup failed:', err);
  process.exit(1);
});

