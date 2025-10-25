# Store API Documentation

This document describes the customer-facing APIs for the e-commerce store order management system.

## Base URL
```
http://localhost:3000/api/store
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register Customer
**POST** `/auth/register`

Register a new customer account.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "optional_password",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "message": "Customer registered successfully",
  "customer": {
    "id": "customer_id",
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "isActive": true,
    "isVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Login Customer
**POST** `/auth/login`

Authenticate a customer and receive a JWT token.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "customer": {
    "id": "customer_id",
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "isActive": true,
    "isVerified": true
  },
  "token": "jwt_token_here"
}
```

### Customer Profile

#### Get Profile
**GET** `/customers/profile`

Get current customer's profile information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "customer": {
    "id": "customer_id",
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "shippingAddress1": "123 Main St",
    "shippingCity": "New York",
    "shippingState": "NY",
    "shippingZip": "10001",
    "shippingCountry": "US",
    "billingAddress1": "123 Main St",
    "billingCity": "New York",
    "billingState": "NY",
    "billingZip": "10001",
    "billingCountry": "US",
    "isActive": true,
    "isVerified": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update Profile
**PUT** `/customers/profile`

Update customer profile information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+1234567890",
  "shippingAddress1": "456 Oak Ave",
  "shippingCity": "Boston",
  "shippingState": "MA",
  "shippingZip": "02101",
  "shippingCountry": "US",
  "billingAddress1": "456 Oak Ave",
  "billingCity": "Boston",
  "billingState": "MA",
  "billingZip": "02101",
  "billingCountry": "US"
}
```

### Orders

#### Get Orders
**GET** `/orders`

Get customer's order history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (optional): Number of orders per page
- `offset` (optional): Number of orders to skip
- `status` (optional): Filter by order status

**Response:**
```json
{
  "orders": [
    {
      "id": "order_id",
      "orderNumber": "ORD-2024-1234567890-001",
      "status": "CONFIRMED",
      "subtotal": 100.00,
      "shippingCost": 10.00,
      "taxAmount": 8.00,
      "totalAmount": 118.00,
      "orderProducts": [
        {
          "id": "order_product_id",
          "productName": "Product Name",
          "unitPrice": 50.00,
          "quantity": 2,
          "subtotal": 100.00,
          "product": {
            "id": "product_id",
            "name": "Product Name",
            "images": [...]
          }
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0
  }
}
```

#### Create Order
**POST** `/orders`

Create a new order from cart items.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "items": [
    {
      "productId": "product_id_1",
      "quantity": 2
    },
    {
      "productId": "product_id_2",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "name": "John Doe",
    "email": "customer@example.com",
    "phone": "+1234567890",
    "address1": "123 Main St",
    "address2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  },
  "notes": "Please deliver after 5 PM"
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "order_id",
    "orderNumber": "ORD-2024-1234567890-001",
    "status": "PENDING",
    "subtotal": 150.00,
    "totalAmount": 168.00,
    "orderProducts": [...],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get Single Order
**GET** `/orders/{orderId}`

Get details of a specific order.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "order": {
    "id": "order_id",
    "orderNumber": "ORD-2024-1234567890-001",
    "status": "SHIPPED",
    "trackingNumber": "TRACK123456",
    "orderProducts": [...],
    "checkout": {...},
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Cancel Order
**PUT** `/orders/{orderId}`

Cancel an order (only allowed for PENDING/CONFIRMED orders).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "action": "cancel",
  "cancelReason": "Changed my mind"
}
```

### Checkout

#### Initialize Checkout
**POST** `/checkout`

Initialize the checkout process for an order.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "orderId": "order_id",
  "paymentMethod": "card",
  "billingAddress": {
    "name": "John Doe",
    "email": "customer@example.com",
    "address1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  }
}
```

**Response:**
```json
{
  "message": "Checkout initialized successfully",
  "checkout": {
    "id": "checkout_id",
    "orderId": "order_id",
    "paymentStatus": "PENDING",
    "sessionId": "checkout_session_id"
  },
  "paymentUrl": "/checkout/payment?session=checkout_session_id"
}
```

#### Complete Checkout
**POST** `/checkout/{checkoutId}/complete`

Complete the payment process.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "paymentReference": "payment_reference_from_gateway",
  "paymentGateway": "stripe",
  "sessionId": "checkout_session_id"
}
```

**Response:**
```json
{
  "message": "Payment completed successfully",
  "checkout": {
    "id": "checkout_id",
    "paymentStatus": "COMPLETED",
    "completedAt": "2024-01-01T00:00:00.000Z"
  },
  "order": {
    "id": "order_id",
    "status": "CONFIRMED"
  }
}
```

#### Cancel Checkout
**POST** `/checkout/{checkoutId}/cancel`

Cancel the checkout process.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "reason": "Payment cancelled by user"
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Order Flow Example

1. **Customer Registration/Login**
   ```bash
   POST /api/store/auth/register
   POST /api/store/auth/login
   ```

2. **Create Order from Cart**
   ```bash
   POST /api/store/orders
   ```

3. **Initialize Checkout**
   ```bash
   POST /api/store/checkout
   ```

4. **Complete Payment**
   ```bash
   POST /api/store/checkout/{id}/complete
   ```

5. **Check Order Status**
   ```bash
   GET /api/store/orders/{id}
   ```

## Environment Variables

Make sure to set these environment variables:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-jwt-secret-key
```
