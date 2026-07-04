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

  const orderId = '6a492cc16fc64120d63e7581';

  const order = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });

  if (order) {
    console.log('--- FOUND ORDER ---');
    console.log('Book ID:', order.bookId);
    console.log('Order Status:', order.status);
    console.log('Original Order ID (24 chars):', order._id.toString());
    console.log('Source Order ID (18 chars, for SiteFlow):', order.sourceOrderId || 'NOT SET YET (Order must be approved by Admin first!)');

    const book = await db.collection('user_books').findOne({ _id: new ObjectId(order.bookId) });
    console.log('Book Cover PDF:', book ? (book.savedCoverPdfUrl || 'MISSING!') : 'MISSING!');
    console.log('Book Inner Pages PDF:', book ? (book.savedTextPdfUrl || 'MISSING!') : 'MISSING!');
  } else {
    console.log('Order not found.');
  }

  await client.close();
}
getBookId().catch(console.error);
