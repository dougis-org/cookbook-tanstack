import { useEffect, useRef, useState, useCallback } from "react"
import { UseFormReturn, FieldValues } from "react-hook-form"

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error"

export interface UseAutoSaveProps<T extends FieldValues> {
  form: UseFormReturn<T>
  onSave?: (values: T) => Promise<any>
  localStorageKey: string
  debounceMs?: number
}

export function useAutoSave<T extends FieldValues>({
  form,
  onSave,
  localStorageKey,
  debounceMs = 2000,
}: UseAutoSaveProps<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle")
  const [draft, setDraft] = useState<T | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(localStorageKey)
    if (saved) {
      try {
        setDraft(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse draft", e)
      }
    }
  }, [localStorageKey])

  const purgeDraft = useCallback(() => {
    localStorage.removeItem(localStorageKey)
    setDraft(null)
  }, [localStorageKey])

  const resetStatus = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    setStatus("idle")
  }, [])

  const { watch, getValues, formState } = form
  const isValidRef = useRef(formState.isValid)
  const isDirtyRef = useRef(formState.isDirty)
  
  useEffect(() => {
    isValidRef.current = formState.isValid
  }, [formState.isValid])

  useEffect(() => {
    isDirtyRef.current = formState.isDirty
  }, [formState.isDirty])

  const onSaveRef = useRef(onSave)
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  const watchRef = useRef(watch)
  const getValuesRef = useRef(getValues)
  
  useEffect(() => {
    watchRef.current = watch
    getValuesRef.current = getValues
  }, [watch, getValues])

  useEffect(() => {
    const subscription = watchRef.current(() => {
      // Clear existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      setStatus("idle")

      timerRef.current = setTimeout(async () => {
        const currentValues = getValuesRef.current()
        const currentIsValid = isValidRef.current
        
        // Always save to localStorage
        localStorage.setItem(localStorageKey, JSON.stringify(currentValues))
        
        // If onSave is provided and form is valid, trigger it
        if (onSaveRef.current && currentIsValid) {
          setStatus("saving")
          try {
            await onSaveRef.current(currentValues)
            setStatus("saved")
            // Keep "Saved" status for a moment
            timerRef.current = setTimeout(() => {
              setStatus("idle")
            }, 3000)
          } catch (e) {
            console.error("Autosave mutation failed", e)
            setStatus("error")
          }
        } else {
          // If no mutation, just mark as saved (to localStorage)
          setStatus("saved")
          timerRef.current = setTimeout(() => {
            setStatus("idle")
          }, 3000)
        }
      }, debounceMs)
    })

    return () => {
      subscription.unsubscribe()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [localStorageKey, debounceMs])

  return { status, draft, purgeDraft, resetStatus }
}
