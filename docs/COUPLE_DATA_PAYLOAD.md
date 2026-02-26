# Couple Data Payload for the AI Model

When a user completes onboarding, we store their answers in the `couples` and `users` tables. When they chat with Dateful, the AI agent (agent-respond) receives the following data to personalize responses.

## Data Sent to the Model (agent-respond)

The model receives a **system prompt** that includes:

| Field | Source | Example |
|-------|--------|---------|
| **city** | `couples.city` | "Brooklyn" |
| **neighborhood** | `couples.neighborhood` (parsed from city) | "Williamsburg" |
| **budget** | `couples.budget` | "$$" ($, $$, $$$, $$$$) |
| **frequency** | `couples.frequency` | "biweekly" (weekly, biweekly, monthly) |
| **preferred_days** | `couples.preferred_days` | ["friday_evening", "saturday_evening", "weeknight"] |
| **preferred_weeknights** | `couples.preferred_weeknights` | ["monday", "wednesday"] |
| **interests** | `couples.interests` | ["restaurants", "live_music", "outdoors", ...] |
| **food_dislikes** | `couples.food_dislikes` | "no seafood, no spicy" |
| **dietary_restrictions** | `couples.dietary_restrictions` | "vegetarian, no shellfish" |
| **anything_else** | `couples.anything_else` | Free-text notes from the couple |

Additionally:
- **User name** (primary user's name) from `users.name`
- **Recent conversation history** (last 20 messages) for context

## Data NOT currently sent

These fields exist in the schema but are **not** in the model's system prompt yet:
- `travel_radius` (neighborhood, borough, 30min, 1hour)
- `surprise_preference` (surprise_me, approve_first)
- `preferred_channel` (sms, whatsapp)
- Partner's name (only primary user's name is used in the prompt)

## Onboarding → Database mapping

| Onboarding question | DB column | Stored value |
|---------------------|-----------|--------------|
| Your first name | users.name (primary) | "Jordan" |
| Partner's first name | — (used in SMS) | "Alex" |
| Partner's phone | users (partner row) | E.164 |
| City & neighborhood | couples.city, couples.neighborhood | "Brooklyn, Williamsburg" → city="Brooklyn", neighborhood="Williamsburg" |
| Travel radius | couples.travel_radius | "borough" |
| Budget | couples.budget | "$$" |
| Frequency | couples.frequency | "biweekly" |
| Preferred days | couples.preferred_days | ["friday_evening", ...] |
| Preferred weeknights | couples.preferred_weeknights | ["monday", "wednesday"] |
| Interests | couples.interests | ["restaurants", "live_music", ...] |
| Food dislikes | couples.food_dislikes | text |
| Dietary restrictions | couples.dietary_restrictions | text |
| Anything else | couples.anything_else | text |
| Surprise preference | couples.surprise_preference | "approve_first" |
| Preferred channel | — | (not stored in couples) |

## Summary for explaining to others

**"We collect the couple's location (city/neighborhood), date night budget, how often they want dates, preferred days and times, interests (restaurants, live music, outdoors, etc.), dietary restrictions, food dislikes, and any free-form notes. The AI gets this as structured context so it can suggest relevant, personalized date ideas without asking the same questions again."**
