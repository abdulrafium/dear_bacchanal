const { MongoClient } = require('mongodb');
async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('bacchanal');
  const collection = db.collection('global_templates');
  try {
    const result = await collection.updateOne(
      { _id: 'bacchanal-2026' },
      { $set: { templateName: 'Bacchanal 2026' } },
      { upsert: true }
    );
    console.log('Update result:', result.matchedCount, result.upsertedId);
  } catch (e) {
    console.error('ERROR:', e.message);
  }
  await client.close();
}
require('dotenv').config();
run().catch(console.error);
