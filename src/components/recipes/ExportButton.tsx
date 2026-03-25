import { Download } from 'lucide-react'
import type { Recipe } from '@/types/recipe'
import { exportRecipeToJson } from '@/lib/export'
import { downloadBlob } from '@/lib/download'

interface ExportButtonProps {
  recipe: Recipe
}

function makeExportFilename(recipe: Recipe): string {
  const base = recipe.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${base || recipe.id}.json`
}

export default function ExportButton({ recipe }: ExportButtonProps) {
  function onExport() {
    try {
      const json = exportRecipeToJson(recipe)
      downloadBlob(json, makeExportFilename(recipe), 'application/json')
    } catch (err) {
      console.error('Export failed', err)
    }
  }

  return (
    <button
      type="button"
      onClick={onExport}
      className="print:hidden inline-flex items-center gap-2 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
    >
      <Download className="w-4 h-4" />
      Export
    </button>
  )
}
