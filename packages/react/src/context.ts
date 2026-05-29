import { createContext, useContext } from 'react'
import type { FormRuntime } from '@form-render/core'

export const FormContext = createContext<FormRuntime | null>(null)

export function useFormContext(): FormRuntime {
  const runtime = useContext(FormContext)
  if (!runtime) {
    throw new Error('[FormRender] useFormContext must be used within a FormRenderer')
  }
  return runtime
}
