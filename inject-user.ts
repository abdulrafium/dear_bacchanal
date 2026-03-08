import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb+srv://rohansamad_db_user:PU598eV34cUGy1Bv@cluster0.w9vzrlo.mongodb.net/?appName=Cluster0";
const DB_NAME = "bacchanal";

const userData = {
    name: "awais",
    email: "awais@gmail.com",
    password: "$2b$12$lGFJXKGri4bhipqPhvAC1OpyNn4mKoUNyFfo37RprzCiQ/eaxNpj.",
    provider: "credentials",
    image: null,
    emailVerified: null,
    createdAt: new Date("2026-02-23T18:30:53.576Z"),
    updatedAt: new Date("2026-02-23T18:54:41.151Z"),
    isPurchased: true,
    shippingDetails: {
        address: {
            city: "jkkj",
            country: "US",
            line1: "dskdj",
            line2: "jkk",
            postal_code: "32323",
            state: "FL"
        },
        carrier: null,
        name: "awau",
        phone: null,
        tracking_number: null
    },
    pdfUploadedAt: new Date("2026-02-23T18:58:22.379Z"),
    savedPdfUrl: "https://utfs.io/f/1hdj0IgUIJZuRpbrlKJleU51i7qnxakWPDGVp2YASh4NomwH"
};

async function inject() {
    const client = new MongoClient(MONGODB_URI);
    try {
        console.log("Connecting to database...");
        await client.connect();
        const db = client.db(DB_NAME);
        const users = db.collection('users');

        // Check if user already exists
        const existing = await users.findOne({ email: userData.email });
        if (existing) {
            console.log(`User ${userData.email} already exists. Updating...`);
            const result = await users.replaceOne({ email: userData.email }, userData as any);
            console.log(`Update result: ${result.acknowledged ? 'Success' : 'Failed'}`);
        } else {
            console.log(`Inserting new user ${userData.email}...`);
            const result = await users.insertOne(userData as any);
            console.log(`Insert result: ${result.acknowledged ? 'Success' : 'Failed'}`);
        }
        console.log("Done!");
        process.exit(0);
    } catch (err) {
        console.error("Error injecting user:", err);
        process.exit(1);
    } finally {
        await client.close();
    }
}

inject();
