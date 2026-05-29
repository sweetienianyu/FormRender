import type { DependencyGraph } from '../compiler/dependency-graph'
import type { UINode, CompiledEffect, EffectTarget } from '../compiler/schema-compiler'
import type { FieldState } from '../runtime/state'

export class ReactionEngine {
  private depGraph: DependencyGraph
  private nodeMap: Map<string, UINode>
  private fieldStates: Map<string, FieldState>
  private updateDepth = 0
  private maxUpdateDepth = 10

  constructor(
    depGraph: DependencyGraph,
    nodeMap: Map<string, UINode>,
    fieldStates: Map<string, FieldState>
  ) {
    this.depGraph = depGraph
    this.nodeMap = nodeMap
    this.fieldStates = fieldStates
  }

  runReactions(changedPath: string, values: Record<string, any>): string[] {
    this.updateDepth = 0
    const affected = new Set<string>()
    this.propagate(changedPath, values, affected)
    return Array.from(affected)
  }

  private propagate(
    sourcePath: string,
    values: Record<string, any>,
    affected: Set<string>
  ): void {
    this.updateDepth++
    if (this.updateDepth > this.maxUpdateDepth) {
      console.warn('[FormRender] 联动级联超过最大深度，可能存在循环依赖')
      this.updateDepth--
      return
    }

    const dependents = this.depGraph.getDependents(sourcePath)
    for (const depPath of dependents) {
      if (affected.has(depPath)) continue
      affected.add(depPath)

      const node = this.nodeMap.get(depPath)
      const fieldState = this.fieldStates.get(depPath)
      if (!node || !fieldState) continue

      let changed = false

      if (node.visible) {
        const wasVisible = fieldState.visible
        fieldState.visible = node.visible.evaluate(values)
        if (wasVisible !== fieldState.visible) changed = true
      }

      if (node.disabled) {
        const wasDisabled = fieldState.disabled
        fieldState.disabled = node.disabled.evaluate(values)
        if (wasDisabled !== fieldState.disabled) changed = true
      }

      if (node.readonly) {
        const wasReadonly = fieldState.readonly
        fieldState.readonly = node.readonly.evaluate(values)
        if (wasReadonly !== fieldState.readonly) changed = true
      }

      if (node.validation?.required) {
        const wasRequired = fieldState.required
        fieldState.required = !!node.validation.required.evaluate(values)
        if (wasRequired !== fieldState.required) changed = true
      }

      if (node.effects && node.effects.length > 0) {
        this.runEffects(node.effects, values, fieldState)
        changed = true
      }

      if (changed) {
        this.propagate(depPath, values, affected)
      }
    }

    this.updateDepth--
  }

  private runEffects(
    effects: CompiledEffect[],
    values: Record<string, any>,
    fieldState: FieldState
  ): void {
    for (const effect of effects) {
      const shouldFulfill = effect.when ? effect.when.evaluate(values) : true

      const target: EffectTarget = {
        props: fieldState.props,
        visible: fieldState.visible,
        disabled: fieldState.disabled,
        readonly: fieldState.readonly,
        required: fieldState.required,
      }

      if (shouldFulfill) {
        effect.fulfill(values, target)
      } else if (effect.otherwise) {
        effect.otherwise(values, target)
      }

      fieldState.props = target.props
      if (target.visible !== undefined) fieldState.visible = target.visible
      if (target.disabled !== undefined) fieldState.disabled = target.disabled
      if (target.readonly !== undefined) fieldState.readonly = target.readonly
      if (target.required !== undefined) fieldState.required = target.required
    }
  }

  evaluateInitial(values: Record<string, any>): void {
    for (const [path, node] of this.nodeMap) {
      const fieldState = this.fieldStates.get(path)
      if (!fieldState) continue

      if (node.visible) {
        fieldState.visible = node.visible.evaluate(values)
      }
      if (node.disabled) {
        fieldState.disabled = node.disabled.evaluate(values)
      }
      if (node.readonly) {
        fieldState.readonly = node.readonly.evaluate(values)
      }
      if (node.validation?.required) {
        fieldState.required = !!node.validation.required.evaluate(values)
      }
      if (node.effects && node.effects.length > 0) {
        this.runEffects(node.effects, values, fieldState)
      }
    }
  }
}
