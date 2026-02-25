# Stripe Webhook Setup Guide

This guide walks you through setting up a Stripe webhook so Dateful can react to subscription events (checkout complete, payment failed, cancellation, etc.).

---

## Step 1: Open the Stripe Dashboard

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (toggle in the top-right) — we'll create a production webhook later when you go live
3. In the left sidebar, click **Developers** → **Webhooks**

---

## Step 2: Add a New Webhook Endpoint

1. Click **Add endpoint**
2. You'll see a form with two fields:
   - **Endpoint URL**
   - **Events to send**

---

## Step 3: Enter Your Webhook URL

Your webhook URL will be your Supabase Edge Function. Once we've built and deployed the `webhook-stripe` Edge Function, it will be:

```
https://hwsmagjcxoagzppibzna.supabase.co/functions/v1/webhook-stripe
```

**For now:** If the Edge Function isn't deployed yet, you can either:
- **Option A:** Wait until Phase 3 when we build it, then add the endpoint
- **Option B:** Add the URL now — Stripe will show "failing" status until the endpoint exists and returns 200
- **Option C:** Use [Stripe CLI](https://stripe.com/docs/stripe-cli) for local testing (see Step 7 below)

Enter the URL in the **Endpoint URL** field.

---

## Step 4: Select Events to Listen For

Click **Select events** and choose these events:

| Event | Why we need it |
|-------|----------------|
| `checkout.session.completed` | User finished checkout — activate their subscription |
| `invoice.paid` | Recurring payment succeeded — keep access active |
| `invoice.payment_failed` | Payment failed — pause agent, notify user to update card |
| `customer.subscription.deleted` | User cancelled — stop planning cycles |
| `customer.subscription.updated` | Plan changed (e.g., per-date ↔ annual) |

You can filter by typing "checkout", "invoice", "customer.subscription" in the search box.

Select all five, then click **Add events**.

---

## Step 5: Create the Endpoint

1. Click **Add endpoint**
2. Stripe will create the webhook and show you the **Signing secret**

---

## Step 6: Copy the Signing Secret

1. On the webhook details page, find **Signing secret**
2. Click **Reveal**
3. Copy the value — it looks like `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. Add it to your `.env` file:

   ```
   STRIPE_WEBHOOK_SECRET=whsec_[your-actual-secret]
   ```

5. Replace the placeholder `whsec_YOUR_WEBHOOK_SECRET` in `.env` with this value

**Important:** This secret is used to verify that webhook requests actually come from Stripe. Never commit it to git or expose it publicly.

---

## Step 7 (Optional): Local Testing with Stripe CLI

For local development, Stripe can't reach `localhost`. Use the Stripe CLI to forward events:

1. [Install Stripe CLI](https://stripe.com/docs/stripe-cli#install)
2. Log in: `stripe login`
3. Forward webhooks to your local Edge Function:

   ```bash
   stripe listen --forward-to http://127.0.0.1:54321/functions/v1/webhook-stripe
   ```

4. The CLI will output a **local** signing secret like `whsec_...` — use this in `.env` when testing locally (it's different from the one in the Dashboard)

---

## Summary Checklist

- [ ] In Stripe Dashboard: Developers → Webhooks → Add endpoint
- [ ] Endpoint URL: `https://hwsmagjcxoagzppibzna.supabase.co/functions/v1/webhook-stripe`
- [ ] Events selected: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`
- [ ] Signing secret copied and added to `.env` as `STRIPE_WEBHOOK_SECRET`
- [ ] When you deploy the Edge Function, Stripe will start delivering events (or retry if it was added before deployment)

---

## When to Do This

- **Phase 3:** We'll build the `webhook-stripe` Edge Function. You can create the webhook endpoint at any time — either before or after we deploy the function.
- If you create it before deployment, Stripe will retry failed deliveries for up to 3 days, so once the function is live, it will start working.
