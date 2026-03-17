import { User, Heart, Image } from 'lucide-react'
import { type ReactNode } from 'react'

interface FilterRow1QuickProps {
  myRecipes: boolean | undefined
  markedByMe: boolean | undefined
  hasImage: boolean | undefined
  isLoggedIn: boolean
  updateSearch: (updates: { myRecipes?: boolean; markedByMe?: boolean; hasImage?: boolean }) => void
}

/** Reusable toggle button component */
function FilterToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
        active ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * FilterRow1Quick - Quick filter toggles
 *
 * Displays toggle buttons for frequently-used filters:
 * - My Recipes (logged-in users only)
 * - Favorites (logged-in users only)
 * - Has Image (always visible)
 *
 * All state is managed externally via URL search parameters.
 */
export function FilterRow1Quick({
  myRecipes,
  markedByMe,
  hasImage,
  isLoggedIn,
  updateSearch,
}: FilterRow1QuickProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {isLoggedIn && (
        <>
          <FilterToggle
            active={!!myRecipes}
            onClick={() => updateSearch({ myRecipes: myRecipes ? undefined : true })}
          >
            <User className="w-3.5 h-3.5" />
            My Recipes
          </FilterToggle>
          <FilterToggle
            active={!!markedByMe}
            onClick={() => updateSearch({ markedByMe: markedByMe ? undefined : true })}
          >
            <Heart className="w-3.5 h-3.5" />
            Favorites
          </FilterToggle>
        </>
      )}
      <FilterToggle
        active={!!hasImage}
        onClick={() => updateSearch({ hasImage: hasImage ? undefined : true })}
      >
        <Image className="w-3.5 h-3.5" />
        Has Image
      </FilterToggle>
    </div>
  )
}

export default FilterRow1Quick
