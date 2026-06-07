import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import * as path from "path";
import { hash } from "bcryptjs";

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://rohansamad_db_user:PU598eV34cUGy1Bv@cluster0.w9vzrlo.mongodb.net/authDB";
const DB_NAME = "bacchanal";

async function setup() {
    const client = new MongoClient(MONGODB_URI);
    try {
        console.log("Connecting to database...");
        await client.connect();
        const db = client.db(DB_NAME);
        const users = db.collection('users');
        const books = db.collection('user_books');
        const orders = db.collection('orders');

        // CLEAR EVERYTHING FOR FRESH START
        console.log("Cleaning up existing data...");
        await users.deleteMany({});
        await books.deleteMany({});
        await orders.deleteMany({});

        // CREATE ADMIN USER
        const adminPass = await hash("Admin@12345", 12);
        await users.insertOne({
            name: "Super Admin",
            email: "admin@dearbacchanal.com",
            password: adminPass,
            provider: "credentials",
            isAdmin: true,
            isPurchased: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // CREATE REGULAR TEST USER
        const userPass = await hash("Password123!", 12);
        await users.insertOne({
            name: "Test Citizen",
            email: "test@test.com",
            password: userPass,
            provider: "credentials",
            isAdmin: false,
            isPurchased: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        console.log("Setup completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error during setup:", err);
        process.exit(1);
    } finally {
        await client.close();
    }
}

setup();
