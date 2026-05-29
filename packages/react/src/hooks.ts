import { useState, useEffect, useRef } from 'react'
import type { FormRuntime, FieldState, Unsubscribe, FormState } from '@form-render/core'

export function useFieldState(runtime: FormRuntime, path: string): FieldState | undefined {
  const [state, setState] = useState<FieldState | undefined>(() => runtime.getFieldState(path))
  const unsubscribeRef = useRef<Unsubscribe | null>(null)

  useEffect(() => {
    unsubscribeRef.current?.()

    setState(runtime.getFieldState(path))

    unsubscribeRef.current = runtime.subscribeField(path, (newState: FieldState) => {
      setState(newState)
    })

    return () => {
      unsubscribeRef.current?.()
    }
  }, [runtime, path])

  return state
}

export function useFormState(runtime: FormRuntime) {
  const [state, setState] = useState<FormState>(() => runtime.getFormState())

  useEffect(() => {
    return runtime.subscribeForm((newState: FormState) => setState(newState))
  }, [runtime])

  return state
}
