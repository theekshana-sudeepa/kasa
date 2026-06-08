// KASA AI Tools
// Tool execution is handled directly in the API route via MCP client
// This file is kept as a reference for available MCP tools

export const AVAILABLE_TOOLS = [
  {
    name: 'kapruka_search_products',
    description: 'Search for products on Kapruka.com',
    params: ['query', 'category?', 'min_price?', 'max_price?', 'currency?', 'in_stock_only?', 'limit?'],
  },
  {
    name: 'kapruka_get_product',
    description: 'Get detailed product information by ID',
    params: ['product_id', 'currency?'],
  },
  {
    name: 'kapruka_list_categories',
    description: 'List all product categories',
    params: [],
  },
  {
    name: 'kapruka_list_delivery_cities',
    description: 'Search delivery cities in Sri Lanka',
    params: ['query'],
  },
  {
    name: 'kapruka_check_delivery',
    description: 'Check delivery availability for a city/date/product',
    params: ['city', 'date', 'product_id'],
  },
  {
    name: 'kapruka_create_order',
    description: 'Create a guest checkout order',
    params: ['items', 'delivery_city', 'delivery_date', 'recipient_name', 'recipient_phone', 'recipient_address', 'sender_name', 'sender_email', 'gift_message?'],
  },
  {
    name: 'kapruka_track_order',
    description: 'Track an order by number',
    params: ['order_number'],
  },
] as const;
