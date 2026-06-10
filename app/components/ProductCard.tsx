'use client';

import { useState } from 'react';
import type { Product } from '../lib/mcp/types';
import { useChatStore } from '../lib/store/chat-store';
import ProductModal from './ProductModal';

interface ProductCardProps {
  product: Product;
}

function formatPrice(price: number, currency: string = 'LKR'): string {
  if (currency === 'LKR') {
    return `Rs. ${price.toLocaleString()}`;
  }
  return `${currency} ${price.toLocaleString()}`;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const addToCart = useChatStore((state) => state.addToCart);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.in_stock) return;
    setAdded(true);
    
    addToCart({
      product_id: product.product_id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url || '',
    });
    
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <>
      <div className="product-card" onClick={() => setShowModal(true)} style={{ position: 'relative' }}>
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
              <span className="product-card-stock">
                {product.in_stock ? '✓ In Stock' : 'Out of Stock'}
              </span>
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
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            >
              ℹ️ Info
            </button>
          </div>
        </div>
      </div>
      {showModal && (
        <ProductModal 
          product={product} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
}
