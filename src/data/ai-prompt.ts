export const AI_PROMPT = `You are converting a fitness/nutrition plan into JSON for the MonkySport app. Output ONLY valid JSON matching the exact schema below — no commentary, no markdown, no code fences.

# CHOOSE ONE OUTPUT SHAPE

A. WorkoutPlan only (training plan, no meals):
{
  "id": "...",
  "name": "...",
  "description": "...",
  "schedule": [ ...7 days... ]
}

B. AppData (full setup with meals + schedule):
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
  name: string                // SHORT, uppercase, Turkish (or user's language). e.g. "İTİŞ", "ÇEKİŞ", "BACAK & MERKEZ", "AKTİF DİNLENME"
  category: "push" | "pull" | "legs" | "rest" | "custom"
  emoji: string               // single emoji that represents the day
  exercises: Exercise[]       // [] for rest day
}

interface Exercise {
  id: string                  // format MUST be "d{day}-{n}", n starts at 1, e.g. "d1-3"
  name: string                // exercise name (Turkish where natural)
  sets: number                // integer
  reps: string                // free-form: "12-15" | "Tükeniş" (to failure) | "60sn" (60 seconds) | "Max" | "20"
  notes: string               // form cues, "" if none
  videoUrl: string            // YouTube URL or "" (app auto-searches if empty)
  targetMuscles: string[]     // Turkish muscle names: ["Göğüs", "Triceps", "Omuz", "Sırt", "Biceps", "Quadriceps", "Hamstring", "Glute", "Core", "Ön Kol", "Arka Omuz", "Alt Karın", "Kardiyovasküler"]
  restSeconds: number         // rest BETWEEN sets in seconds. 0 = no rest timer
  durationSeconds?: number    // ONLY for time-based holds (planks, wall sits, hangs). Set this AND set reps to e.g. "60sn". Triggers a work-countdown timer that auto-completes the set.
}

interface ScheduleConfig {
  workoutTime: string         // "HH:MM" 24h, e.g. "18:30". Pre/post meals shift relative to this.
  meals: Meal[]               // sorted by time on display, but order in JSON doesn't matter
}

interface Meal {
  id: string                  // unique. RECOMMENDED defaults: "breakfast" | "lunch" | "pre" | "workout" | "post" | "dinner". Custom snacks: any unique slug.
  name: string                // Turkish: "Kahvaltı", "Öğle Yemeği", "Pre-Workout", "ANTRENMAN", "Post-Workout", "Akşam Yemeği"
  emoji: string               // single emoji
  anchor: "fixed" | "pre-workout" | "workout" | "post-workout"
  fixedTime?: string          // "HH:MM". REQUIRED if anchor="fixed"
  offsetMinutes?: number      // minutes BEFORE workoutTime (anchor="pre-workout") or AFTER (anchor="post-workout"). REQUIRED for those anchors.
  protein?: number            // grams
  carbs?: number              // grams
  fat?: number                // grams
  calories?: number           // kcal
  notes?: string              // what to eat, hints
  recipes?: { name: string; url: string }[]   // links to YouTube recipes / blog posts
  trainingOnly?: boolean      // true = hide on rest days. Use true for pre/workout/post anchors.
}

interface DayLog {
  date: string                // "YYYY-MM-DD"
  dayNumber: number           // 1..7
  exercises: { exerciseId: string; completedSets: boolean[] }[]
}

# RULES (do not violate any)

1. \`schedule\` MUST contain exactly 7 entries with day values 1 through 7 (no duplicates, no gaps).
2. Rest day: set \`category: "rest"\` AND \`exercises: []\`.
3. Exercise \`id\` MUST follow format \`d{day}-{n}\` where n increments per exercise within that day, starting at 1.
4. All \`id\` fields must be unique within their list.
5. Use \`""\` for empty strings and \`[]\` for empty arrays. Never \`null\`, never omit required fields.
6. All numeric fields are non-negative integers (seconds, grams, kcal, sets).
7. \`category\` and \`anchor\` MUST be one of the listed enum values exactly (lowercase, hyphenated).
8. For time-based exercises (planks, holds): set BOTH \`durationSeconds\` (e.g. 60) AND a matching \`reps\` string (e.g. "60sn"). For rep-based exercises: omit \`durationSeconds\`.
9. anchor logic:
   - "fixed" → fixedTime required, offsetMinutes ignored
   - "pre-workout" → offsetMinutes required (minutes BEFORE workoutTime)
   - "workout" → neither needed (uses workoutTime exactly; this is the "ANTRENMAN" block, no macros)
   - "post-workout" → offsetMinutes required (minutes AFTER workoutTime)
10. Pre/workout/post meals MUST have \`trainingOnly: true\`.
11. The "workout" anchor meal should have \`name: "ANTRENMAN"\`, no macros, no recipes.
12. If the user provided meals, output shape B (AppData). If only training, output shape A (WorkoutPlan).
13. \`logs\` should always be \`[]\` for new imports.
14. \`startDate\` should be today's date in ISO format.

# COMPLETE WORKING EXAMPLE (shape B — AppData)

{
  "plan": {
    "id": "monk-mode-v1",
    "name": "Monk Mode",
    "description": "Calisthenics + Dambıl — Ev Antrenman Programı",
    "schedule": [
      {
        "day": 1,
        "name": "İTİŞ",
        "category": "push",
        "emoji": "💪",
        "exercises": [
          {
            "id": "d1-1",
            "name": "Push-ups",
            "sets": 4,
            "reps": "Tükeniş",
            "notes": "Decline ve Diamond varyasyonları",
            "videoUrl": "",
            "targetMuscles": ["Göğüs", "Omuz", "Triceps"],
            "restSeconds": 90
          },
          {
            "id": "d1-2",
            "name": "Plank",
            "sets": 3,
            "reps": "60sn",
            "notes": "Kalçayı düşürme",
            "videoUrl": "",
            "targetMuscles": ["Core"],
            "restSeconds": 60,
            "durationSeconds": 60
          }
        ]
      },
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
      "meals": [
        {
          "id": "breakfast",
          "name": "Kahvaltı",
          "emoji": "🍳",
          "anchor": "fixed",
          "fixedTime": "07:30",
          "protein": 35, "carbs": 50, "fat": 15, "calories": 500,
          "notes": "Yumurta + yulaf + meyve",
          "recipes": []
        },
        {
          "id": "pre",
          "name": "Pre-Workout",
          "emoji": "🍌",
          "anchor": "pre-workout",
          "offsetMinutes": 60,
          "protein": 15, "carbs": 40, "fat": 5, "calories": 280,
          "notes": "Muz + whey",
          "trainingOnly": true,
          "recipes": [{ "name": "Smoothie", "url": "https://youtu.be/abc" }]
        },
        {
          "id": "workout",
          "name": "ANTRENMAN",
          "emoji": "🏋️",
          "anchor": "workout",
          "trainingOnly": true
        },
        {
          "id": "post",
          "name": "Post-Workout",
          "emoji": "🥤",
          "anchor": "post-workout",
          "offsetMinutes": 30,
          "protein": 40, "carbs": 50, "fat": 5, "calories": 400,
          "notes": "Whey + muz",
          "trainingOnly": true,
          "recipes": []
        },
        {
          "id": "dinner",
          "name": "Akşam Yemeği",
          "emoji": "🥩",
          "anchor": "fixed",
          "fixedTime": "21:30",
          "protein": 50, "carbs": 40, "fat": 25, "calories": 650,
          "notes": "Et / balık + sebze",
          "recipes": []
        }
      ]
    }
  }
}

# NOW CONVERT THE FOLLOWING PLAN INTO VALID JSON MATCHING THE SCHEMA ABOVE
# (Output ONLY the JSON, nothing else. Start with { and end with }.)

[PASTE YOUR WORKOUT/MEAL PLAN HERE]
`
