// const { MongoClient } = require('mongodb');

// const uri = "mongodb+srv://rohansamad_db_user:PU598eV34cUGy1Bv@cluster0.w9vzrlo.mongodb.net/?appName=Cluster0";
// const dbName = "bacchanal";

// const userData = {
//   "name": "awais",
//   "email": "awais@gmail.com",
//   "password": "$2b$12$lGFJXKGri4bhipqPhvAC1OpyNn4mKoUNyFfo37RprzCiQ/eaxNpj.",
//   "provider": "credentials",
//   "image": null,
//   "emailVerified": null,
//   "createdAt": new Date("2026-02-23T18:30:53.576Z"),
//   "updatedAt": new Date("2026-02-23T18:54:41.151Z"),
//   "isPurchased": true,
//   "shippingDetails": {
//     "address": {
//       "city": "jkkj",
//       "country": "US",
//       "line1": "dskdj",
//       "line2": "jkk",
//       "postal_code": "32323",
//       "state": "FL"
//     },
//     "carrier": null,
//     "name": "awau",
//     "phone": null,
//     "tracking_number": null
//   },
//   "pdfUploadedAt": new Date("2026-02-23T18:58:22.379Z"),
//   "savedPdfUrl": "https://utfs.io/f/1hdj0IgUIJZuRpbrlKJleU51i7qnxakWPDGVp2YASh4NomwH"
// };

// async function inject() {
//   const client = new MongoClient(uri);
//   try {
//     await client.connect();
//     console.log("Connected to MongoDB");
//     const db = client.db(dbName);
//     const users = db.collection('users');
    
//     // Check if user already exists
//     const existing = await users.findOne({ email: userData.email });
//     if (existing) {
//       console.log(`User ${userData.email} already exists. Updating...`);
//       const result = await users.replaceOne({ email: userData.email }, userData);
//       console.log(`Update result: ${JSON.stringify(result)}`);
//     } else {
//       console.log(`Inserting new user ${userData.email}...`);
//       const result = await users.insertOne(userData);
//       console.log(`Insert result: ${JSON.stringify(result)}`);
//     }
//   } catch (err) {
//     console.error("Error injecting user:", err);
//   } finally {
//     await client.close();
//   }
// }

// inject();



import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.DB_NAME as string;

if (!uri) {
  console.error("❌ MONGO_URI missing in .env");
  process.exit(1);
}

interface User {
  name: string;
  email: string;
  password: string;
  provider: string;
  image: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isPurchased: boolean;
  shippingDetails: any;
  pdfUploadedAt: Date;
  savedPdfUrl: string;
}

const userData: User = {
  name: "awais",
  email: "awais@gmail.com",
  password:
    "$2b$12$lGFJXKGri4bhipqPhvAC1OpyNn4mKoUNyFfo37RprzCiQ/eaxNpj.",
  provider: "credentials",
  image: null,
  emailVerified: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  isPurchased: true,
  shippingDetails: {
    address: {
      city: "jkkj",
      country: "US",
      line1: "dskdj",
      line2: "jkk",
      postal_code: "32323",
      state: "FL",
    },
    carrier: null,
    name: "awau",
    phone: null,
    tracking_number: null,
  },
  pdfUploadedAt: new Date(),
  savedPdfUrl:
    "https://utfs.io/f/1hdj0IgUIJZuRpbrlKJleU51i7qnxakWPDGVp2YASh4NomwH",
};

async function injectUser() {
  const client = new MongoClient(uri);

  try {
    console.log("🔄 Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected");

    const db = client.db(dbName);
    const users = db.collection<User>("users");

    const existing = await users.findOne({ email: userData.email });

    if (existing) {
      console.log("⚠️ User exists. Updating...");
      await users.updateOne(
        { email: userData.email },
        { $set: { ...userData, updatedAt: new Date() } }
      );
      console.log("✅ Updated successfully");
    } else {
      console.log("🆕 Inserting user...");
      const result = await users.insertOne(userData);
      console.log("✅ Inserted with ID:", result.insertedId);
    }
  } catch (err: any) {
    console.error("❌ Injection failed:", err.message);
  } finally {
    await client.close();
    console.log("🔒 Connection closed");
  }
}

injectUser();