export type Unsubscribe = () => void

export type FieldListener = (state: FieldState) => void

export type FormListener = (state: FormState) => void

export type FormEvent =
  | 'onFieldValueChange'
  | 'onFieldValidate'
  | 'onFormSubmit'
  | 'onFormReset'
  | 'onFormMount'
  | 'onFormUnmount'

export interface FormState {
  values: Record<string, any>
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  touched: Record<string, boolean>
  dirty: Record<string, boolean>
  submitting: boolean
  validating: Record<string, boolean>
  status: 'idle' | 'editing' | 'submitting' | 'submitted'
}

export interface FieldState {
  value: any
  visible: boolean
  disabled: boolean
  readonly: boolean
  required: boolean
  errors: string[]
  warnings: string[]
  touched: boolean
  dirty: boolean
  validating: boolean
  props: Record<string, any>
}

export function createInitialFormState(): FormState {
  return {
    values: {},
    errors: {},
    warnings: {},
    touched: {},
    dirty: {},
    submitting: false,
    validating: {},
    status: 'idle',
  }
}

export function createInitialFieldState(defaultValue?: any): FieldState {
  return {
    value: defaultValue ?? undefined,
    visible: true,
    disabled: false,
    readonly: false,
    required: false,
    errors: [],
    warnings: [],
    touched: false,
    dirty: false,
    validating: false,
    props: {},
  }
}
