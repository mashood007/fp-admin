# Deployment Checklist for Vercel Blob Storage

Use this checklist when deploying your admin panel to production with Vercel Blob storage.

## Pre-Deployment

- [ ] Code changes committed to Git
- [ ] `@vercel/blob` package is in package.json (v2.0.0+)
- [ ] Upload route updated to use Vercel Blob in production

## Vercel Setup

### 1. Create Blob Store
- [ ] Log in to [Vercel Dashboard](https://vercel.com/dashboard)
- [ ] Navigate to **Storage** tab
- [ ] Click **Create Database** → Select **Blob**
- [ ] Name your store (e.g., "perfume-admin-images")
- [ ] Select region closest to your users
- [ ] Click **Create**

### 2. Get Access Token
- [ ] Copy `BLOB_READ_WRITE_TOKEN` from the store details
- [ ] Save it securely (you'll need it for next step)

### 3. Configure Environment Variables
- [ ] Go to your project in Vercel Dashboard
- [ ] Navigate to **Settings** → **Environment Variables**
- [ ] Add the following variables:

#### Database
```
DATABASE_URL = <your_postgres_connection_string>
```

#### Authentication
```
NEXTAUTH_URL = https://your-domain.vercel.app
NEXTAUTH_SECRET = <generate_with_openssl_rand_base64_32>
```

#### Storage (CRITICAL for image uploads!)
```
BLOB_READ_WRITE_TOKEN = <token_from_blob_store>
```

- [ ] Set environment to **Production** (and optionally **Preview**)
- [ ] Click **Save**

### 4. Deploy
- [ ] Push your code to Git
  ```bash
  git add .
  git commit -m "Add Vercel Blob storage for image uploads"
  git push
  ```

- [ ] Deploy on Vercel (if auto-deploy is enabled, it will deploy automatically)
  ```bash
  # Or manually deploy
  vercel deploy --prod
  ```

## Post-Deployment Testing

### Test Image Upload
- [ ] Log in to your admin panel: `https://your-domain.vercel.app`
- [ ] Navigate to **Products** → **Add Product**
- [ ] Try uploading an image
- [ ] Verify the image uploads successfully
- [ ] Check that the image URL starts with `https://` and contains `blob.vercel-storage.com`
- [ ] Verify the image displays correctly in the product form
- [ ] Create/save the product
- [ ] View the product in the products list
- [ ] Verify the image displays correctly

### Test Image Display on Store Front
- [ ] Navigate to your store front
- [ ] View products with uploaded images
- [ ] Verify images load quickly from CDN
- [ ] Test on mobile devices

### Verify in Vercel Dashboard
- [ ] Go to **Storage** → Your Blob Store
- [ ] Click **Browse**
- [ ] Verify uploaded images appear in the store
- [ ] Check file names match format: `timestamp-randomstring.extension`

## Troubleshooting

### If upload fails:
1. Check browser console for errors
2. Verify `BLOB_READ_WRITE_TOKEN` is set correctly in Vercel
3. Check Vercel Function logs: **Deployments** → **Functions**
4. Ensure token has read/write permissions
5. Verify blob store is active and not paused

### If images don't display:
1. Check image URL in database (should be full Vercel Blob URL)
2. Verify blob access is set to "public"
3. Check browser console for CORS errors
4. Test URL directly in browser
5. Check Vercel Blob store status

### Check Logs
```bash
# View logs
vercel logs <your-deployment-url>

# View specific function
vercel logs --filter="/api/upload"
```

## Cost Monitoring

- [ ] Monitor blob storage usage in Vercel Dashboard
- [ ] Set up billing alerts if needed
- [ ] Review usage monthly

### Current Pricing (2024)
- Hobby: 1 GB free, $0.15/GB after
- Pro: 10 GB included

## Security Checklist

- [ ] Upload endpoint is protected with NextAuth authentication
- [ ] File type validation is in place (JPEG, PNG, WebP, GIF only)
- [ ] File size limit is enforced (5MB max)
- [ ] Blob store access is set to "public" for images
- [ ] Environment variables are secure (not in code)

## Performance Optimization

- [ ] Images are served from CDN (automatic with Vercel Blob)
- [ ] Consider adding image optimization in the future
- [ ] Monitor load times with Vercel Analytics

## Backup Strategy

- [ ] Consider periodic backups of blob store
- [ ] Document image URLs in database backups
- [ ] Keep `BLOB_READ_WRITE_TOKEN` in secure vault

## Development vs Production

### Development (Local)
✅ Uses local file system (`public/uploads/`)  
✅ No cloud dependencies  
✅ Works offline  

### Production (Vercel)
✅ Uses Vercel Blob storage  
✅ Global CDN delivery  
✅ Automatic scaling  

## Rollback Plan

If issues occur:

1. **Quick fix**: Temporarily set `NODE_ENV=development` in production (not recommended)
2. **Proper rollback**: Revert to previous deployment in Vercel Dashboard
3. **Debug**: Check logs and fix issues
4. **Re-deploy**: Push fixed code

## Success Criteria

✅ Images upload successfully in production  
✅ Images display correctly in admin panel  
✅ Images display correctly in store front  
✅ Images load from Vercel CDN (check URL)  
✅ No errors in Vercel function logs  
✅ File size and type validation working  

## Support Resources

- **Vercel Blob Docs**: https://vercel.com/docs/storage/vercel-blob
- **Vercel Support**: https://vercel.com/support
- **Implementation Guide**: See `VERCEL_BLOB_SETUP.md`
- **Summary**: See `IMPLEMENTATION_SUMMARY.md`

---

## Quick Reference

### Environment Variables Required
```env
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
BLOB_READ_WRITE_TOKEN=  # ← Critical for image uploads!
```

### Test Upload Endpoint
```bash
# Should return 401 (authentication required)
curl -X POST https://your-domain.vercel.app/api/upload
```

### Verify Deployment
1. Check deployment status in Vercel Dashboard
2. Test image upload functionality
3. Verify images load from blob.vercel-storage.com
4. Check function logs for errors

---

**Last Updated**: 2024  
**Implementation Status**: ✅ Complete and Production Ready

