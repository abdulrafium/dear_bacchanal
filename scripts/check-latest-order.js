const { MongoClient } = require("mongodb");

const MONGODB_URI =
  "mongodb://rohansamad_db_user:PU598eV34cUGy1Bv@ac-pkhawqi-shard-00-00.w9vzrlo.mongodb.net:27017,ac-pkhawqi-shard-00-01.w9vzrlo.mongodb.net:27017,ac-pkhawqi-shard-00-02.w9vzrlo.mongodb.net:27017/authDB?ssl=true&replicaSet=atlas-11r3r3-shard-0&authSource=admin&retryWrites=true&w=majority";

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db("bacchanal");

  // Get the latest hard copy order
  const order = await db.collection("orders")
    .find({ type: "hard" })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  if (!order.length) {
    console.log("No hard copy orders found.");
    await client.close();
    return;
  }

  const o = order[0];
  console.log("\n=== LATEST HARD COPY ORDER ===");
  console.log("  DB _id          :", o._id.toString());
  console.log("  orderId         :", o.orderId || "(none)");
  console.log("  status          :", o.status);
  console.log("  email           :", o.email);
  console.log("  approvedAt      :", o.approvedAt || "(not approved yet)");
  console.log("\n--- SiteFlow Result ---");
  console.log("  siteFlowOrderId :", o.siteFlowOrderId || "❌ NOT SET (SiteFlow call failed or not approved yet)");
  console.log("  siteFlowSubmittedAt:", o.siteFlowSubmittedAt || "(none)");
  console.log("  siteFlowError   :", o.siteFlowError || "✅ No error");
  console.log("\n--- Shipping ---");
  console.log("  shippingDetails :", JSON.stringify(o.shippingDetails, null, 2));

  await client.close();
}

main().catch(e => console.error("Error:", e.message));
