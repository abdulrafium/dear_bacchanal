const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const dotenv = require('dotenv');
const dns = require('dns');

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const envConfig = dotenv.parse(fs.readFileSync('.env'));
const uri = envConfig.MONGODB_URI;

async function getBookId() {
  const client = await MongoClient.connect(uri);
  const db = client.db('bacchanal');

  const orderId = '6a33ed0543d78e352aee4388';

  const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });

  if (order) {
    console.log('--- FOUND ORDER ---');
    console.log('Book ID:', order.bookId);

    const book = await db.collection('user_books').findOne({ _id: new ObjectId(order.bookId) });
    console.log('Book savedPdfUrl:', book ? book.savedPdfUrl : 'MISSING!');
  } else {
    console.log('Order not found.');
  }

  await client.close();
}
getBookId().catch(console.error);
