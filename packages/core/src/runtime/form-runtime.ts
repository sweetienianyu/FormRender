import type { CompiledSchema, UINode } from '../compiler/schema-compiler'
import type { FormState, FieldState, FieldListener, FormListener, Unsubscribe, FormEvent } from './state'
import { createInitialFormState, createInitialFieldState } from './state'
import { EventBus } from './event-bus'
import { ReactionEngine } from '../engine/reaction-engine'
import { ValidationEngine } from '../engine/validation-engine'

export class FormRuntime {
  private state: FormState
  private fieldStates: Map<string, FieldState> = new Map()
  private nodeMap: Map<string, UINode> = new Map()
  private compiled: CompiledSchema
  private reactionEngine: ReactionEngine
  private validationEngine: ValidationEngine
  private eventBus: EventBus
  private fieldListeners: Map<string, Set<FieldListener>> = new Map()
  private formListeners: Set<FormListener> = new Set()

  constructor(compiled: CompiledSchema) {
    this.compiled = compiled
    this.state = createInitialFormState()
    this.eventBus = new EventBus()

    this.buildNodeMap(compiled.uiAST)
    this.initFieldStates(compiled.uiAST)

    this.reactionEngine = new ReactionEngine(
      compiled.dependencyGraph,
      this.nodeMap,
      this.fieldStates
    )
    this.validationEngine = new ValidationEngine(this.nodeMap)

    this.reactionEngine.evaluateInitial(this.state.values)
  }

  private buildNodeMap(nodes: UINode[]): void {
    for (const node of nodes) {
      this.nodeMap.set(node.path, node)
      if (node.children) {
        this.buildNodeMap(node.children)
      }
    }
  }

  private initFieldStates(nodes: UINode[]): void {
    for (const node of nodes) {
      const initial = createInitialFieldState(node.props?.defaultValue)
      initial.props = { ...node.props }
      if (node.validation?.required) {
        if (node.validation.required.type === 'static') {
          initial.required = node.validation.required.value ?? false
        }
      }
      this.fieldStates.set(node.path, initial)
      this.state.values[node.path] = initial.value

      if (node.children) {
        this.initFieldStates(node.children)
      }
    }
  }

  setFieldValue(path: string, value: any): void {
    const prevValue = this.state.values[path]
    if (prevValue === value) return

    this.state.values[path] = value
    this.state.dirty[path] = true
    this.state.touched[path] = true
    this.state.status = 'editing'

    const fieldState = this.fieldStates.get(path)
    if (fieldState) {
      fieldState.value = value
      fieldState.dirty = true
      fieldState.touched = true
    }

    const affected = this.reactionEngine.runReactions(path, this.state.values)

    this.notifyFieldListeners(path)
    for (const affectedPath of affected) {
      this.notifyFieldListeners(affectedPath)
    }

    this.eventBus.emit('onFieldValueChange', { path, value, prevValue })
    this.notifyFormListeners()
  }

  getFieldValue(path: string): any {
    return this.state.values[path]
  }

  getFormValues(): Record<string, any> {
    return { ...this.state.values }
  }

  getFieldState(path: string): FieldState | undefined {
    const state = this.fieldStates.get(path)
    return state ? { ...state } : undefined
  }

  getFormState(): FormState {
    return { ...this.state }
  }

  getNode(path: string): UINode | undefined {
    return this.nodeMap.get(path)
  }

  getCompiledSchema(): CompiledSchema {
    return this.compiled
  }

  async validateField(path: string): Promise<string[]> {
    const fieldState = this.fieldStates.get(path)
    if (!fieldState) return []

    fieldState.validating = true
    this.notifyFieldListeners(path)

    const syncResult = this.validationEngine.validateField(
      path,
      this.state.values[path],
      this.state.values,
      fieldState
    )

    const asyncResult = await this.validationEngine.validateFieldAsync(path, this.state.values[path])

    const allErrors = [...syncResult.errors, ...asyncResult.errors]
    fieldState.errors = allErrors
    fieldState.validating = false
    this.state.errors[path] = allErrors

    this.notifyFieldListeners(path)
    return allErrors
  }

  async validateForm(): Promise<{ valid: boolean; errors: Record<string, string[]> }> {
    const result = this.validationEngine.validateForm(this.state.values, this.fieldStates)

    for (const [path, errors] of Object.entries(result.errors)) {
      const fieldState = this.fieldStates.get(path)
      if (fieldState) {
        fieldState.errors = errors
      }
      this.state.errors[path] = errors
      this.notifyFieldListeners(path)
    }

    this.state.status = result.valid ? 'submitted' : 'editing'
    this.notifyFormListeners()
    return result
  }

  subscribeField(path: string, listener: FieldListener): Unsubscribe {
    if (!this.fieldListeners.has(path)) {
      this.fieldListeners.set(path, new Set())
    }
    this.fieldListeners.get(path)!.add(listener)
    return () => {
      this.fieldListeners.get(path)?.delete(listener)
    }
  }

  subscribeForm(listener: FormListener): Unsubscribe {
    this.formListeners.add(listener)
    return () => {
      this.formListeners.delete(listener)
    }
  }

  on(event: FormEvent, handler: (...args: any[]) => void): Unsubscribe {
    return this.eventBus.on(event, handler)
  }

  reset(): void {
    this.state = createInitialFormState()
    for (const [path] of this.fieldStates) {
      const node = this.nodeMap.get(path)
      const initial = createInitialFieldState(node?.props?.defaultValue)
      initial.props = { ...(node?.props || {}) }
      if (node?.validation?.required?.type === 'static') {
        initial.required = node.validation.required.value ?? false
      }
      this.fieldStates.set(path, initial)
      this.state.values[path] = initial.value
    }

    this.reactionEngine.evaluateInitial(this.state.values)

    for (const path of this.fieldStates.keys()) {
      this.notifyFieldListeners(path)
    }

    this.state.status = 'idle'
    this.notifyFormListeners()
    this.eventBus.emit('onFormReset')
  }

  async submit(): Promise<{ valid: boolean; values: Record<string, any>; errors: Record<string, string[]> }> {
    this.state.submitting = true
    this.state.status = 'submitting'
    this.notifyFormListeners()

    const result = await this.validateForm()

    this.state.submitting = false
    this.state.status = result.valid ? 'submitted' : 'editing'
    this.notifyFormListeners()
    this.eventBus.emit('onFormSubmit', result)

    return {
      valid: result.valid,
      values: this.getFormValues(),
      errors: result.errors,
    }
  }

  private notifyFieldListeners(path: string): void {
    const state = this.fieldStates.get(path)
    const listeners = this.fieldListeners.get(path)
    if (state && listeners) {
      const snapshot = { ...state }
      for (const listener of listeners) {
        listener(snapshot)
      }
    }
  }

  private notifyFormListeners(): void {
    const snapshot = { ...this.state }
    for (const listener of this.formListeners) {
      listener(snapshot)
    }
  }
}

export function createFormRuntime(compiled: CompiledSchema): FormRuntime {
  return new FormRuntime(compiled)
}
