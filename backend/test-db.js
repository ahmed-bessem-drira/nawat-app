const mongoose = require('mongoose');

async function test() {
  try {
    // Try the vs947ch cluster first
    const uri = 'mongodb+srv://ahmedddrira2_db_user:ahmedetyessine@cluster0.vs947ch.mongodb.net/nawat-parents?retryWrites=true&w=majority';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri, { family: 4 });
    console.log('Connected to DB');

    const db = mongoose.connection.db;

    const allGameData = await db.collection('gamedatas').find({}).sort({createdAt: -1}).limit(5).toArray();
    console.log('Recent game data in DB:', allGameData.length);
    console.log(JSON.stringify(allGameData, null, 2));

    const children = await db.collection('children').find({}).limit(5).toArray();
    console.log('Children in DB:');
    console.log(JSON.stringify(children, null, 2));
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

test();

