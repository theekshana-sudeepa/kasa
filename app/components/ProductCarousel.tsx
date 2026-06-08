'use client';

import type { Product } from '../lib/mcp/types';
import ProductCard from './ProductCard';

interface ProductCarouselProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export default function ProductCarousel({ products, onAddToCart, onViewDetails }: ProductCarouselProps) {
  if (!products || products.length === 0) return null;

  return (
    <div className="product-carousel-wrapper">
      <div className="product-carousel">
        {products.map((product, index) => (
          <div
            key={product.product_id}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <ProductCard
              product={product}
              onAddToCart={() => onAddToCart(product)}
              onViewDetails={() => onViewDetails(product)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
