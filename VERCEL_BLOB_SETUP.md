# Vercel Blob Storage Setup Guide

This guide explains how to set up Vercel Blob Storage for product image uploads in production.

## Overview

The admin panel uses a hybrid approach for image storage:
- **Development**: Images are stored locally in `public/uploads/` directory
- **Production**: Images are stored in Vercel Blob Storage

## Why Vercel Blob?

1. **Serverless-friendly**: No need for persistent file storage on Vercel's serverless platform
2. **CDN-backed**: Global content delivery for fast image loading
3. **Automatic optimization**: Images are served efficiently
4. **Scalable**: Pay-as-you-go pricing, no storage limits
5. **Simple integration**: Works seamlessly with Next.js

## Setup Instructions

### Step 1: Create a Vercel Blob Store

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the **Storage** tab
3. Click **Create Database** and select **Blob**
4. Give your blob store a name (e.g., `perfume-admin-images`)
5. Choose your desired region (preferably close to your users)
6. Click **Create**

### Step 2: Get Your Access Token

1. After creating the blob store, you'll see the connection details
2. Copy the `BLOB_READ_WRITE_TOKEN` value
3. This token allows your application to upload and access files

### Step 3: Configure Environment Variables

#### For Vercel Deployment

1. Go to your project settings in Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Key**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Your token from Step 2
   - **Environment**: Select **Production** (and optionally Preview)
4. Click **Save**

#### For Local Testing of Production Mode

If you want to test the production behavior locally:

1. Add to your `.env` file:
   ```env
   NODE_ENV=production
   BLOB_READ_WRITE_TOKEN=your_token_here
   ```

2. Run the build:
   ```bash
   npm run build
   npm start
   ```

**Note**: For normal development, you don't need the `BLOB_READ_WRITE_TOKEN`. The app will automatically use local file storage.

## How It Works

The upload API route (`/api/upload/route.ts`) automatically detects the environment:

```typescript
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) {
  // Use Vercel Blob
  const blob = await put(filename, file, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  url = blob.url;
} else {
  // Use local file system
  await writeFile(filepath, buffer);
  url = `/uploads/${filename}`;
}
```

## Image URLs

### Development
Images are served from your local server:
```
http://localhost:3000/uploads/1760783756083-tc1au2q39oe.png
```

### Production
Images are served from Vercel's CDN:
```
https://xxxxxxxxx.public.blob.vercel-storage.com/1760783756083-tc1au2q39oe.png
```

## Pricing

Vercel Blob Storage pricing (as of 2024):
- **Hobby Plan**: 1 GB free, then $0.15/GB
- **Pro Plan**: 10 GB included
- **Enterprise**: Custom pricing

Check [Vercel Pricing](https://vercel.com/docs/storage/vercel-blob/pricing) for current rates.

## File Size Limits

The application enforces:
- Maximum file size: **5MB** per image
- Supported formats: JPEG, PNG, WebP, GIF

You can adjust these limits in `/app/api/upload/route.ts`.

## Troubleshooting

### Error: "Storage configuration error"

**Cause**: The `BLOB_READ_WRITE_TOKEN` environment variable is not set in production.

**Solution**:
1. Verify the token is added in Vercel's environment variables
2. Redeploy your application after adding the variable

### Error: "Failed to upload file"

**Possible causes**:
1. Invalid or expired token
2. Network connectivity issues
3. File exceeds size limits
4. Invalid file type

**Solution**:
1. Check the token is correct and active
2. Verify file meets size and type requirements
3. Check server logs for specific error messages

### Images not loading in production

**Cause**: Blob store URLs may be blocked or CORS issues.

**Solution**:
1. Ensure the blob store is set to "public" access
2. Check browser console for CORS errors
3. Verify the URLs in the database are correct

## Migration from Local Storage

If you have existing images in local storage and want to migrate to Vercel Blob:

1. **Manual Migration**: Download images and re-upload through the admin panel
2. **Automated Migration**: Create a script to upload existing images to Vercel Blob and update database URLs

Example migration script:
```typescript
import { put } from '@vercel/blob';
import { readFile } from 'fs/promises';
import { prisma } from '@/lib/prisma';

async function migrateImages() {
  const products = await prisma.product.findMany({
    include: { images: true }
  });

  for (const product of products) {
    for (const image of product.images) {
      if (image.url.startsWith('/uploads/')) {
        const filename = image.url.replace('/uploads/', '');
        const filepath = join(process.cwd(), 'public', 'uploads', filename);
        const file = await readFile(filepath);
        
        const blob = await put(filename, file, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN!,
        });
        
        await prisma.productImage.update({
          where: { id: image.id },
          data: { url: blob.url }
        });
      }
    }
  }
}
```

## Additional Resources

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Blob SDK Reference](https://vercel.com/docs/storage/vercel-blob/using-blob-sdk)
- [@vercel/blob npm package](https://www.npmjs.com/package/@vercel/blob)

## Support

If you encounter issues:
1. Check the [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)
2. Review server logs in Vercel Dashboard
3. Contact Vercel Support for storage-specific issues

