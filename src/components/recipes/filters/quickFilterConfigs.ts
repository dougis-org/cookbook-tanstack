/**
 * Quick filter toggle configuration
 * Consolidates metadata about quick filter toggles
 */

import { User, Heart, Image, type LucideIcon } from 'lucide-react'

export interface QuickFilterToggleConfig {
  key: 'myRecipes' | 'markedByMe' | 'hasImage'
  label: string
  icon: LucideIcon
  filterKey: 'myRecipes' | 'markedByMe' | 'hasImage'
  requiresAuth: boolean
}

export const QUICK_FILTER_TOGGLE_CONFIGS: QuickFilterToggleConfig[] = [
  {
    key: 'myRecipes',
    label: 'My Recipes',
    icon: User,
    filterKey: 'myRecipes',
    requiresAuth: true,
  },
  {
    key: 'markedByMe',
    label: 'Favorites',
    icon: Heart,
    filterKey: 'markedByMe',
    requiresAuth: true,
  },
  {
    key: 'hasImage',
    label: 'Has Image',
    icon: Image,
    filterKey: 'hasImage',
    requiresAuth: false,
  },
] as const
