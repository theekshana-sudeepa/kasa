const markdown = `## Kapruka search: "electronics"
Showing 2 results (LKR)

**1. Rabbit Electronic Toy**
   ID: \`EF_PC_KIDS0V2686POD00064\` · LKR 1,750 · In stock (low) · ships internationally
   [View product](https://www.kapruka.com/buyonline/rabbit-electronic-toy/kid/ef_pc_kids0v2686pod00064)

**2. Mortine Mosquito Vaporizer Machine With Liquid Refill - 30 Night**
   ID: \`GROCERY001822\` · LKR 840 · In stock (low) · ships internationally
   [View product](https://www.kapruka.com/buyonline/mortine-mosquito-vaporizer-mac/kid/grocery001822)`;

const products = [];
const productRegex = /\*\*\d+\.\s+(.+?)\*\*\s*\n\s*ID:\s*`([^`]+)`\s*[·•]\s*LKR\s*([\d,]+)/g;
let match;
while ((match = productRegex.exec(markdown)) !== null) {
  const name = match[1].trim();
  const productId = match[2].trim();
  const price = parseInt(match[3].replace(/,/g, ''), 10);
  products.push({ product_id: productId, name, price });
}
console.log(products);
