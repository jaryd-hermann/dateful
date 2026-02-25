# Debugging SMS Verification

## Dev mode (local only)

When running locally (`npm run dev`), the app sends an `X-Dev-Mode: true` header to the auth-send-otp function. The API will:

1. **On success:** Return the code in the response (`devCode`). The Verify page shows it in a highlighted box so you can complete signup without receiving SMS.
2. **On Twilio failure:** Include the actual code in the error message, e.g. `"...(Dev: code was 123456)"`.

This lets you test the full signup flow without relying on SMS delivery.

## Checking Supabase logs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/hwsmagjcxoagzppibzna)
2. **Edge Functions** → **auth-send-otp** → **Logs**
3. Look for errors when you trigger signup or Resend

## Checking Twilio logs

1. Go to [Twilio Console](https://console.twilio.com/)
2. **Monitor** → **Logs** → **Messaging**
3. Check for failed messages and their error codes

## Common issues

| Issue | Cause |
|-------|-------|
| Code never arrives | Twilio trial limits, carrier blocking, wrong number format |
| "21608" error | Recipient phone not verified (Twilio trial) |
| "21614" error | Invalid phone number format |
| 401 on send | Missing `Authorization: Bearer <anon_key>` header |
