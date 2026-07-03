async function run() {
  const req = new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Show me home items',
      sessionId: 'test-session-123',
      language: 'en',
      cart: [],
      giftMode: false
    })
  });

  // We can just invoke the POST function directly
  const { POST } = require('./app/api/chat/route.ts'); // Need ts-node or something
}
