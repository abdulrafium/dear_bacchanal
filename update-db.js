require('dotenv').config();
const { MongoClient } = require('mongodb');

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('bacchanal');
  
  const template = await db.collection('global_templates').findOne({});
  let updatedCount = 0;
  
  if (template.spreads[1] && template.spreads[1].rightPage) {
    template.spreads[1].rightPage.elements.forEach(el => {
      if (el.id === 'GI653E89I') {
        el.text = 'Insert Your Name';
        updatedCount++;
      }
    });
  }

  if(updatedCount > 0) {
    await db.collection('global_templates').updateOne({_id: template._id}, {$set: {'spreads': template.spreads}});
    console.log('Successfully restored Insert Your Name to element GI653E89I');
  }
  
  await client.close();
}

run().catch(console.dir);
