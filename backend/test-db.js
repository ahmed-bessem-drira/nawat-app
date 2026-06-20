const mongoose = require('mongoose');

async function test() {
  try {
    await mongoose.connect('mongodb+srv://bessemdrirabwork:WfUWeVlW3lW3Z76E@cluster0.a8mct.mongodb.net/nawat_focus?retryWrites=true&w=majority', { family: 4 });
    console.log('Connected to DB');

    const allGameData = await db.collection('gamedatas').find({}).sort({createdAt: -1}).limit(5).toArray();
    console.log('Recent game data in DB:', allGameData.length);
    console.log(JSON.stringify(allGameData, null, 2));

    const children = await db.collection('children').find({}).limit(5).toArray();
    console.log('Children in DB:');
    console.log(JSON.stringify(children, null, 2));
    
    mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
