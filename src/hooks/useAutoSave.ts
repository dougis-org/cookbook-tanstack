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
  const [savedToServer, setSavedToServer] = useState(false)
  const [draft, setDraft] = useState<T | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    isValidRef.current = formState.isValid
  }, [formState.isValid])

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

  const triggerSave = useCallback(async () => {
    const currentValues = getValuesRef.current()
    if (onSaveRef.current && isValidRef.current) {
      setStatus("saving")
      setSavedToServer(false)
      try {
        await onSaveRef.current(currentValues)
        setStatus("saved")
        setSavedToServer(true)
        timerRef.current = setTimeout(() => setStatus("idle"), 3000)
      } catch (e) {
        console.error("Autosave mutation failed", e)
        setStatus("error")
      }
    }
  }, [])

  useEffect(() => {
    const subscription = watchRef.current(() => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      setSavedToServer(false)
      setStatus("idle")

      timerRef.current = setTimeout(async () => {
        const currentValues = getValuesRef.current()

        try {
          localStorage.setItem(localStorageKey, JSON.stringify(currentValues))
        } catch (e) {
          console.error("Failed to save draft to localStorage", e)
          setStatus("error")
          return
        }

        if (onSaveRef.current && isValidRef.current) {
          setStatus("saving")
          try {
            await onSaveRef.current(currentValues)
            setStatus("saved")
            setSavedToServer(true)
            timerRef.current = setTimeout(() => {
              setStatus("idle")
            }, 3000)
          } catch (e) {
            console.error("Autosave mutation failed", e)
            setStatus("error")
          }
        } else {
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

  return { status, savedToServer, draft, purgeDraft, resetStatus, retry: triggerSave }
}
