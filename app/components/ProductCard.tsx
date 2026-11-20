'use client';

import { useState } from 'react';
import type { Product } from '../lib/mcp/types';
import { useChatStore } from '../lib/store/chat-store';
import ProductModal from './ProductModal';
import KasaPickBadge from './KasaPickBadge';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Info, Check, Package } from 'lucide-react';

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
  const [imgLoaded, setImgLoaded] = useState(false);
  const [added, setAdded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const addToCart = useChatStore((state) => state.addToCart);
  const toast = useToast();

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
    toast.success(`Added to cart!`);
    
    setTimeout(() => setAdded(false), 2000);
  };

  const hasValidImage = product.image_url && 
    !imgError && 
    !product.image_url.includes('placehold.co') &&
    !product.image_url.includes('placeholder');

  return (
    <>
      <motion.div 
        className="product-card" 
        onClick={() => setShowModal(true)}
        whileHover={{ y: -6 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
      >
        <div className="product-card-image-wrapper">
          {hasValidImage ? (
            <>
              {!imgLoaded && (
                <div className="product-card-image-placeholder">
                  <div className="product-card-shimmer" />
                  <Package size={32} style={{ opacity: 0.3 }} />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element -- Dynamic external Kapruka MCP product image URL with custom shimmer & error fallback */}
              <img
                className="product-card-image"
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                style={{ 
                  opacity: imgLoaded ? 1 : 0,
                  position: imgLoaded ? 'relative' : 'absolute',
                }}
              />
            </>
          ) : (
            <div className="product-card-image-placeholder">
              <Package size={36} strokeWidth={1.5} />
            </div>
          )}
          
          {/* Price badge overlay */}
          <div className="product-card-price-badge">
            {formatPrice(product.price, product.currency)}
          </div>

          {/* v4.0 — KASA's Pick badge */}
          {product.kasaPick && (
            <div style={{ position: 'absolute', top: 8, left: 8 }}>
              <KasaPickBadge reason={product.matchReason} compact />
            </div>
          )}
        </div>
        
        <div className="product-card-body">
          <div className="product-card-name">{product.name}</div>
          <div className="product-card-meta">
            {product.in_stock !== false && (
              <span className="product-card-stock">
                <Check size={11} strokeWidth={3} /> In Stock
              </span>
            )}
          </div>
          <div className="product-card-actions">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`product-card-btn product-card-btn-primary ${added ? 'added' : ''}`}
              onClick={handleAdd}
            >
              <AnimatePresence mode="wait">
                {added ? (
                  <motion.span
                    key="added"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Check size={13} strokeWidth={3} /> Added!
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ShoppingCart size={13} /> Add
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="product-card-btn product-card-btn-secondary"
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            >
              <Info size={13} /> Info
            </motion.button>
          </div>
        </div>
      </motion.div>
      {showModal && (
        <ProductModal 
          product={product} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
}
