# Twilio Setup for Dateful

## Trial Account: Verify Your Phone Number

**If you get "Failed to send verification code"** when signing up locally, your Twilio account is likely in trial mode. Trial accounts can only send SMS to **verified** phone numbers.

1. Go to [Twilio Console → Verified Caller IDs](https://console.twilio.com/us1/develop/phone-numbers/manage/verified)
2. Click **Add a new Caller ID**
3. Enter your phone number (the one you're testing with) and complete the verification

Once verified, signup OTP will work.

---

## Webhook Setup (Inbound SMS)

To receive inbound SMS and reply via the Dateful agent, configure your Twilio number to forward messages to our webhook.

## Steps

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click your phone number (+18339685430)
4. Scroll to **Messaging Configuration**
5. Under **A MESSAGE COMES IN**:
   - **Webhook:** `https://hwsmagjcxoagzppibzna.supabase.co/functions/v1/webhook-twilio-inbound`
   - **HTTP:** POST
6. Save

## Testing

After setup, send an SMS to your Twilio number. If you have an account (phone number in our `users` table with a couple), the agent will respond. If not, you'll get a generic "sign up at dateful.chat" message.
