const { MongoClient } = require("mongodb");

const MONGODB_URI =
  "mongodb://rohansamad_db_user:PU598eV34cUGy1Bv@ac-pkhawqi-shard-00-00.w9vzrlo.mongodb.net:27017,ac-pkhawqi-shard-00-01.w9vzrlo.mongodb.net:27017,ac-pkhawqi-shard-00-02.w9vzrlo.mongodb.net:27017/authDB?ssl=true&replicaSet=atlas-11r3r3-shard-0&authSource=admin&retryWrites=true&w=majority";

const DB_NAME = "bacchanal";

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);

  const orders = await db
    .collection("orders")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  if (!orders.length) {
    console.log("No orders found in the database.");
    await client.close();
    return;
  }

  console.log(`\n=== Found ${orders.length} order(s) ===\n`);
  orders.forEach((o, i) => {
    console.log(`--- Order #${i + 1} ---`);
    console.log(`  DB _id          : ${o._id}`);
    console.log(`  orderId         : ${o.orderId || "(none)"}`);
    console.log(`  sourceOrderId   : ${o.sourceOrderId || "(none)"}`);
    console.log(`  siteFlowOrderId : ${o.siteFlowOrderId || "(none)"}`);
    console.log(`  hpOrderId       : ${o.hpOrderId || "(none)"}`);
    console.log(`  userId          : ${o.userId || "(none)"}`);
    console.log(`  email           : ${o.email || "(none)"}`);
    console.log(`  type            : ${o.type || "(none)"}`);
    console.log(`  status          : ${o.status || o.orderStatus || "(none)"}`);
    console.log(`  createdAt       : ${o.createdAt || "(none)"}`);
    console.log("");
  });

  await client.close();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
