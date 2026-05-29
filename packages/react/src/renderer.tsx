import React, { useMemo, useImperativeHandle } from 'react'
import type { FormSchema, UINode, FieldState } from '@form-render/core'
import { compile, createFormRuntime, FormRuntime } from '@form-render/core'
import { FormContext } from './context'
import { ComponentRegistry, globalRegistry } from './registry'
import { useFieldState } from './hooks'

interface FormRendererProps {
  schema: FormSchema
  components?: Record<string, React.ComponentType<any>>
  registry?: ComponentRegistry
  onSubmit?: (values: Record<string, any>) => void
  onReset?: () => void
  onFormStateChange?: (state: any) => void
  className?: string
  style?: React.CSSProperties
}

export function FormRenderer({
  schema,
  components,
  registry = globalRegistry,
  onSubmit,
  onReset,
  onFormStateChange,
  className,
  style,
}: FormRendererProps) {
  const compiled = useMemo(() => compile(schema), [schema])
  const runtime = useMemo(() => createFormRuntime(compiled), [compiled])

  React.useEffect(() => {
    if (onSubmit) {
      return runtime.on('onFormSubmit', (result: any) => {
        if (result.valid) onSubmit(result.values)
      })
    }
  }, [runtime, onSubmit])

  React.useEffect(() => {
    if (onReset) {
      return runtime.on('onFormReset', onReset)
    }
  }, [runtime, onReset])

  React.useEffect(() => {
    if (onFormStateChange) {
      return runtime.subscribeForm(onFormStateChange)
    }
  }, [runtime, onFormStateChange])

  const mergedRegistry = useMemo(() => {
    if (!components) return registry
    const merged = new ComponentRegistry()
    for (const type of registry.getAllTypes()) {
      const def = registry.resolve(type)
      if (def) merged.register(type, def)
    }
    for (const [type, component] of Object.entries(components)) {
      merged.register(type, { component })
    }
    return merged
  }, [registry, components])

  return (
    <FormContext.Provider value={runtime}>
      <form
        className={className}
        style={style}
        onSubmit={(e) => {
          e.preventDefault()
          runtime.submit()
        }}
        onReset={(e) => {
          e.preventDefault()
          runtime.reset()
        }}
      >
        {compiled.uiAST.map((node) => (
          <NodeRenderer key={node.id} node={node} runtime={runtime} registry={mergedRegistry} />
        ))}
      </form>
    </FormContext.Provider>
  )
}

interface NodeRendererProps {
  node: UINode
  runtime: FormRuntime
  registry: ComponentRegistry
}

function NodeRenderer({ node, runtime, registry }: NodeRendererProps) {
  const fieldState = useFieldState(runtime, node.path)

  if (!fieldState) return null

  if (!fieldState.visible) return null

  const definition = registry.resolve(node.component)
  if (!definition) {
    console.warn(`[FormRender] 未注册组件: ${node.component}`)
    return null
  }

  const Component = definition.component
  const valueProp = definition.valueProp || 'value'
  const onChangeProp = definition.onChangeProp || 'onChange'
  const transformChange = definition.transformChange

  const mergedProps = {
    ...definition.defaultProps,
    ...node.props,
    ...fieldState.props,
    [valueProp]: definition.transformValue
      ? definition.transformValue(fieldState.value)
      : fieldState.value,
    [onChangeProp]: transformChange
      ? (e: any) => runtime.setFieldValue(node.path, transformChange(e))
      : (val: any) => runtime.setFieldValue(node.path, val),
    disabled: fieldState.disabled,
    readOnly: fieldState.readonly,
  }

  if (node.children && node.children.length > 0) {
    return (
      <FieldDecorator node={node} fieldState={fieldState}>
        <Component {...mergedProps}>
          {node.children.map((child) => (
            <NodeRenderer key={child.id} node={child} runtime={runtime} registry={registry} />
          ))}
        </Component>
      </FieldDecorator>
    )
  }

  return (
    <FieldDecorator node={node} fieldState={fieldState}>
      <Component {...mergedProps} />
    </FieldDecorator>
  )
}

interface FieldDecoratorProps {
  node: UINode
  fieldState: FieldState
  children: React.ReactNode
}

function FieldDecorator({ node, fieldState, children }: FieldDecoratorProps) {
  const hasError = fieldState.errors.length > 0

  return (
    <div
      className="fr-field"
      data-path={node.path}
      style={{
        marginBottom: 16,
        display: fieldState.visible === false ? 'none' : undefined,
      }}
    >
      {node.title && (
        <label
          className="fr-field-label"
          style={{
            display: 'block',
            marginBottom: 4,
            fontWeight: fieldState.required ? 600 : 400,
            fontSize: 14,
            color: '#333',
          }}
        >
          {node.title}
          {fieldState.required && (
            <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>
          )}
        </label>
      )}
      {children}
      {node.description && (
        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{node.description}</div>
      )}
      {hasError && (
        <div style={{ fontSize: 12, color: '#ff4d4f', marginTop: 4 }}>
          {fieldState.errors.join('; ')}
        </div>
      )}
    </div>
  )
}
