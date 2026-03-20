import { User, Heart, Image, type LucideIcon } from 'lucide-react'

export interface QuickFilterToggleConfig {
  key: 'myRecipes' | 'markedByMe' | 'hasImage'
  label: string
  icon: LucideIcon
  requiresAuth: boolean
}

export const QUICK_FILTER_TOGGLE_CONFIGS: QuickFilterToggleConfig[] = [
  {
    key: 'myRecipes',
    label: 'My Recipes',
    icon: User,
    requiresAuth: true,
  },
  {
    key: 'markedByMe',
    label: 'Favorites',
    icon: Heart,
    requiresAuth: true,
  },
  {
    key: 'hasImage',
    label: 'Has Image',
    icon: Image,
    requiresAuth: false,
  },
]
