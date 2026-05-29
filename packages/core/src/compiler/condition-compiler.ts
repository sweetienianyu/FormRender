import type { ConditionExpr, ConditionObject } from '../protocol/types'
import type { DependencyGraph } from './dependency-graph'

export interface CompiledCondition {
  type: 'static' | 'dynamic'
  value?: boolean
  deps: string[]
  evaluate: (values: Record<string, any>) => boolean
}

export function compileCondition(
  expr: ConditionExpr | undefined,
  depGraph: DependencyGraph,
  selfPath: string
): CompiledCondition | undefined {
  if (expr === undefined) return undefined

  if (typeof expr === 'boolean') {
    return { type: 'static', value: expr, deps: [], evaluate: () => expr }
  }

  if (typeof expr === 'string') {
    return compileStringExpression(expr, depGraph, selfPath)
  }

  return compileConditionObject(expr, depGraph, selfPath)
}

function compileStringExpression(
  expr: string,
  depGraph: DependencyGraph,
  selfPath: string
): CompiledCondition {
  const deps = extractFieldRefs(expr)
  for (const dep of deps) {
    depGraph.addDependency(dep, selfPath)
  }

  const fn = new Function('$values', `with($values) { return (${expr}); }`)

  return {
    type: 'dynamic',
    deps,
    evaluate: (values) => {
      try {
        return !!fn(values)
      } catch {
        return false
      }
    },
  }
}

function compileConditionObject(
  obj: ConditionObject,
  depGraph: DependencyGraph,
  selfPath: string
): CompiledCondition {
  const deps = extractConditionDeps(obj)
  for (const dep of deps) {
    depGraph.addDependency(dep, selfPath)
  }

  return {
    type: 'dynamic',
    deps,
    evaluate: (values) => evaluateConditionObject(obj, values),
  }
}

function evaluateConditionObject(
  obj: ConditionObject,
  values: Record<string, any>
): boolean {
  const fieldValue = obj.field ? getNestedValue(values, obj.field) : undefined

  switch (obj.type) {
    case 'eq':
      return fieldValue === obj.value
    case 'neq':
      return fieldValue !== obj.value
    case 'gt':
      return fieldValue > obj.value
    case 'gte':
      return fieldValue >= obj.value
    case 'lt':
      return fieldValue < obj.value
    case 'lte':
      return fieldValue <= obj.value
    case 'in':
      return Array.isArray(obj.value) && obj.value.includes(fieldValue)
    case 'notIn':
      return Array.isArray(obj.value) && !obj.value.includes(fieldValue)
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== ''
    case 'and':
      return (obj.conditions || []).every((c) =>
        typeof c === 'object' && 'type' in c
          ? evaluateConditionObject(c as ConditionObject, values)
          : !!c
      )
    case 'or':
      return (obj.conditions || []).some((c) =>
        typeof c === 'object' && 'type' in c
          ? evaluateConditionObject(c as ConditionObject, values)
          : !!c
      )
    case 'not':
      return !evaluateConditionObject(
        (obj.conditions?.[0] as ConditionObject) || { type: 'eq', field: '', value: true },
        values
      )
    case 'depends':
      return fieldValue !== undefined && fieldValue !== null
    default:
      return false
  }
}

function extractConditionDeps(obj: ConditionObject): string[] {
  const deps: string[] = []
  if (obj.field) deps.push(obj.field)
  if (obj.conditions) {
    for (const c of obj.conditions) {
      if (typeof c === 'object' && 'type' in c) {
        deps.push(...extractConditionDeps(c as ConditionObject))
      }
    }
  }
  return [...new Set(deps)]
}

function extractFieldRefs(expr: string): string[] {
  const refs = new Set<string>()
  const identifierPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g
  let match: RegExpExecArray | null
  while ((match = identifierPattern.exec(expr)) !== null) {
    const id = match[1]
    if (!['true', 'false', 'null', 'undefined', 'typeof', 'instanceof'].includes(id)) {
      refs.add(id)
    }
  }
  return Array.from(refs)
}

function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}
