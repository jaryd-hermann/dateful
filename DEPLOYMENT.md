# Deployment Guide for Dateful Landing Page

## Prerequisites
- GitHub account
- Vercel account (sign up at vercel.com)
- Domain: dateful.chat (DNS access)

## Step 1: Push to GitHub

1. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Repository name: `dateful`
   - Set to Public or Private (your choice)
   - **Don't** initialize with README, .gitignore, or license (we already have these)

2. Push your code:
   ```bash
   git remote add origin git@github.com:[YOUR_USERNAME]/dateful.git
   git branch -M main
   git push -u origin main
   ```
   
   Replace `[YOUR_USERNAME]` with your GitHub username.

## Step 2: Deploy to Vercel

1. **Import Project:**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your `dateful` repository
   - Click "Import"

2. **Configure Project:**
   - **Framework Preset:** Vite (should auto-detect)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
   - **Install Command:** `npm install` (default)

3. **Add Environment Variables:**
   Before clicking "Deploy", add these environment variables:
   - Click "Environment Variables"
   - Add:
     - **Name:** `VITE_SUPABASE_URL`
     - **Value:** `https://hwsmagjcxoagzppibzna.supabase.co`
   - Add:
     - **Name:** `VITE_SUPABASE_ANON_KEY`
     - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh3c21hZ2pjeG9hZ3pwcGliem5aIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4ODE2ODEsImV4cCI6MjA4NzQ1NzY4MX0.FS0RwlcTrl83MZ_3T4GsDPv6K8FQrF_MabtpQe8DeGw`
   - Make sure both are set for **Production**, **Preview**, and **Development**

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (~1-2 minutes)
   - Your site will be live at `https://dateful-[random].vercel.app`

## Step 3: Configure Custom Domain (dateful.chat)

1. **Add Domain in Vercel:**
   - Go to your project dashboard
   - Click "Settings" → "Domains"
   - Enter: `dateful.chat`
   - Click "Add"
   - Also add `www.dateful.chat` (optional, for www subdomain)

2. **Configure DNS:**
   Vercel will show you DNS records to add. You'll need to add these at your domain registrar:

   **Option A: CNAME (Recommended)**
   - **Type:** CNAME
   - **Name:** `@` (or root domain, depends on registrar)
   - **Value:** `cname.vercel-dns.com`
   
   **Option B: A Records (If CNAME not supported for root)**
   - Vercel will provide specific A record IPs (usually 4 IPs)
   - Add A records pointing to those IPs

   **For www subdomain:**
   - **Type:** CNAME
   - **Name:** `www`
   - **Value:** `cname.vercel-dns.com`

3. **Wait for DNS Propagation:**
   - DNS changes can take 5 minutes to 48 hours
   - Vercel will show "Valid Configuration" when DNS is correct
   - SSL certificate will be automatically provisioned

## Step 4: Verify Deployment

1. Visit `https://dateful.chat` (once DNS propagates)
2. Test the email form to ensure Supabase connection works
3. Check browser console for any errors

## Ongoing Workflow: Local → Production

**For future updates:**

1. **Make changes locally:**
   ```bash
   npm run dev  # Test locally
   ```

2. **Commit and push:**
   ```bash
   git add .
   git commit -m "feat: your change description"
   git push origin main
   ```

3. **Vercel auto-deploys:**
   - Vercel automatically detects pushes to `main` branch
   - Triggers a new build and deployment
   - Usually live in 1-2 minutes
   - You'll get a notification when deployment completes

**Preview Deployments:**
- Pull requests automatically get preview deployments
- Each PR gets a unique URL like `dateful-git-[branch]-[username].vercel.app`
- Perfect for testing before merging

## Troubleshooting

**Build fails:**
- Check Vercel build logs
- Ensure environment variables are set correctly
- Verify `package.json` has correct scripts

**Domain not working:**
- Check DNS records are correct
- Wait for DNS propagation (can take up to 48 hours)
- Verify SSL certificate is issued (Vercel does this automatically)

**Environment variables not working:**
- Ensure variables start with `VITE_` prefix
- Redeploy after adding/changing variables
- Check Vercel logs for errors

## Useful Vercel Features

- **Analytics:** Enable in project settings
- **Speed Insights:** Performance monitoring
- **Deployment History:** View all deployments
- **Rollback:** Quickly revert to previous deployment
