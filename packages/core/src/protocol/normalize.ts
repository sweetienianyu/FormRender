import type { FormSchema, FieldSchema, FieldType } from './types'

const FIELD_DEFAULTS: Record<FieldType, Partial<FieldSchema>> = {
  string: { ui: { component: 'Input' } },
  number: { ui: { component: 'InputNumber' } },
  boolean: { ui: { component: 'Switch' } },
  object: { ui: { component: 'ObjectContainer' } },
  array: { ui: { component: 'ArrayContainer' } },
  date: { ui: { component: 'DatePicker' } },
  datetime: { ui: { component: 'DatePicker' } },
  email: { ui: { component: 'Input' } },
  url: { ui: { component: 'Input' } },
  file: { ui: { component: 'Upload' } },
  'rich-text': { ui: { component: 'RichText' } },
  code: { ui: { component: 'CodeEditor' } },
}

export function normalizeSchema(schema: FormSchema): FormSchema {
  return {
    version: schema.version || '1.0',
    type: 'object',
    properties: normalizeProperties(schema.properties),
    layout: schema.layout || { type: 'vertical', gap: 16 },
    rules: schema.rules || [],
    actions: schema.actions || [],
  }
}

function normalizeProperties(
  properties: Record<string, FieldSchema>
): Record<string, FieldSchema> {
  const result: Record<string, FieldSchema> = {}
  for (const [key, field] of Object.entries(properties)) {
    result[key] = normalizeField(key, field)
  }
  return result
}

function normalizeField(path: string, field: FieldSchema): FieldSchema {
  const defaults = FIELD_DEFAULTS[field.type] || {}

  const normalized: FieldSchema = {
    type: field.type,
    title: field.title || path,
    description: field.description,
    default: field.default,
    ui: {
      ...defaults.ui,
      ...field.ui,
      props: {
        ...(defaults.ui?.props || {}),
        ...(field.ui?.props || {}),
      },
    },
    validation: field.validation
      ? {
          required: field.validation.required,
          rules: field.validation.rules || [],
        }
      : undefined,
    visible: field.visible,
    disabled: field.disabled,
    readonly: field.readonly,
    reactions: field.reactions,
  }

  if (field.type === 'object' && field.properties) {
    normalized.properties = normalizeProperties(field.properties)
  }

  if (field.type === 'array' && field.items) {
    normalized.items = normalizeField(`${path}.*`, field.items)
  }

  return normalized
}
