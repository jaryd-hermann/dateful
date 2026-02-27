# Debugging SMS Verification

## Two phone numbers

| Role | Where it comes from | Example |
|------|---------------------|---------|
| **Your Twilio number** (sends SMS) | `TWILIO_PHONE_NUMBER` env var in Supabase | `+18339685430` |
| **Your phone** (receives SMS) | Number you enter on Signup | `+18382592983` |

To see which Twilio number is configured:

- **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets** → look for `TWILIO_PHONE_NUMBER`
- Or **Twilio Console** → **Phone Numbers** → **Manage** → **Active Numbers** — that’s your sending number

## Dev mode (local only)

When running locally (`npm run dev`), the app sends an `X-Dev-Mode: true` header to the auth-send-otp function. The API will:

1. **On success:** Return the code in the response (`devCode`). The Verify page shows it in a highlighted box so you can complete signup without receiving SMS.
2. **On Twilio failure:** Include the actual code in the error message, e.g. `"...(Dev: code was 123456)"`.

This lets you test the full signup flow without relying on SMS delivery.

## Checking Supabase logs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Edge Functions** → **auth-send-otp** → **Logs**
3. Trigger signup or Resend, then check logs for:
   - `Twilio error:` — Twilio API failed (see error body)
   - `auth-send-otp error:` — function crashed
   - No logs — function may not be deployed or request isn’t reaching Supabase

## Checking Twilio logs

1. Go to [Twilio Console](https://console.twilio.com/)
2. **Monitor** → **Logs** → **Messaging**
3. Look for:
   - **Status: Delivered** — SMS was sent successfully
   - **Status: Failed** — check error code in the log
   - No logs — Twilio API might not have been called (check Supabase logs and env vars)

## Twilio trial: verify your number

With a trial account, you can only send SMS to **verified** numbers:

1. Go to [Twilio Console → Verified Caller IDs](https://console.twilio.com/us1/develop/phone-numbers/manage/verified)
2. **Add a new Caller ID**
3. Enter **+18382592983** (or your number in E.164: +1 + 10 digits)
4. Complete the verification (Twilio will call or SMS you a code)

## Quick connection check

1. **Env vars in Supabase**  
   Edge Functions → **auth-send-otp** → **Secrets**: ensure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` are set.

2. **Deploy the function**  
   ```bash
   supabase functions deploy auth-send-otp --no-verify-jwt
   ```

3. **Test from Signup**  
   Enter your verified number, submit, then check Supabase and Twilio logs.

## Common issues

| Issue | Cause |
|-------|-------|
| Code never arrives | Twilio trial limits, carrier blocking, wrong number format |
| "21608" error | Recipient phone not verified (Twilio trial) |
| "21614" error | Invalid phone number format |
| "Twilio not configured" | Missing env vars in Supabase Edge Function secrets |
| 401 on send | Missing `Authorization: Bearer <anon_key>` header |
