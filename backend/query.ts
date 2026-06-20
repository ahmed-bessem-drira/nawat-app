import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb+srv://bessemdrira:bB3tq3yA807Vw49S@cluster0.a8mct.mongodb.net/nawat-focus?retryWrites=true&w=majority');
  const db = mongoose.connection;
  
  const children = await db.collection('children').find().toArray();
  console.log('Children:', children.length);
  
  const sessions = await db.collection('gamedatas').find().toArray();
  console.log('Sessions:', sessions.length);
  if (sessions.length > 0) {
    console.log('First session:', sessions[0]);
  }
  
  process.exit(0);
}
run();
