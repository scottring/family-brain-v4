# Vercel Deployment Guide

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- Supabase project with environment variables ready

## Deployment Steps

### 1. Install Vercel CLI (optional)
```bash
npm install -g vercel
```

### 2. Deploy via GitHub (Recommended)
1. Push your code to a GitHub repository
2. Go to https://vercel.com/dashboard
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables (see step 4 below)
6. Deploy

### 3. Deploy via CLI
```bash
# From project root
vercel

# Follow the prompts to configure your project
```

### 4. Environment Variables
Add these environment variables in Vercel dashboard (Settings → Environment Variables):

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key  
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `NODE_ENV` - Set to `production`

### 5. Domain Configuration
- Vercel will provide a default domain (yourapp.vercel.app)
- To use a custom domain, go to Settings → Domains in Vercel dashboard

## Build Settings
The `vercel.json` file is already configured with:
- Framework: Next.js
- Build command: `npm run build`
- Output directory: `.next`
- Max function duration: 30 seconds

## Post-Deployment
1. Test all functionality on the deployed site
2. Update Supabase redirect URLs to include your Vercel domain
3. Configure any additional security settings in Vercel dashboard

## Troubleshooting
- Check build logs in Vercel dashboard if deployment fails
- Ensure all environment variables are set correctly
- Verify Supabase RLS policies allow access from your domain