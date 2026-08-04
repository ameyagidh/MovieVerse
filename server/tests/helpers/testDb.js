import mongoose from 'mongoose';

// Docker Mongo (port 27020), throwaway per-suite database — same pattern
// used by pulseboard/openshelf/quakescope (see their docs/DECISIONS.md).
export async function connectTestDb(suiteName) {
  const dbName = `movieverse_test_${suiteName}_${Date.now()}`;
  await mongoose.connect(`mongodb://localhost:27020/${dbName}`);
  return dbName;
}

export async function dropAndDisconnectTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}
