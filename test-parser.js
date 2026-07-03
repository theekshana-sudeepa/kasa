const allSearchText = `## Kapruka search: "cakes"
Showing 3 results (LKR)

**1. Cake Turning Table**
   ID: \`EF_PC_HOME0V18POD00194P\` · LKR 1,180 · In stock (low) · ships internationally
   [View product](https://www.kapruka.com/buyonline/cake-turning-table/kid/ef_pc_home0v18pod00194p)

**2. Mr And Mrs Cake Topper Gold**
   ID: \`EF_PC_PART0V44P00022\` · LKR 300 · In stock (low) · ships internationally
   [View product](https://www.kapruka.com/buyonline/mr-and-mrs-cake-topper-gold/kid/ef_pc_part0v44p00022)`;

const products = [];
// Strategy 2
const productRegex = /\*\*\d+\.\s+(.+?)\*\*\s*\n\s*ID:\s*`([^`]+)`\s*[·•]\s*LKR\s*([\d,]+)/g;
let match;
while ((match = productRegex.exec(allSearchText)) !== null) {
  const name = match[1].trim();
  const productId = match[2].trim();
  const price = parseInt(match[3].replace(/,/g, ''), 10);
  products.push({ product_id: productId, name, price });
}
console.log(products);
