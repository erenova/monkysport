export const AI_PROMPT = `You are converting a fitness/nutrition plan into JSON for the MonkySport app. Output ONLY valid JSON matching the exact schema below — no commentary, no markdown, no code fences.

# CHOOSE ONE OUTPUT SHAPE

A. WorkoutPlan only (training, no meals):
{
  "id": "...",
  "name": "...",
  "description": "...",
  "schedule": [ ...7 days... ]
}

B. AppData (full setup with meals + per-day schedule):
{
  "plan": { ...WorkoutPlan above... },
  "logs": [],
  "settings": {
    "startDate": "2026-04-26T00:00:00.000Z",
    "schedule": { ...ScheduleConfig... }
  }
}

# TYPE DEFINITIONS

interface WorkoutPlan {
  id: string                  // unique slug, e.g. "my-plan-v1"
  name: string                // short, e.g. "Monk Mode"
  description: string         // 1 line
  schedule: DayPlan[]         // EXACTLY 7 entries (day 1..7)
}

interface DayPlan {
  day: number                 // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  name: string                // SHORT, uppercase, e.g. "İTİŞ", "ÇEKİŞ", "BACAK & MERKEZ", "AKTİF DİNLENME"
  category: "push" | "pull" | "legs" | "rest" | "custom"
  emoji: string               // single emoji
  exercises: Exercise[]       // [] for rest day
}

interface Exercise {
  id: string                  // format MUST be "d{day}-{n}", n starts at 1, e.g. "d1-3"
  name: string
  sets: number
  reps: string                // free-form: "12-15" | "Tükeniş" | "60sn" | "Max" | "20"
  notes: string               // form cues, "" if none
  videoUrl: string            // YouTube URL or "" (app auto-searches)
  targetMuscles: string[]     // Turkish: ["Göğüs","Triceps","Omuz","Sırt","Biceps","Quadriceps","Hamstring","Glute","Core","Ön Kol","Arka Omuz","Alt Karın","Kardiyovasküler"]
  restSeconds: number         // rest BETWEEN sets in seconds. 0 = no rest timer
  durationSeconds?: number    // ONLY for time-based holds (planks, wall sits, hangs). Set BOTH this and reps="60sn".
}

interface ScheduleConfig {
  workoutTime: string         // default "HH:MM" 24h, e.g. "18:30". Pre/post meals shift relative to this.
  foods: Food[]               // shared library of ingredients (REUSED across meals & days)
  dailyMeals: DayMealPlan[]   // EXACTLY 7 entries, day 1..7. Each day can have its own meals.
}

interface Food {
  id: string                  // unique slug, e.g. "chicken-breast", "egg", "oats"
  name: string                // human display, e.g. "Tavuk Göğsü"
  unit: string                // "g" | "ml" | "adet" | "kepçe" | "tbsp" | "tsp" — display unit
  baseAmount: number          // macros below are PER THIS amount. Typically 100 for /100g foods, 1 for "adet"/"kepçe"
  protein: number             // grams per baseAmount
  carbs: number               // grams per baseAmount
  fat: number                 // grams per baseAmount
  calories: number            // kcal per baseAmount
}

interface FoodRef {
  foodId: string              // matches a Food.id in the foods library
  amount: number              // amount in food.unit (e.g. 200 for 200g, 3 for 3 eggs)
}

interface DayMealPlan {
  day: number                 // 1..7
  workoutTime?: string        // OPTIONAL per-day override (e.g. weekend later workout)
  meals: Meal[]
}

interface Meal {
  id: string                  // unique within the day. RECOMMENDED defaults: "breakfast"|"lunch"|"pre"|"workout"|"post"|"dinner"
  name: string                // Turkish: "Kahvaltı","Öğle Yemeği","Pre-Workout","ANTRENMAN","Post-Workout","Akşam Yemeği"
  emoji: string
  anchor: "fixed" | "pre-workout" | "workout" | "post-workout"
  fixedTime?: string          // "HH:MM". REQUIRED if anchor="fixed"
  offsetMinutes?: number      // REQUIRED if anchor="pre-workout"|"post-workout". Minutes before/after workoutTime.
  foods?: FoodRef[]           // PREFERRED: list ingredients by reference. Macros auto-computed from food library.
  protein?: number            // ONLY use if foods[] is empty (manual macro override)
  carbs?: number              // ONLY use if foods[] is empty
  fat?: number                // ONLY use if foods[] is empty
  calories?: number           // ONLY use if foods[] is empty
  notes?: string              // what to eat / hints
  recipes?: { name: string; url: string }[]   // YouTube/blog recipe links
  trainingOnly?: boolean      // true = hide on rest days. Use for pre/workout/post.
}

interface DayLog {
  date: string                // "YYYY-MM-DD"
  dayNumber: number           // 1..7
  exercises: { exerciseId: string; completedSets: boolean[] }[]
}

# RULES (do not violate any)

1. \`schedule\` MUST contain exactly 7 entries with day values 1..7 (no duplicates, no gaps).
2. Rest day: \`category: "rest"\` AND \`exercises: []\`.
3. Exercise \`id\` format: \`d{day}-{n}\` where n starts at 1 within that day.
4. All ids unique within their list (exercises within a day, foods globally, meals within a day).
5. Use \`""\` for empty strings, \`[]\` for empty arrays. Never \`null\`. Never omit required fields.
6. All numeric fields ≥ 0 (use decimals only for food macros per baseAmount; everything else integer).
7. Enums (\`category\`, \`anchor\`, \`unit\`) MUST match exactly (lowercase, hyphenated where shown).
8. Time-based exercises: set BOTH \`durationSeconds\` (e.g. 60) AND \`reps: "60sn"\`. Rep-based exercises: omit \`durationSeconds\`.
9. anchor logic:
   - "fixed" → fixedTime required, offsetMinutes ignored
   - "pre-workout" → offsetMinutes required (minutes BEFORE workoutTime)
   - "workout" → neither needed (uses workoutTime; this is the "ANTRENMAN" block — NO macros, NO foods, NO recipes)
   - "post-workout" → offsetMinutes required (minutes AFTER workoutTime)
10. Pre/workout/post meals MUST have \`trainingOnly: true\`.
11. The "workout" anchor meal: \`name: "ANTRENMAN"\`, no macros, no foods, no recipes — just a time marker.
12. \`dailyMeals\` MUST have entries for ALL 7 days. If a day uses the same meals as another, COPY the meal objects into that day's array (do NOT reference by id across days). Each day is self-contained.
13. Rest days (matching day in WorkoutPlan with category="rest") typically omit pre/workout/post meals (just breakfast/lunch/dinner) — but you can keep all if user prefers.
14. Foods are the REUSE mechanism. Define each ingredient ONCE in \`foods\`, then reference by \`foodId\` in any meal on any day. Same egg, same chicken, used everywhere.
15. When a meal has \`foods[]\`, the app auto-computes macros from the library. Don't also set protein/carbs/fat/calories on the meal — leave them omitted.
16. \`logs\` should be \`[]\` for new imports. \`startDate\` should be today's ISO date.
17. If user provides only training: output shape A (WorkoutPlan). If user provides meals (or both): output shape B (AppData).

# COMPLETE WORKING EXAMPLE (shape B with foods + per-day meals)

{
  "plan": {
    "id": "monk-mode-v1",
    "name": "Monk Mode",
    "description": "Calisthenics + Dambıl",
    "schedule": [
      { "day": 1, "name": "İTİŞ", "category": "push", "emoji": "💪", "exercises": [
        { "id": "d1-1", "name": "Push-ups", "sets": 4, "reps": "Tükeniş", "notes": "", "videoUrl": "", "targetMuscles": ["Göğüs","Triceps"], "restSeconds": 90 },
        { "id": "d1-2", "name": "Plank", "sets": 3, "reps": "60sn", "notes": "Kalçayı düşürme", "videoUrl": "", "targetMuscles": ["Core"], "restSeconds": 60, "durationSeconds": 60 }
      ] },
      { "day": 2, "name": "ÇEKİŞ", "category": "pull", "emoji": "🏋️", "exercises": [] },
      { "day": 3, "name": "BACAK", "category": "legs", "emoji": "🦵", "exercises": [] },
      { "day": 4, "name": "İTİŞ", "category": "push", "emoji": "💪", "exercises": [] },
      { "day": 5, "name": "ÇEKİŞ", "category": "pull", "emoji": "🏋️", "exercises": [] },
      { "day": 6, "name": "BACAK", "category": "legs", "emoji": "🦵", "exercises": [] },
      { "day": 7, "name": "DİNLENME", "category": "rest", "emoji": "🧘", "exercises": [] }
    ]
  },
  "logs": [],
  "settings": {
    "startDate": "2026-04-26T00:00:00.000Z",
    "schedule": {
      "workoutTime": "18:30",
      "foods": [
        { "id": "egg", "name": "Yumurta", "unit": "adet", "baseAmount": 1, "protein": 6, "carbs": 0.6, "fat": 5, "calories": 72 },
        { "id": "oats", "name": "Yulaf", "unit": "g", "baseAmount": 100, "protein": 13, "carbs": 67, "fat": 7, "calories": 389 },
        { "id": "banana", "name": "Muz", "unit": "adet", "baseAmount": 1, "protein": 1.3, "carbs": 27, "fat": 0.3, "calories": 105 },
        { "id": "whey", "name": "Whey Protein", "unit": "kepçe", "baseAmount": 1, "protein": 24, "carbs": 3, "fat": 1.5, "calories": 120 },
        { "id": "chicken-breast", "name": "Tavuk Göğsü", "unit": "g", "baseAmount": 100, "protein": 31, "carbs": 0, "fat": 3.6, "calories": 165 },
        { "id": "rice", "name": "Pirinç (pişmiş)", "unit": "g", "baseAmount": 100, "protein": 2.7, "carbs": 28, "fat": 0.3, "calories": 130 },
        { "id": "beef", "name": "Dana Eti", "unit": "g", "baseAmount": 100, "protein": 26, "carbs": 0, "fat": 15, "calories": 250 },
        { "id": "salad", "name": "Karışık Salata", "unit": "g", "baseAmount": 100, "protein": 1.2, "carbs": 4, "fat": 0.2, "calories": 25 }
      ],
      "dailyMeals": [
        {
          "day": 1,
          "meals": [
            { "id": "breakfast", "name": "Kahvaltı", "emoji": "🍳", "anchor": "fixed", "fixedTime": "07:30",
              "foods": [ { "foodId": "egg", "amount": 3 }, { "foodId": "oats", "amount": 50 }, { "foodId": "banana", "amount": 1 } ],
              "notes": "Yumurta + yulaf + meyve", "recipes": [] },
            { "id": "lunch", "name": "Öğle Yemeği", "emoji": "🍗", "anchor": "fixed", "fixedTime": "12:30",
              "foods": [ { "foodId": "chicken-breast", "amount": 200 }, { "foodId": "rice", "amount": 150 }, { "foodId": "salad", "amount": 150 } ],
              "notes": "", "recipes": [] },
            { "id": "pre", "name": "Pre-Workout", "emoji": "🍌", "anchor": "pre-workout", "offsetMinutes": 60, "trainingOnly": true,
              "foods": [ { "foodId": "banana", "amount": 1 }, { "foodId": "whey", "amount": 1 } ],
              "notes": "Hızlı enerji", "recipes": [{ "name": "Smoothie", "url": "https://youtu.be/xxxxx" }] },
            { "id": "workout", "name": "ANTRENMAN", "emoji": "🏋️", "anchor": "workout", "trainingOnly": true },
            { "id": "post", "name": "Post-Workout", "emoji": "🥤", "anchor": "post-workout", "offsetMinutes": 30, "trainingOnly": true,
              "foods": [ { "foodId": "whey", "amount": 1 }, { "foodId": "banana", "amount": 1 } ],
              "notes": "İyileşme penceresi", "recipes": [] },
            { "id": "dinner", "name": "Akşam Yemeği", "emoji": "🥩", "anchor": "fixed", "fixedTime": "21:30",
              "foods": [ { "foodId": "beef", "amount": 200 }, { "foodId": "salad", "amount": 200 } ],
              "notes": "Karb azalt", "recipes": [] }
          ]
        },
        { "day": 2, "meals": [ /* same shape — copy day 1 if identical, or change for variety */ ] },
        { "day": 3, "meals": [] },
        { "day": 4, "meals": [] },
        { "day": 5, "meals": [] },
        { "day": 6, "meals": [] },
        { "day": 7, "meals": [
          { "id": "breakfast", "name": "Brunch", "emoji": "🥞", "anchor": "fixed", "fixedTime": "10:00",
            "foods": [ { "foodId": "egg", "amount": 4 }, { "foodId": "oats", "amount": 60 } ],
            "notes": "Geç kahvaltı", "recipes": [] }
        ] }
      ]
    }
  }
}

# REUSE PHILOSOPHY

- Define each ingredient ONCE in \`foods\` (e.g. "chicken-breast" with macros per 100g).
- Reference it from ANY meal on ANY day with \`{ "foodId": "chicken-breast", "amount": 200 }\`.
- The app auto-computes macros from the library — you never re-enter macros for the same ingredient.
- For repeated meals across days: copy the full meal object (each day's meals[] is self-contained).
- This way you describe the WHOLE diet by listing maybe 15–25 ingredients ONCE, then composing meals from them.

# NOW CONVERT THE FOLLOWING PLAN INTO VALID JSON MATCHING THE SCHEMA ABOVE
# (Output ONLY the JSON, nothing else. Start with { and end with }.)

[PASTE YOUR WORKOUT/MEAL PLAN HERE]
`
