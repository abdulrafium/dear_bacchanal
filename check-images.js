const { MongoClient } = require('mongodb');

const uri = "mongodb://rohansamad_db_user:PU598eV34cUGy1Bv@ac-pkhawqi-shard-00-00.w9vzrlo.mongodb.net:27017,ac-pkhawqi-shard-00-01.w9vzrlo.mongodb.net:27017,ac-pkhawqi-shard-00-02.w9vzrlo.mongodb.net:27017/authDB?ssl=true&replicaSet=atlas-11r3r3-shard-0&authSource=admin&retryWrites=true&w=majority";

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('bacchanal');
  const imagesCollection = db.collection('book_images');
  
  const images = await imagesCollection.find({}).limit(5).toArray();
  
  console.log("Found", images.length, "user image records");
  for (const record of images) {
    console.log("User:", record.userId);
    console.log("Images:", JSON.stringify(record.imageMap, null, 2));
  }
  process.exit(0);
}

run().catch(console.error);
