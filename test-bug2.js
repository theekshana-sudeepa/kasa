function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractTagRegex(text, tagName) {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'g');
  let cleaned = text;
  let parsed = null;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const tryParse = safeParse(match[1].trim());
    if (tryParse) {
      parsed = tryParse;
    }
    cleaned = cleaned.replace(match[0], '');
  }

  const openTag = `<${tagName}>`;
  const lastOpenIdx = cleaned.lastIndexOf(openTag);
  let isStreaming = false;
  if (lastOpenIdx !== -1) {
    if (cleaned.indexOf(`</${tagName}>`, lastOpenIdx) === -1) {
      isStreaming = true;
      cleaned = cleaned.slice(0, lastOpenIdx);
    }
  }

  return { data: isStreaming ? null : parsed, cleaned: cleaned.trim() };
}

const aiText = `Here are products:\n<PRODUCTS>[{"id":"hallucinated"}] \n<PRODUCTS>[{"id":"hallucinated2"}]`;
const backendTag = `\n<PRODUCTS>[{"product_id":"1","name":"Rabbit Electronic Toy","price":1750,"currency":"LKR","image_url":"","url":"","in_stock":true}]</PRODUCTS>`;

console.log(extractTagRegex(aiText + backendTag, 'PRODUCTS'));
