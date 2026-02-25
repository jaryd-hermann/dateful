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
     - **Value:** `https://[your-project-id].supabase.co` (get from Supabase dashboard)
   - Add:
     - **Name:** `VITE_SUPABASE_ANON_KEY`
     - **Value:** `[your-anon-key]` (get from Supabase dashboard → Settings → API)
   - Make sure both are set for **Production**, **Preview**, and **Development**
   
   **Note:** You can find these values in your Supabase project dashboard under Settings → API.

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

## Step 4: Supabase Production Setup

The waitlist form and other features use Supabase Edge Functions and database tables. You must run these **after** creating/linking your production Supabase project:

1. **Link your Supabase project** (if not already):
   ```bash
   supabase link --project-ref [your-project-id]
   ```
   Find your project ID in Supabase Dashboard → Settings → General.

2. **Run database migrations:**
   ```bash
   supabase db push
   ```
   This creates the `waitlist` table and other schema.

3. **Deploy Edge Functions:**
   ```bash
   supabase functions deploy waitlist-join --no-verify-jwt
   ```
   The `--no-verify-jwt` flag lets the waitlist form work without requiring the anon key in requests (avoids 401 errors). Deploy other functions as needed: `auth-send-otp`, `auth-verify-otp`, `onboarding-complete`, etc.

4. **Verify env vars** in your hosting platform (Vercel):
   - `VITE_SUPABASE_URL` – your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` – from Supabase Dashboard → Settings → API

If the waitlist shows "Something went wrong" or "Server setup incomplete", the migration and/or `waitlist-join` deployment is likely missing.

## Step 5: Verify Deployment

1. Visit `https://dateful.chat` (once DNS propagates)
2. Test the waitlist email form to ensure Supabase connection works
3. Check browser console and Network tab for any errors

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

**Waitlist form shows 401 or "Configuration error":**
- Redeploy the function with `--no-verify-jwt`: `supabase functions deploy waitlist-join --no-verify-jwt`
- Or ensure `VITE_SUPABASE_ANON_KEY` is set in Vercel (Settings → Environment Variables) and redeploy

**Waitlist form shows "Something went wrong" or "Server setup incomplete":**
- Run `supabase db push` to create the `waitlist` table
- Deploy the function: `supabase functions deploy waitlist-join --no-verify-jwt`
- Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel
- Check the browser Network tab: does the request reach Supabase? What status code?

## Useful Vercel Features

- **Analytics:** Enable in project settings
- **Speed Insights:** Performance monitoring
- **Deployment History:** View all deployments
- **Rollback:** Quickly revert to previous deployment
