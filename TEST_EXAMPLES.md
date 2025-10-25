# API Test Examples

This document provides test examples for the store order creation APIs.

## Prerequisites

1. Make sure the admin server is running on port 3000
2. Run the database migration: `npx prisma migrate dev`
3. Set environment variables: `DATABASE_URL` and `JWT_SECRET`

## Test Sequence

### 1. Register a Customer

```bash
curl -X POST http://localhost:3000/api/store/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "John Doe",
    "phone": "+1234567890"
  }'
```

**Expected Response:**
```json
{
  "message": "Customer registered successfully",
  "customer": {
    "id": "customer_id_here",
    "email": "test@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "isActive": true,
    "isVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Login Customer

```bash
curl -X POST http://localhost:3000/api/store/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Expected Response:**
```json
{
  "message": "Login successful",
  "customer": { ... },
  "token": "jwt_token_here"
}
```

**Save the token for subsequent requests!**

### 3. Get Customer Profile

```bash
curl -X GET http://localhost:3000/api/store/customers/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 4. Update Customer Profile

```bash
curl -X PUT http://localhost:3000/api/store/customers/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "name": "John Smith",
    "shippingAddress1": "123 Main St",
    "shippingCity": "New York",
    "shippingState": "NY",
    "shippingZip": "10001",
    "shippingCountry": "US"
  }'
```

### 5. Get Products (to find product IDs)

```bash
curl -X GET http://localhost:3000/api/store/products
```

### 6. Create an Order

```bash
curl -X POST http://localhost:3000/api/store/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "items": [
      {
        "productId": "PRODUCT_ID_FROM_STEP_5",
        "quantity": 2
      }
    ],
    "shippingAddress": {
      "name": "John Doe",
      "email": "test@example.com",
      "phone": "+1234567890",
      "address1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "US"
    },
    "notes": "Please deliver after 5 PM"
  }'
```

**Expected Response:**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "order_id_here",
    "orderNumber": "ORD-2024-...",
    "status": "PENDING",
    "totalAmount": 100.00,
    "orderProducts": [...]
  }
}
```

**Save the order ID for checkout!**

### 7. Initialize Checkout

```bash
curl -X POST http://localhost:3000/api/store/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "orderId": "ORDER_ID_FROM_STEP_6",
    "paymentMethod": "card",
    "billingAddress": {
      "name": "John Doe",
      "email": "test@example.com",
      "address1": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "US"
    }
  }'
```

**Expected Response:**
```json
{
  "message": "Checkout initialized successfully",
  "checkout": {
    "id": "checkout_id_here",
    "sessionId": "checkout_session_id"
  },
  "paymentUrl": "/checkout/payment?session=..."
}
```

**Save the checkout ID!**

### 8. Complete Payment

```bash
curl -X POST http://localhost:3000/api/store/checkout/CHECKOUT_ID_FROM_STEP_7/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "paymentReference": "payment_ref_12345",
    "paymentGateway": "stripe",
    "sessionId": "SESSION_ID_FROM_STEP_7"
  }'
```

**Expected Response:**
```json
{
  "message": "Payment completed successfully",
  "checkout": {
    "paymentStatus": "COMPLETED"
  },
  "order": {
    "status": "CONFIRMED"
  }
}
```

### 9. Get Order Details

```bash
curl -X GET http://localhost:3000/api/store/orders/ORDER_ID_FROM_STEP_6 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 10. Get All Orders

```bash
curl -X GET http://localhost:3000/api/store/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### 11. Cancel an Order (Optional)

```bash
curl -X PUT http://localhost:3000/api/store/orders/ORDER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "action": "cancel",
    "cancelReason": "Changed my mind"
  }'
```

## JavaScript/TypeScript Example

Here's how you might use these APIs in a frontend application:

```typescript
// API client setup
const API_BASE = 'http://localhost:3000/api/store';

class StoreAPI {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Authentication
  async register(data: { email: string; password: string; name: string; phone?: string }) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();
    if (result.token) {
      this.setToken(result.token);
    }
    return result;
  }

  // Orders
  async createOrder(orderData: {
    items: Array<{ productId: string; quantity: number }>;
    shippingAddress: any;
    notes?: string;
  }) {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(orderData),
    });
    return response.json();
  }

  async getOrders() {
    const response = await fetch(`${API_BASE}/orders`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  // Checkout
  async initializeCheckout(data: {
    orderId: string;
    paymentMethod: string;
    billingAddress: any;
  }) {
    const response = await fetch(`${API_BASE}/checkout`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async completePayment(checkoutId: string, paymentData: {
    paymentReference: string;
    paymentGateway: string;
    sessionId: string;
  }) {
    const response = await fetch(`${API_BASE}/checkout/${checkoutId}/complete`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(paymentData),
    });
    return response.json();
  }
}

// Usage example
const api = new StoreAPI();

async function placeOrder() {
  try {
    // Login
    const loginResult = await api.login('test@example.com', 'password123');
    console.log('Logged in:', loginResult);

    // Create order
    const order = await api.createOrder({
      items: [{ productId: 'product_id_here', quantity: 2 }],
      shippingAddress: {
        name: 'John Doe',
        email: 'test@example.com',
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US'
      }
    });
    console.log('Order created:', order);

    // Initialize checkout
    const checkout = await api.initializeCheckout({
      orderId: order.order.id,
      paymentMethod: 'card',
      billingAddress: {
        name: 'John Doe',
        email: 'test@example.com',
        address1: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US'
      }
    });
    console.log('Checkout initialized:', checkout);

    // Complete payment (in real app, this would be after payment processor)
    const payment = await api.completePayment(checkout.checkout.id, {
      paymentReference: 'payment_ref_12345',
      paymentGateway: 'stripe',
      sessionId: checkout.checkout.sessionId
    });
    console.log('Payment completed:', payment);

  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Environment Setup

Make sure your `.env` file in the admin directory contains:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
JWT_SECRET="your-secret-key-here"
```

## Database Migration

Before testing, run:

```bash
cd admin
npx prisma migrate dev --name "add-customer-order-models"
```
