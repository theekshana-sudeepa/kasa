'use client';

import { useState } from 'react';
import type { Product } from '../lib/mcp/types';

interface ProductCardProps {
  product: Product;
  onAddToCart: () => void;
  onViewDetails: () => void;
}

function formatPrice(price: number, currency: string = 'LKR'): string {
  if (currency === 'LKR') {
    return `Rs. ${price.toLocaleString()}`;
  }
  return `${currency} ${price.toLocaleString()}`;
}

export default function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAdded(true);
    onAddToCart();
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-card" onClick={onViewDetails} style={{ position: 'relative' }}>
      {product.image_url && !imgError ? (
        <img
          className="product-card-image"
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="product-card-image-placeholder">📦</div>
      )}
      <div className="product-card-body">
        <div className="product-card-name">{product.name}</div>
        <div className="product-card-price">
          {formatPrice(product.price, product.currency)}
        </div>
        <div className="product-card-meta">
          {product.in_stock !== false && (
            <span className="product-card-stock">✓ In Stock</span>
          )}
        </div>
        <div className="product-card-actions">
          <button
            className="product-card-btn product-card-btn-primary"
            onClick={handleAdd}
          >
            {added ? '✓ Added' : '🛒 Add'}
          </button>
          <button
            className="product-card-btn product-card-btn-secondary"
            onClick={(e) => { e.stopPropagation(); onViewDetails(); }}
          >
            ℹ️ Info
          </button>
        </div>
      </div>
    </div>
  );
}
