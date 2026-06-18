const { MongoClient } = require("mongodb");

const uri =
  "mongodb://rohansamad_db_user:PU598eV34cUGy1Bv@ac-pkhawqi-shard-00-00.w9vzrlo.mongodb.net:27017,ac-pkhawqi-shard-00-01.w9vzrlo.mongodb.net:27017,ac-pkhawqi-shard-00-02.w9vzrlo.mongodb.net:27017/authDB?ssl=true&replicaSet=atlas-11r3r3-shard-0&authSource=admin&retryWrites=true&w=majority";

async function migrate() {
  const client = await MongoClient.connect(uri);
  const db = client.db("bacchanal");
  const col = db.collection("promo_codes");

  // Find docs that have old `id` field but no `stripeId`
  const docs = await col
    .find({ id: { $exists: true }, stripeId: { $exists: false } })
    .toArray();

  console.log(`Found ${docs.length} doc(s) to migrate.`);

  for (const doc of docs) {
    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          stripeId: doc.id,
          bannerActive: doc.bannerActive || false,
        },
      }
    );
    console.log(`  Migrated: ${doc.code} → stripeId: ${doc.id}`);
  }

  // Show final state of all promo docs
  const all = await col
    .find({})
    .project({ code: 1, stripeId: 1, id: 1, bannerActive: 1, startDate: 1, type: 1, value: 1 })
    .toArray();

  console.log("\nFinal promo_codes state:");
  all.forEach((d) => {
    console.log(
      `  [${d.bannerActive ? "BANNER ON" : "       off"}] ${d.code || "?"} | stripeId: ${d.stripeId || "MISSING"} | ${d.type || "?"}% ${d.value || "?"}`
    );
  });

  await client.close();
  console.log("\nDone.");
}

migrate().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
