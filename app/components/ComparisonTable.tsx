'use client';

import type { Product } from '../lib/mcp/types';
import { useChatStore } from '../lib/store/chat-store';

interface ComparisonTableProps {
  products: Product[];
}

export default function ComparisonTable({ products }: ComparisonTableProps) {
  const addToCart = useChatStore((state) => state.addToCart);

  if (!products || products.length === 0) return null;

  const handleAdd = (product: Product) => {
    addToCart({
      product_id: product.product_id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url || '',
    });
  };

  // Find the cheapest and most expensive product to highlight
  const minPrice = Math.min(...products.map(p => p.price));
  const maxPrice = Math.max(...products.map(p => p.price));

  return (
    <div className="comparison-table-wrapper">
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Feature</th>
            {products.map((p, idx) => (
              <th key={idx}>{p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Image</td>
            {products.map((p, idx) => (
              <td key={idx}>
                {/* eslint-disable-next-line @next/next/no-img-element -- Dynamic external Kapruka MCP product image URL */}
                <img src={p.image_url} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
              </td>
            ))}
          </tr>
          <tr>
            <td>Price</td>
            {products.map((p, idx) => {
              const priceRatio = maxPrice > 0 ? p.price / maxPrice : 0;
              return (
                <td key={idx} className={p.price === minPrice ? 'highlight' : ''}>
                  Rs. {p.price.toLocaleString()}
                  <div style={{ marginTop: '6px', height: '4px', background: 'var(--kasa-surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${priceRatio * 100}%`,
                      height: '100%',
                      background: p.price === minPrice ? '#22c55e' : 'var(--kasa-primary-400)',
                      borderRadius: '2px'
                    }} />
                  </div>
                </td>
              );
            })}
          </tr>
          <tr>
            <td>Stock</td>
            {products.map((p, idx) => (
              <td key={idx} style={{ color: p.in_stock ? 'var(--kasa-success)' : 'var(--kasa-error)' }}>
                {p.in_stock ? 'In Stock' : 'Out of Stock'}
              </td>
            ))}
          </tr>
          <tr>
            <td>Action</td>
            {products.map((p, idx) => (
              <td key={idx}>
                <button 
                  onClick={() => handleAdd(p)}
                  disabled={!p.in_stock}
                  style={{
                    background: 'var(--kasa-primary-500)',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: p.in_stock ? 'pointer' : 'not-allowed',
                    opacity: p.in_stock ? 1 : 0.5
                  }}
                >
                  Add
                </button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
