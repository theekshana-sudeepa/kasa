const { TransformStream } = require('node:stream/web');

async function test() {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode('Hello'));
      controller.enqueue(encoder.encode(' World'));
      controller.close();
    }
  });

  const injectTag = '<PRODUCTS>[{"product_id":"123"}]</PRODUCTS>';
  const transform = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(chunk);
    },
    flush(controller) {
      controller.enqueue(encoder.encode(`\n${injectTag}`));
    }
  });

  const transformed = stream.pipeThrough(transform);
  const reader = transformed.getReader();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (value) {
      fullText += decoder.decode(value, { stream: !done });
    } else if (done) {
      const remaining = decoder.decode();
      if (remaining) fullText += remaining;
    }
    
    if (done) break;
  }
  
  console.log("Full text received:", fullText);
}
test();
