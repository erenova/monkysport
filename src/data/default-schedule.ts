import { ScheduleConfig, Food, Meal, DayMealPlan } from '@/lib/types'

const foods: Food[] = [
  { id: 'egg', name: 'Yumurta', unit: 'adet', baseAmount: 1, protein: 6, carbs: 0.6, fat: 5, calories: 72 },
  { id: 'oats', name: 'Yulaf', unit: 'g', baseAmount: 100, protein: 13, carbs: 67, fat: 7, calories: 389 },
  { id: 'banana', name: 'Muz', unit: 'adet', baseAmount: 1, protein: 1.3, carbs: 27, fat: 0.3, calories: 105 },
  { id: 'whey', name: 'Whey Protein', unit: 'kepçe', baseAmount: 1, protein: 24, carbs: 3, fat: 1.5, calories: 120 },
  { id: 'chicken-breast', name: 'Tavuk Göğsü', unit: 'g', baseAmount: 100, protein: 31, carbs: 0, fat: 3.6, calories: 165 },
  { id: 'rice', name: 'Pirinç (pişmiş)', unit: 'g', baseAmount: 100, protein: 2.7, carbs: 28, fat: 0.3, calories: 130 },
  { id: 'beef', name: 'Dana Eti', unit: 'g', baseAmount: 100, protein: 26, carbs: 0, fat: 15, calories: 250 },
  { id: 'olive-oil', name: 'Zeytinyağı', unit: 'tbsp', baseAmount: 1, protein: 0, carbs: 0, fat: 14, calories: 119 },
  { id: 'salad', name: 'Karışık Salata', unit: 'g', baseAmount: 100, protein: 1.2, carbs: 4, fat: 0.2, calories: 25 },
  { id: 'peanut-butter', name: 'Fıstık Ezmesi', unit: 'tbsp', baseAmount: 1, protein: 4, carbs: 3, fat: 8, calories: 95 },
]

const breakfast: Meal = {
  id: 'breakfast',
  name: 'Kahvaltı',
  emoji: '🍳',
  anchor: 'fixed',
  fixedTime: '07:30',
  foods: [
    { foodId: 'egg', amount: 3 },
    { foodId: 'oats', amount: 50 },
    { foodId: 'banana', amount: 1 },
  ],
  notes: 'Yumurta + yulaf + meyve. Güne protein ile başla.',
  recipes: [],
}

const lunch: Meal = {
  id: 'lunch',
  name: 'Öğle Yemeği',
  emoji: '🍗',
  anchor: 'fixed',
  fixedTime: '12:30',
  foods: [
    { foodId: 'chicken-breast', amount: 200 },
    { foodId: 'rice', amount: 150 },
    { foodId: 'salad', amount: 150 },
    { foodId: 'olive-oil', amount: 1 },
  ],
  notes: 'Tavuk + pirinç + bol salata.',
  recipes: [],
}

const pre: Meal = {
  id: 'pre',
  name: 'Pre-Workout',
  emoji: '🍌',
  anchor: 'pre-workout',
  offsetMinutes: 60,
  foods: [
    { foodId: 'banana', amount: 1 },
    { foodId: 'peanut-butter', amount: 2 },
  ],
  notes: 'Hızlı enerji için muz + fıstık ezmesi.',
  trainingOnly: true,
  recipes: [],
}

const workout: Meal = {
  id: 'workout',
  name: 'ANTRENMAN',
  emoji: '🏋️',
  anchor: 'workout',
  trainingOnly: true,
}

const post: Meal = {
  id: 'post',
  name: 'Post-Workout',
  emoji: '🥤',
  anchor: 'post-workout',
  offsetMinutes: 30,
  foods: [
    { foodId: 'whey', amount: 1 },
    { foodId: 'banana', amount: 1 },
  ],
  notes: 'İyileşme penceresi — whey + muz.',
  trainingOnly: true,
  recipes: [],
}

const dinner: Meal = {
  id: 'dinner',
  name: 'Akşam Yemeği',
  emoji: '🥩',
  anchor: 'fixed',
  fixedTime: '21:30',
  foods: [
    { foodId: 'beef', amount: 200 },
    { foodId: 'salad', amount: 200 },
    { foodId: 'olive-oil', amount: 1 },
  ],
  notes: 'Kırmızı et + sebze. Karb azalt, yağı koru.',
  recipes: [],
}

function dayWith(day: number, meals: Meal[]): DayMealPlan {
  return { day, meals: meals.map(m => ({ ...m })) }
}

const trainingMeals = [breakfast, lunch, pre, workout, post, dinner]
const restMeals = [breakfast, lunch, dinner]

export const defaultSchedule: ScheduleConfig = {
  workoutTime: '18:30',
  foods,
  dailyMeals: [
    dayWith(1, trainingMeals),
    dayWith(2, trainingMeals),
    dayWith(3, trainingMeals),
    dayWith(4, trainingMeals),
    dayWith(5, trainingMeals),
    dayWith(6, trainingMeals),
    dayWith(7, restMeals),
  ],
}
