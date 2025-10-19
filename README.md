# Perfume Admin Panel

A modern admin panel for managing perfume ecommerce products built with Next.js 14, PostgreSQL, Prisma, and Tailwind UI.

## Features

- 🔐 **Admin Authentication** - Secure login with NextAuth.js
- 📦 **Product Management** - Create, read, update, and delete products
- 🖼️ **Image Upload** - Multiple image support with Vercel Blob (production) or local storage (development)
- 📊 **Dashboard** - Overview of products and statistics
- 🎨 **Modern UI** - Beautiful interface built with Tailwind UI components
- 🔒 **Protected Routes** - Middleware-based authentication
- 📱 **Responsive Design** - Works on all devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Storage**: Vercel Blob (Production) / Local File System (Development)
- **Styling**: Tailwind CSS + Tailwind UI
- **Icons**: Heroicons
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **TypeScript**: Full type safety

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ and npm/yarn
- PostgreSQL database

## Getting Started

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/perfume_admin?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# Admin Credentials (for initial setup)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"

# Vercel Blob Storage (Required for Production only)
# Get this from: https://vercel.com/dashboard/stores
BLOB_READ_WRITE_TOKEN="vercel_blob_token_here"
```

**Generate a secure NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Note**: The `BLOB_READ_WRITE_TOKEN` is only required for production deployments. In development, images are stored locally in the `public/uploads` directory.

### 3. Set Up the Database

```bash
# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### 4. Create an Admin User

Create a script to seed your admin user. Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@example.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: hashedPassword,
      name: 'Admin',
      role: 'admin',
    },
  });

  console.log('Admin user created:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

Install ts-node:
```bash
npm install -D ts-node
```

Run the seed:
```bash
npx prisma db seed
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Login

1. Navigate to `/login` (or root `/`)
2. Enter your admin credentials:
   - Email: `admin@example.com` (or your configured email)
   - Password: `admin123` (or your configured password)

### Dashboard

After login, you'll see the dashboard with:
- Total products count
- Active products count

### Product Management

#### View Products
- Navigate to **Products** from the sidebar
- See all products in a table with name, price, stock, category, and status

#### Create Product
1. Click **Add product** button
2. Fill in the form:
   - Name (required)
   - Description
   - Price (required)
   - Stock (required)
   - Category
   - Brand
   - Image URL
   - Active status
3. Click **Create Product**

#### Edit Product
1. Click the edit icon (pencil) on any product
2. Update the fields
3. Click **Update Product**

#### Delete Product
1. Click the delete icon (trash) on any product
2. Confirm the deletion

## Project Structure

```
admin/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth API routes
│   │   └── products/              # Product API routes
│   ├── dashboard/                 # Dashboard page
│   ├── login/                     # Login page
│   ├── products/                  # Product pages
│   │   ├── [id]/edit/            # Edit product page
│   │   └── new/                  # Create product page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Root page (redirects to login)
│   ├── providers.tsx             # Session provider
│   └── globals.css               # Global styles
├── components/
│   ├── Header.tsx                # Header component
│   ├── ProductTable.tsx          # Product table component
│   └── Sidebar.tsx               # Sidebar navigation
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   └── prisma.ts                 # Prisma client
├── prisma/
│   └── schema.prisma             # Database schema
├── types/
│   └── next-auth.d.ts            # NextAuth type definitions
└── middleware.ts                 # Route protection middleware
```

## Database Schema

### User Model
- `id`: Unique identifier
- `email`: User email (unique)
- `password`: Hashed password
- `name`: User name
- `role`: User role (default: "admin")
- `createdAt`: Creation timestamp
- `updatedAt`: Update timestamp

### Product Model
- `id`: Unique identifier
- `name`: Product name
- `description`: Product description
- `price`: Product price
- `stock`: Available stock
- `category`: Product category
- `brand`: Product brand
- `imageUrl`: Product image URL
- `isActive`: Active status
- `createdAt`: Creation timestamp
- `updatedAt`: Update timestamp

## API Routes

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create a product
- `GET /api/products/[id]` - Get a product by ID
- `PUT /api/products/[id]` - Update a product
- `DELETE /api/products/[id]` - Delete a product

## Security Features

- Password hashing with bcrypt
- JWT-based session management
- Protected routes with middleware
- Server-side authentication checks
- CSRF protection (built-in with NextAuth)

## Deployment

### Database Setup
1. Create a PostgreSQL database on your hosting provider
2. Update `DATABASE_URL` in your environment variables

### Vercel Blob Storage Setup (Production)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** tab
3. Create a new **Blob Store**
4. Copy the `BLOB_READ_WRITE_TOKEN` from the store settings
5. Add it to your environment variables

### Environment Variables
Set all required environment variables in your deployment platform:
- `DATABASE_URL`
- `NEXTAUTH_URL` (your production URL)
- `NEXTAUTH_SECRET`
- `BLOB_READ_WRITE_TOKEN` (from Vercel Blob Store)

### Build and Deploy

**Important**: Ensure Prisma Client is generated during build:
```bash
# The build script now includes prisma generate
npm run build  # runs: prisma generate && next build
npm start
```

**For Vercel**: No configuration needed. Vercel will automatically:
1. Install dependencies (runs `postinstall` script)
2. Run the build command
3. Deploy the application

**Troubleshooting Production Issues**: See `PRODUCTION_FIX.md` for detailed debugging steps.

### Image Upload Configuration

The application uses a hybrid approach for image uploads:

- **Development**: Images are stored locally in `public/uploads/` directory
- **Production**: Images are stored in Vercel Blob Storage (requires `BLOB_READ_WRITE_TOKEN`)

This ensures:
- Fast local development without cloud dependencies
- Scalable, CDN-backed storage in production
- No need for persistent file storage on serverless platforms

## Development Tips

### Prisma Commands
```bash
# Create a migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Generate Prisma Client
npx prisma generate
```

### Troubleshooting

**Issue**: Can't connect to database
- Check your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Verify database credentials

**Issue**: NextAuth errors
- Verify `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies and try again

**Issue**: Prisma Client errors
- Run `npx prisma generate`
- Restart your dev server

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for your own purposes.

## Support

For questions or issues, please open an issue in the repository.

