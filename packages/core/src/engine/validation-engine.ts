import type { UINode, CompiledValidationRule } from '../compiler/schema-compiler'
import type { FieldState } from '../runtime/state'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export class ValidationEngine {
  private nodeMap: Map<string, UINode>
  private asyncValidators: Map<string, AsyncValidator[]> = new Map()
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()

  constructor(nodeMap: Map<string, UINode>) {
    this.nodeMap = nodeMap
  }

  registerAsyncValidator(path: string, validator: AsyncValidator): void {
    if (!this.asyncValidators.has(path)) {
      this.asyncValidators.set(path, [])
    }
    this.asyncValidators.get(path)!.push(validator)
  }

  validateField(
    path: string,
    value: any,
    formValues: Record<string, any>,
    fieldState: FieldState
  ): ValidationResult {
    const node = this.nodeMap.get(path)
    if (!node) return { valid: true, errors: [], warnings: [] }

    const errors: string[] = []
    const warnings: string[] = []

    if (fieldState.required && !fieldState.visible) {
      return { valid: true, errors: [], warnings: [] }
    }

    if (fieldState.required) {
      if (value === undefined || value === null || value === '') {
        errors.push('此字段为必填项')
      }
    }

    if (node.validation?.rules) {
      for (const rule of node.validation.rules) {
        const result = rule.validate(value, formValues)
        if (result !== true) {
          errors.push(typeof result === 'string' ? result : rule.message)
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings }
  }

  async validateFieldAsync(
    path: string,
    value: any,
    debounce?: number
  ): Promise<ValidationResult> {
    const asyncValidators = this.asyncValidators.get(path)
    if (!asyncValidators || asyncValidators.length === 0) {
      return { valid: true, errors: [], warnings: [] }
    }

    if (debounce) {
      const existing = this.debounceTimers.get(path)
      if (existing) clearTimeout(existing)

      return new Promise((resolve) => {
        this.debounceTimers.set(
          path,
          setTimeout(async () => {
            const result = await this.runAsyncValidators(path, value, asyncValidators)
            resolve(result)
          }, debounce)
        )
      })
    }

    return this.runAsyncValidators(path, value, asyncValidators)
  }

  private async runAsyncValidators(
    path: string,
    value: any,
    validators: AsyncValidator[]
  ): Promise<ValidationResult> {
    const errors: string[] = []

    for (const validator of validators) {
      try {
        const valid = await validator.validate(value)
        if (!valid) {
          errors.push(validator.message)
        }
      } catch (e) {
        errors.push(validator.message)
      }
    }

    return { valid: errors.length === 0, errors, warnings: [] }
  }

  validateForm(
    values: Record<string, any>,
    fieldStates: Map<string, FieldState>
  ): { valid: boolean; errors: Record<string, string[]> } {
    const allErrors: Record<string, string[]> = {}
    let valid = true

    for (const [path, fieldState] of fieldStates) {
      if (!fieldState.visible) continue

      const result = this.validateField(path, values[path], values, fieldState)
      if (!result.valid) {
        allErrors[path] = result.errors
        valid = false
      }
    }

    return { valid, errors: allErrors }
  }
}

export interface AsyncValidator {
  validate: (value: any) => Promise<boolean>
  message: string
  debounce?: number
}
