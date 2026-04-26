import { WorkoutPlan, Exercise } from '@/lib/types'

function withIds(day: number, exercises: Omit<Exercise, 'id'>[]): Exercise[] {
  return exercises.map((e, i) => ({ ...e, id: `d${day}-${i + 1}` }))
}

const push: Omit<Exercise, 'id'>[] = [
  {
    name: 'Push-ups (Şınav)',
    sets: 4,
    reps: 'Tükeniş',
    notes: 'Decline ve Diamond varyasyonları. Kolay geliyorsa sırt çantasını tak!',
    videoUrl: '',
    targetMuscles: ['Göğüs', 'Omuz', 'Triceps'],
    restSeconds: 90,
  },
  {
    name: 'Dumbbell Shoulder Press',
    sets: 4,
    reps: '15-20',
    notes: '10kg ile yavaş ve kontrollü, omuzları yakarak',
    videoUrl: '',
    targetMuscles: ['Omuz'],
    restSeconds: 90,
  },
  {
    name: 'Lateral Raise (Yana Açış)',
    sets: 4,
    reps: '20',
    notes: 'Omuzları patlatana kadar',
    videoUrl: '',
    targetMuscles: ['Omuz'],
    restSeconds: 60,
  },
  {
    name: 'French Press / Triceps Extension',
    sets: 4,
    reps: 'Tükeniş',
    notes: 'Dambıl ile, kolu tam aç',
    videoUrl: '',
    targetMuscles: ['Triceps'],
    restSeconds: 60,
  },
  {
    name: 'Dips (Sandalye)',
    sets: 4,
    reps: 'Tükeniş',
    notes: 'Sırtında çanta ile. Parallette varsa kullan',
    videoUrl: '',
    targetMuscles: ['Göğüs', 'Triceps'],
    restSeconds: 90,
  },
]

const pull: Omit<Exercise, 'id'>[] = [
  {
    name: 'Pull-ups (Barfiks)',
    sets: 4,
    reps: 'Tükeniş',
    notes: 'Geniş ve dar tutuş değiştirerek. Yapamıyorsan direnç bandı veya negatif barfiks',
    videoUrl: '',
    targetMuscles: ['Sırt', 'Biceps'],
    restSeconds: 120,
  },
  {
    name: 'Backpack Rows',
    sets: 4,
    reps: '12-15',
    notes: '30 kiloluk çanta ile. Sırtını sık!',
    videoUrl: '',
    targetMuscles: ['Sırt'],
    restSeconds: 90,
  },
  {
    name: 'Dumbbell Bicep Curls',
    sets: 4,
    reps: 'Tükeniş',
    notes: 'Yavaş indir, kası hisset',
    videoUrl: '',
    targetMuscles: ['Biceps'],
    restSeconds: 60,
  },
  {
    name: 'Hammer Curls',
    sets: 3,
    reps: 'Tükeniş',
    notes: 'Ön kol ve biceps birlikte',
    videoUrl: '',
    targetMuscles: ['Biceps', 'Ön Kol'],
    restSeconds: 60,
  },
  {
    name: 'Bent Over Fly (Arka Omuz)',
    sets: 4,
    reps: '20',
    notes: 'Arka omuzu sık, yavaş kontrollü',
    videoUrl: '',
    targetMuscles: ['Arka Omuz'],
    restSeconds: 60,
  },
]

const legs: Omit<Exercise, 'id'>[] = [
  {
    name: 'Bulgarian Split Squat',
    sets: 4,
    reps: '12-15',
    notes: "Her bacak için. Elinde 10'ar kg dambıl. Sızlanma yok!",
    videoUrl: '',
    targetMuscles: ['Quadriceps', 'Glute'],
    restSeconds: 90,
  },
  {
    name: 'Backpack Squat',
    sets: 4,
    reps: 'Tükeniş',
    notes: '30 kilo sırtında, tam çöküp kalkıyorsun',
    videoUrl: '',
    targetMuscles: ['Quadriceps', 'Glute'],
    restSeconds: 120,
  },
  {
    name: 'Romanian Deadlift',
    sets: 4,
    reps: '15',
    notes: 'Dambıl veya çanta ile. Arka bacağı esnet',
    videoUrl: '',
    targetMuscles: ['Hamstring', 'Glute'],
    restSeconds: 90,
  },
  {
    name: 'Plank',
    sets: 3,
    reps: '60sn',
    notes: 'Dayanabildiğin kadar. Kalçayı düşürme!',
    videoUrl: '',
    targetMuscles: ['Core'],
    restSeconds: 60,
    durationSeconds: 60,
  },
  {
    name: 'Lying Leg Raises',
    sets: 3,
    reps: '20',
    notes: 'Bacakları yere değdirmeden, sürekli gerginlik',
    videoUrl: '',
    targetMuscles: ['Core', 'Alt Karın'],
    restSeconds: 60,
  },
]

const rest: Omit<Exercise, 'id'>[] = [
  {
    name: 'Yürüyüş / Yokuş Kardiyosu',
    sets: 1,
    reps: '30-45 dk',
    notes: 'Tempolu yürüyüş veya yokuş kardiyosu. Beyin dinlensin, vücut aktif kalsın.',
    videoUrl: '',
    targetMuscles: ['Kardiyovasküler'],
    restSeconds: 0,
  },
]

export const defaultPlan: WorkoutPlan = {
  id: 'monk-mode-v1',
  name: 'Monk Mode',
  description: 'Calisthenics + Dambıl — Ev Antrenman Programı',
  schedule: [
    { day: 1, name: 'İTİŞ', category: 'push', emoji: '💪', exercises: withIds(1, push) },
    { day: 2, name: 'ÇEKİŞ', category: 'pull', emoji: '🏋️', exercises: withIds(2, pull) },
    { day: 3, name: 'BACAK & MERKEZ', category: 'legs', emoji: '🦵', exercises: withIds(3, legs) },
    { day: 4, name: 'İTİŞ', category: 'push', emoji: '💪', exercises: withIds(4, push) },
    { day: 5, name: 'ÇEKİŞ', category: 'pull', emoji: '🏋️', exercises: withIds(5, pull) },
    { day: 6, name: 'BACAK & MERKEZ', category: 'legs', emoji: '🦵', exercises: withIds(6, legs) },
    { day: 7, name: 'AKTİF DİNLENME', category: 'rest', emoji: '🧘', exercises: withIds(7, rest) },
  ],
}
