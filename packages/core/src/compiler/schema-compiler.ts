import type { FormSchema, FieldSchema, ReactionSchema, ReactionFulfill, ConditionExpr } from '../protocol/types'
import { normalizeSchema } from '../protocol/normalize'
import { DependencyGraph } from './dependency-graph'
import { compileCondition, type CompiledCondition } from './condition-compiler'

export interface UINode {
  id: string
  path: string
  component: string
  title?: string
  description?: string
  props: Record<string, any>
  decorator?: string
  decoratorProps?: Record<string, any>
  children?: UINode[]
  visible?: CompiledCondition
  disabled?: CompiledCondition
  readonly?: CompiledCondition
  validation?: CompiledValidation
  effects?: CompiledEffect[]
  isStatic: boolean
  span?: number
}

export interface CompiledValidation {
  required?: CompiledCondition
  rules: CompiledValidationRule[]
  deps: string[]
}

export interface CompiledValidationRule {
  type: string
  message: string
  validate: (value: any, formValues: Record<string, any>) => boolean | string
}

export interface CompiledEffect {
  deps: string[]
  when?: CompiledCondition
  fulfill: (values: Record<string, any>, field: EffectTarget) => void
  otherwise?: (values: Record<string, any>, field: EffectTarget) => void
}

export interface EffectTarget {
  props: Record<string, any>
  visible?: boolean
  disabled?: boolean
  readonly?: boolean
  required?: boolean
}

export interface CompiledSchema {
  dependencyGraph: DependencyGraph
  uiAST: UINode[]
  layout: FormSchema['layout']
}

export function compile(schema: FormSchema): CompiledSchema {
  const normalized = normalizeSchema(schema)
  const depGraph = new DependencyGraph()
  const uiAST = compileProperties(normalized.properties, '', depGraph)

  const cycles = depGraph.detectCycles()
  if (cycles) {
    console.warn('[FormRender] 检测到循环依赖:', cycles)
  }

  return {
    dependencyGraph: depGraph,
    uiAST,
    layout: normalized.layout,
  }
}

function compileProperties(
  properties: Record<string, FieldSchema>,
  parentPath: string,
  depGraph: DependencyGraph
): UINode[] {
  const nodes: UINode[] = []

  for (const [key, field] of Object.entries(properties)) {
    const path = parentPath ? `${parentPath}.${key}` : key
    nodes.push(compileField(field, path, depGraph))
  }

  return nodes
}

function compileField(
  field: FieldSchema,
  path: string,
  depGraph: DependencyGraph
): UINode {
  const hasDynamic =
    field.visible !== undefined ||
    field.disabled !== undefined ||
    field.readonly !== undefined ||
    (field.reactions && field.reactions.length > 0) ||
    (field.validation?.required !== undefined &&
      typeof field.validation.required !== 'boolean')

  const visible = compileCondition(field.visible, depGraph, path)
  const disabled = compileCondition(field.disabled, depGraph, path)
  const readonly = compileCondition(field.readonly, depGraph, path)

  let validation: CompiledValidation | undefined
  if (field.validation) {
    const requiredCond = compileCondition(
      field.validation.required as ConditionExpr | undefined,
      depGraph,
      path
    )

    const allDeps: string[] = []
    if (requiredCond) allDeps.push(...requiredCond.deps)

    validation = {
      required: requiredCond,
      rules: (field.validation.rules || []).map((rule) => {
        const compiledRule: CompiledValidationRule = {
          type: rule.type,
          message: rule.message,
          validate: createBuiltinValidator(rule),
        }
        return compiledRule
      }),
      deps: [...new Set(allDeps)],
    }
  }

  const effects = compileReactions(field.reactions, path, depGraph)

  const node: UINode = {
    id: path,
    path,
    component: field.ui?.component || 'Input',
    title: field.title,
    description: field.description,
    props: { ...field.ui?.props },
    decorator: field.ui?.decorator,
    decoratorProps: field.ui?.decoratorProps,
    visible,
    disabled,
    readonly,
    validation,
    effects: effects.length > 0 ? effects : undefined,
    isStatic: !hasDynamic,
    span: field.ui?.span,
  }

  if (field.type === 'object' && field.properties) {
    node.children = compileProperties(field.properties, path, depGraph)
  }

  if (field.type === 'array' && field.items) {
    node.children = [compileField(field.items, `${path}.*`, depGraph)]
  }

  return node
}

function compileReactions(
  reactions: ReactionSchema[] | undefined,
  selfPath: string,
  depGraph: DependencyGraph
): CompiledEffect[] {
  if (!reactions || reactions.length === 0) return []

  return reactions.map((reaction) => {
    const when = compileCondition(reaction.when, depGraph, selfPath)

    return {
      deps: when?.deps || [],
      when,
      fulfill: createEffectHandler(reaction.fulfill),
      otherwise: reaction.otherwise
        ? createEffectHandler(reaction.otherwise)
        : undefined,
    }
  })
}

function createEffectHandler(
  fulfill: ReactionFulfill
): (values: Record<string, any>, field: EffectTarget) => void {
  return (values: Record<string, any>, field: EffectTarget) => {
    if (fulfill.state) {
      for (const [key, value] of Object.entries(fulfill.state)) {
        if (key.startsWith('ui.props.')) {
          const propKey = key.slice('ui.props.'.length)
          field.props[propKey] = value
        } else if (key === 'visible') {
          field.visible = !!value
        } else if (key === 'disabled') {
          field.disabled = !!value
        } else if (key === 'readonly') {
          field.readonly = !!value
        } else if (key === 'required') {
          field.required = !!value
        }
      }
    }
  }
}

function createBuiltinValidator(
  rule: { type: string; message: string; value?: any }
): (value: any, formValues: Record<string, any>) => boolean | string {
  switch (rule.type) {
    case 'required':
      return (v) => (v !== undefined && v !== null && v !== '' ? true : rule.message)
    case 'min':
      return (v) =>
        typeof v === 'number' && v >= rule.value ? true : rule.message
    case 'max':
      return (v) =>
        typeof v === 'number' && v <= rule.value ? true : rule.message
    case 'minLength':
      return (v) =>
        typeof v === 'string' && v.length >= rule.value ? true : rule.message
    case 'maxLength':
      return (v) =>
        typeof v === 'string' && v.length <= rule.value ? true : rule.message
    case 'pattern':
      return (v) =>
        new RegExp(rule.value).test(v) ? true : rule.message
    case 'email':
      return (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? true : rule.message
    default:
      return () => true
  }
}
