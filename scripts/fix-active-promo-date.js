const { MongoClient } = require('mongodb');
const uri = 'mongodb://rohansamad_db_user:PU598eV34cUGy1Bv@ac-pkhawqi-shard-00-00.w9vzrlo.mongodb.net:27017,ac-pkhawqi-shard-00-01.w9vzrlo.mongodb.net:27017,ac-pkhawqi-shard-00-02.w9vzrlo.mongodb.net:27017/authDB?ssl=true&replicaSet=atlas-11r3r3-shard-0&authSource=admin&retryWrites=true&w=majority';
async function update() {
  const client = await MongoClient.connect(uri);
  const db = client.db('bacchanal');
  const now = new Date();
  await db.collection('promo_codes').updateOne(
    { bannerActive: true },
    { $set: { activatedAt: now } }
  );
  console.log('Updated active promo with activatedAt');
  await client.close();
}
update().catch(console.error);
