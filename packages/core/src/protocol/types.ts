export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'date'
  | 'datetime'
  | 'email'
  | 'url'
  | 'file'
  | 'rich-text'
  | 'code'

export interface FormSchema {
  version: string
  type: 'object'
  properties: Record<string, FieldSchema>
  layout?: LayoutSchema
  rules?: FormRule[]
  actions?: FormAction[]
}

export interface FieldSchema {
  type: FieldType
  title?: string
  description?: string
  default?: any
  ui?: UISchema
  validation?: ValidationSchema
  visible?: ConditionExpr
  disabled?: ConditionExpr
  readonly?: ConditionExpr
  properties?: Record<string, FieldSchema>
  items?: FieldSchema
  reactions?: ReactionSchema[]
}

export interface UISchema {
  component?: string
  props?: Record<string, any>
  decorator?: string
  decoratorProps?: Record<string, any>
  span?: number
  order?: number
}

export interface ValidationSchema {
  required?: boolean | ConditionExpr
  rules?: ValidationRuleSchema[]
}

export interface ValidationRuleSchema {
  type: string
  message: string
  value?: any
  validator?: string
}

export type ConditionExpr =
  | string
  | ConditionObject

export interface ConditionObject {
  type: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'and' | 'or' | 'not' | 'exists' | 'depends'
  field?: string
  value?: any
  conditions?: ConditionExpr[]
  config?: string
}

export interface ReactionSchema {
  when: ConditionExpr
  fulfill: ReactionFulfill
  otherwise?: ReactionFulfill
}

export interface ReactionFulfill {
  state?: Record<string, any>
  run?: string
}

export type LayoutSchema =
  | VerticalLayout
  | HorizontalLayout
  | GridLayout
  | TabsLayout
  | StepsLayout
  | CollapseLayout
  | InlineLayout

export interface VerticalLayout {
  type: 'vertical'
  gap?: number
}

export interface HorizontalLayout {
  type: 'horizontal'
  labelWidth?: number | string
  labelAlign?: 'left' | 'right'
}

export interface GridLayout {
  type: 'grid'
  columns: number
  gutter?: number
}

export interface TabsLayout {
  type: 'tabs'
  items: TabItem[]
}

export interface StepsLayout {
  type: 'steps'
  items: StepItem[]
}

export interface CollapseLayout {
  type: 'collapse'
  items: CollapseItem[]
}

export interface InlineLayout {
  type: 'inline'
}

export interface TabItem {
  title: string
  fields: string[]
}

export interface StepItem {
  title: string
  fields: string[]
}

export interface CollapseItem {
  title: string
  fields: string[]
}

export interface FormRule {
  name: string
  condition: ConditionExpr
  effect: Record<string, any>
}

export interface FormAction {
  type: 'submit' | 'reset' | 'custom'
  label?: string
  url?: string
  method?: string
  handler?: string
}
