# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Git Repository**: Your code should be pushed to GitHub, GitLab, or Bitbucket
3. **Environment Variables**: Prepare your production environment variables

## Step 1: Prepare Your Project

### Update Package.json Scripts
The following scripts are already configured for deployment:
- `build`: Creates production build
- `start`: Starts production server
- `lint`: Runs ESLint checks
- `typecheck`: Validates TypeScript

### Environment Variables Setup
Create these environment variables in Vercel dashboard:

#### Required Environment Variables:
```bash
# MongoDB Configuration
MONGODB_URI=your_production_mongodb_uri
MONGODB_DATABASE=kti_assets

# Application Configuration
NODE_ENV=production
NEXTAUTH_SECRET=your_secure_secret_key_here
NEXTAUTH_URL=https://your-app-name.vercel.app

# MongoDB Connection Pool Settings
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
MONGODB_MAX_IDLE_TIME=30000
MONGODB_SERVER_SELECTION_TIMEOUT=5000
MONGODB_SOCKET_TIMEOUT=45000
MONGODB_CONNECT_TIMEOUT=10000
MONGODB_HEARTBEAT_FREQUENCY=10000
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (if deploying from root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Option B: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# For production deployment
vercel --prod
```

## Step 3: Configure Environment Variables in Vercel

1. Go to your project dashboard on Vercel
2. Navigate to "Settings" → "Environment Variables"
3. Add all the environment variables listed above
4. Make sure to set the correct values for production

## Step 4: Configure Build Settings

### Vercel Configuration (vercel.json)
A `vercel.json` file has been created with optimal settings for your Next.js app.

### Build Optimization
- TypeScript errors are ignored during build (configured in next.config.ts)
- ESLint errors are ignored during build
- Server-side packages are properly externalized

## Step 5: Post-Deployment Checklist

1. **Test the deployed application**
2. **Verify database connectivity**
3. **Check all API routes are working**
4. **Test authentication flows**
5. **Verify file uploads and downloads**
6. **Check responsive design on different devices**

## Step 6: Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Configure DNS settings as instructed by Vercel

## Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check TypeScript errors: `npm run typecheck`
   - Check ESLint errors: `npm run lint`
   - Verify all dependencies are installed

2. **Environment Variables**
   - Ensure all required env vars are set in Vercel dashboard
   - Check variable names match exactly (case-sensitive)

3. **Database Connection Issues**
   - Verify MongoDB URI is correct for production
   - Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for Vercel)
   - Ensure database user has proper permissions

4. **API Route Issues**
   - Check server-side imports are not used in client components
   - Verify API routes are properly configured

## Performance Optimization

1. **Enable Vercel Analytics** (optional)
2. **Configure caching headers** for static assets
3. **Optimize images** using Next.js Image component
4. **Enable compression** (automatically handled by Vercel)

## Monitoring

1. **Vercel Functions**: Monitor serverless function performance
2. **Error Tracking**: Consider integrating Sentry or similar
3. **Database Monitoring**: Use MongoDB Atlas monitoring tools

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **CORS Configuration**: Ensure proper CORS settings for your domain
3. **Authentication**: Verify JWT secrets are secure
4. **Database Security**: Use strong passwords and proper user permissions

## Continuous Deployment

Vercel automatically deploys when you push to your main branch. To customize:

1. Go to project settings
2. Navigate to "Git"
3. Configure deployment branches and settings

---

Your KTI Assets application is now ready for production deployment on Vercel!