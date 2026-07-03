const markdown = `## Kapruka Categories

- [Automobile](https://www.kapruka.com/online/automobile)
- [Ayurvedic](https://www.kapruka.com/online/ayurvedic)
- [Bicycle](https://www.kapruka.com/online/bicycles)
- [Adult Products](https://www.kapruka.com/online/intimate_essentials)
`;

const regex = /- \[([^\]]+)\]\(([^)]+)\)/g;
const categories = [];
let match;
while ((match = regex.exec(markdown)) !== null) {
  const name = match[1];
  const url = match[2];
  const slug = url.split('/').pop();
  categories.push({ name, url, slug });
}
console.log(categories);
