async function run() {
  try {
    // We don't have the user's token. But we can register a new user, 
    // create a child named "df2", and insert data!
    
    // 1. Register
    const email = 'demo_' + Date.now() + '@demo.com';
    const loginRes = await fetch('http://localhost:3001/api/parents/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Demo Parent', email, password: 'Password123!', phone: '123', address: '123' })
    });
    const { token } = await loginRes.json();

    // 2. Add child
    const childRes = await fetch('http://localhost:3001/api/parents/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: 'df2', nickname: 'df2', language: 'fr' })
    });
    const child = await childRes.json();
    console.log('Created child:', child.name, child.uniqueCode);

    // 3. Sync data
    const games = ['NOISE_SOUK', 'GATE_OF_PATIENCE', 'CLOUD_VALLEY', 'BACKPACK_OASIS'];
    for(let i=0; i<10; i++) {
      const syncRes = await fetch('http://localhost:3001/api/sync/game-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uniqueCode: child.uniqueCode,
          gameType: games[i % 4],
          duration: 120 + i*10,
          metrics: {
            accuracy: 60 + i*4,
            reactionTime: 300 + i*20,
            omissions: i%2,
            commissions: i%3,
            calmScore: 50 + i*5
          }
        })
      });
      console.log('Sync', i, syncRes.status);
    }
    console.log('Done! Login with:', email, 'Password123!');
  } catch (err) {
    console.error(err);
  }
}
run();
