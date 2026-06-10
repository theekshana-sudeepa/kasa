'use client';

import type { Product } from '../lib/mcp/types';
import ProductCard from './ProductCard';

interface ProductCarouselProps {
  products: Product[];
}

export default function ProductCarousel({ products }: ProductCarouselProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="product-carousel-wrapper">
      <div className="product-carousel">
        {products.map((product, index) => (
          <div
            key={`${product.product_id}-${index}`}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <ProductCard
              product={product}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
