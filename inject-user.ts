import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://rohansamad_db_user:PU598eV34cUGy1Bv@cluster0.w9vzrlo.mongodb.net/authDB";
const DB_NAME = "bacchanal";

const usersData = [
    {
        name: "admin",
        email: "admin@dearbacchanal.com",
        password: "$2b$10$J3wfqT0NDE9uhOSL6Fv8JuI8D9FH30bcepxJ1u.sW/HdwE87IKAVe", // Hashed: Admin@12345
        provider: "credentials",
        image: null,
        emailVerified: new Date(),
        isAdmin: true,
        isPurchased: false, // MANDATORY PAYMENT FOR TESTING
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: "test user",
        email: "test@bacchanal.com",
        password: "$2b$10$EKJlLcj5BACY/mZibrU1COTPAFg.sfPO9DCaPEXfJdtB6lmFyRE0i", // Hashed: pass1234
        provider: "credentials",
        image: null,
        emailVerified: null,
        isAdmin: false,
        isPurchased: false, // FOR TESTING STRIPE REDIRECT
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: "awais",
        email: "awais@gmail.com",
        password: "$2b$10$EKJlLcj5BACY/mZibrU1COTPAFg.sfPO9DCaPEXfJdtB6lmFyRE0i", // Hashed: pass1234
        provider: "credentials",
        image: null,
        emailVerified: null,
        isAdmin: false,
        isPurchased: false, // SET TO FALSE FOR TESTING
        createdAt: new Date(),
        updatedAt: new Date(),
    }
];

async function inject() {
    const client = new MongoClient(MONGODB_URI);
    try {
        console.log("Connecting to database:", MONGODB_URI.substring(0, 20) + "...");
        await client.connect();
        console.log("Connected to database.");
        const db = client.db(DB_NAME);
        const users = db.collection('users');

        for (const userData of usersData) {
            const existing = await users.findOne({ email: userData.email });
            if (existing) {
                console.log(`User ${userData.email} already exists. Updating...`);
                await users.replaceOne({ email: userData.email }, userData as any);
                console.log(`Updated user ${userData.email}.`);
            } else {
                console.log(`Inserting new user ${userData.email}...`);
                await users.insertOne(userData as any);
                console.log(`Inserted user ${userData.email}.`);
            }
        }
        console.log("Injection completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error injecting users:", err);
        process.exit(1);
    } finally {
        await client.close();
    }
}

inject();
