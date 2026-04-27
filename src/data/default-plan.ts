import { WorkoutPlan } from '@/lib/types'

export const defaultPlan: WorkoutPlan = {
  id: 'empty',
  name: 'Plan Yok',
  description: 'Bir plan yükle veya gist\'ten çek',
  schedule: [
    { day: 1, name: 'BOŞ', category: 'custom', emoji: '❌', exercises: [] },
    { day: 2, name: 'BOŞ', category: 'custom', emoji: '❌', exercises: [] },
    { day: 3, name: 'BOŞ', category: 'custom', emoji: '❌', exercises: [] },
    { day: 4, name: 'BOŞ', category: 'custom', emoji: '❌', exercises: [] },
    { day: 5, name: 'BOŞ', category: 'custom', emoji: '❌', exercises: [] },
    { day: 6, name: 'BOŞ', category: 'custom', emoji: '❌', exercises: [] },
    { day: 7, name: 'BOŞ', category: 'custom', emoji: '❌', exercises: [] },
  ],
}
