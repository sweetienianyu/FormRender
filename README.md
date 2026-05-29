# FormRender

协议驱动 + 编译型中间层的高性能表单生成器，支持复杂联动、条件显隐、选项联动、跨字段校验。

### 安装

```bash
pnpm add @form-render/core @form-render/react
```

### 最简用法

```tsx
import { FormRenderer } from '@form-render/react'
import type { FormSchema } from '@form-render/core'

const schema: FormSchema = {
  version: '1.0',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      title: '姓名',
      validation: { required: true },
    },
    email: {
      type: 'string',
      title: '邮箱',
      ui: { component: 'Input', props: { placeholder: '请输入邮箱' } },
    },
  },
}

export default () => (
  <FormRenderer
    schema={schema}
    onSubmit={(values) => console.log('提交:', values)}
  />
)
```

---

## API 文档

### 一、协议层 (`@form-render/core`)

#### FormSchema

表单 Schema 顶层定义：

```typescript
interface FormSchema {
  version: string
  type: 'object'
  properties: Record<string, FieldSchema>
  layout?: LayoutSchema
  rules?: FormRule[]
  actions?: FormAction[]
}
```

#### FieldSchema

字段定义：

```typescript
interface FieldSchema {
  type: FieldType
  title?: string
  description?: string
  default?: any
  ui?: UISchema
  validation?: ValidationSchema
  visible?: ConditionExpr
  disabled?: ConditionExpr
  readonly?: ConditionExpr
  properties?: Record<string, FieldSchema>   // object 类型嵌套
  items?: FieldSchema                        // array 类型子项
  reactions?: ReactionSchema[]               // 联动副作用
}
```

#### FieldType

```typescript
type FieldType =
  | 'string' | 'number' | 'boolean'
  | 'object' | 'array'
  | 'date' | 'datetime' | 'email' | 'url'
  | 'file' | 'rich-text' | 'code'
```

#### UISchema

UI 绑定描述：

```typescript
interface UISchema {
  component?: string                    // 组件名（对应 Registry 中的注册名）
  props?: Record<string, any>           // 组件 props
  decorator?: string                    // 装饰器组件名
  decoratorProps?: Record<string, any>  // 装饰器 props
  span?: number                         // 栅格占位
  order?: number                        // 排序权重
}
```

#### ValidationSchema

校验规则：

```typescript
interface ValidationSchema {
  required?: boolean | ConditionExpr    // 静态必填 或 条件必填
  rules?: ValidationRuleSchema[]
}

interface ValidationRuleSchema {
  type: string       // 'required' | 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'email'
  message: string
  value?: any
  validator?: string
}
```

#### ConditionExpr

条件表达式，支持两种写法：

```typescript
type ConditionExpr = string | ConditionObject
```

**声明式条件对象**（推荐）：

```typescript
interface ConditionObject {
  type: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
       | 'in' | 'notIn' | 'and' | 'or' | 'not' | 'exists' | 'depends'
  field?: string              // 依赖的字段路径
  value?: any                 // 比较值
  conditions?: ConditionExpr[] // and/or/not 的子条件
  config?: string             // depends 类型的配置键
}
```

| type | 含义 | 示例 |
|------|------|------|
| `eq` | 等于 | `{ type: 'eq', field: 'a', value: 'configX' }` |
| `neq` | 不等于 | `{ type: 'neq', field: 'b', value: '' }` |
| `gt` | 大于 | `{ type: 'gt', field: 'amount', value: 10000 }` |
| `gte` | 大于等于 | `{ type: 'gte', field: 'age', value: 18 }` |
| `lt` | 小于 | `{ type: 'lt', field: 'amount', value: 5000 }` |
| `lte` | 小于等于 | `{ type: 'lte', field: 'count', value: 100 }` |
| `in` | 在列表中 | `{ type: 'in', field: 'status', value: ['A', 'B'] }` |
| `notIn` | 不在列表中 | `{ type: 'notIn', field: 'role', value: ['admin'] }` |
| `and` | 所有条件为真 | `{ type: 'and', conditions: [...] }` |
| `or` | 任一条件为真 | `{ type: 'or', conditions: [...] }` |
| `not` | 取反 | `{ type: 'not', conditions: [...] }` |
| `exists` | 字段有值 | `{ type: 'exists', field: 'province' }` |
| `depends` | 依赖字段 | `{ type: 'depends', field: 'a' }` |

**字符串表达式**（高级场景）：

```json
{
  "visible": "a === 'configX' && b !== ''"
}
```

字符串表达式会被编译为函数（非 eval），支持标准 JS 运算符。

#### ReactionSchema

联动副作用，当条件满足时修改目标字段的 UI 属性：

```typescript
interface ReactionSchema {
  when: ConditionExpr
  fulfill: ReactionFulfill
  otherwise?: ReactionFulfill
}

interface ReactionFulfill {
  state?: Record<string, any>  // 要修改的状态
  run?: string                 // 要执行的表达式
}
```

`state` 中支持的 key：

| key | 含义 | 示例值 |
|-----|------|--------|
| `visible` | 显隐 | `true` / `false` |
| `disabled` | 禁用 | `true` / `false` |
| `readonly` | 只读 | `true` / `false` |
| `required` | 必填 | `true` / `false` |
| `ui.props.xxx` | 组件属性 | 任意值（如 options 数组） |

#### LayoutSchema

布局类型：

```typescript
type LayoutSchema =
  | { type: 'vertical'; gap?: number }
  | { type: 'horizontal'; labelWidth?: number | string; labelAlign?: 'left' | 'right' }
  | { type: 'grid'; columns: number; gutter?: number }
  | { type: 'tabs'; items: Array<{ title: string; fields: string[] }> }
  | { type: 'steps'; items: Array<{ title: string; fields: string[] }> }
  | { type: 'collapse'; items: Array<{ title: string; fields: string[] }> }
  | { type: 'inline' }
```

---

### 二、编译层 (`@form-render/core`)

#### `compile(schema)`

将 FormSchema 编译为 CompiledSchema：

```typescript
import { compile } from '@form-render/core'

const compiled = compile(schema)
// compiled.dependencyGraph — 依赖图
// compiled.uiAST           — UI AST 节点树
// compiled.layout          — 布局配置
```

**编译流水线**：

```
FormSchema
  ↓ normalizeSchema()      — 补全默认值
  ↓ buildDependencyGraph()  — 从条件表达式提取依赖，构建有向图
  ↓ compileExpressions()    — 编译条件为可执行函数
  ↓ generateUIAST()         — 生成 UI AST
  ↓ detectCycles()          — 检测循环依赖
  ↓ CompiledSchema
```

#### DependencyGraph

有向依赖图，O(1) 查找受影响字段：

```typescript
class DependencyGraph {
  addDependency(from: string, to: string): void
  getDependents(field: string): Set<string>    // 谁依赖我
  getDependencies(field: string): Set<string>  // 我依赖谁
  getAllNodes(): string[]
  detectCycles(): string[][] | null
  topologicalSort(): string[]
}
```

#### CompiledCondition

编译后的条件：

```typescript
interface CompiledCondition {
  type: 'static' | 'dynamic'
  value?: boolean
  deps: string[]
  evaluate: (values: Record<string, any>) => boolean
}
```

---

### 三、运行时层 (`@form-render/core`)

#### FormRuntime

表单运行时核心，管理状态、联动、校验：

```typescript
import { createFormRuntime } from '@form-render/core'

const runtime = createFormRuntime(compiled)
```

**值操作**：

| 方法 | 签名 | 说明 |
|------|------|------|
| `setFieldValue` | `(path: string, value: any): void` | 设置字段值，触发联动 |
| `getFieldValue` | `(path: string): any` | 获取字段值 |
| `getFormValues` | `(): Record<string, any>` | 获取所有表单值 |

**状态查询**：

| 方法 | 签名 | 说明 |
|------|------|------|
| `getFieldState` | `(path: string): FieldState \| undefined` | 获取字段状态 |
| `getFormState` | `(): FormState` | 获取表单状态 |

**校验**：

| 方法 | 签名 | 说明 |
|------|------|------|
| `validateField` | `(path: string): Promise<string[]>` | 校验单个字段，返回错误列表 |
| `validateForm` | `(): Promise<{ valid: boolean; errors: Record<string, string[]> }>` | 校验整个表单 |

**订阅**：

| 方法 | 签名 | 说明 |
|------|------|------|
| `subscribeField` | `(path: string, listener: FieldListener): Unsubscribe` | 订阅字段状态变化 |
| `subscribeForm` | `(listener: FormListener): Unsubscribe` | 订阅表单状态变化 |
| `on` | `(event: FormEvent, handler): Unsubscribe` | 监听事件 |

**操作**：

| 方法 | 签名 | 说明 |
|------|------|------|
| `reset` | `(): void` | 重置表单 |
| `submit` | `(): Promise<{ valid: boolean; values: Record<string, any>; errors: Record<string, string[]> }>` | 提交表单 |

#### FormState

```typescript
interface FormState {
  values: Record<string, any>
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  touched: Record<string, boolean>
  dirty: Record<string, boolean>
  submitting: boolean
  validating: Record<string, boolean>
  status: 'idle' | 'editing' | 'submitting' | 'submitted'
}
```

#### FieldState

```typescript
interface FieldState {
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
```

#### 事件

```typescript
type FormEvent =
  | 'onFieldValueChange'
  | 'onFieldValidate'
  | 'onFormSubmit'
  | 'onFormReset'
  | 'onFormMount'
  | 'onFormUnmount'
```

---

### 四、校验引擎 (`@form-render/core`)

#### 内置校验规则

| type | 说明 | value 参数 |
|------|------|-----------|
| `required` | 必填 | — |
| `min` | 最小值 | `number` |
| `max` | 最大值 | `number` |
| `minLength` | 最小长度 | `number` |
| `maxLength` | 最大长度 | `number` |
| `pattern` | 正则匹配 | `string`（正则表达式） |
| `email` | 邮箱格式 | — |

#### 异步校验

```typescript
import type { AsyncValidator } from '@form-render/core'

const validator: AsyncValidator = {
  validate: async (value) => {
    const res = await fetch(`/api/check?value=${value}`)
    const data = await res.json()
    return data.available
  },
  message: '该值已被占用',
  debounce: 300,
}
```

---

### 五、渲染层 (`@form-render/react`)

#### FormRenderer

顶层渲染组件：

```tsx
<FormRenderer
  schema={schema}
  components={{ CustomWidget }}
  onSubmit={(values) => console.log(values)}
  onReset={() => console.log('reset')}
  onFormStateChange={(state) => console.log(state)}
  className="my-form"
  style={{ padding: 24 }}
/>
```

| Prop | 类型 | 说明 |
|------|------|------|
| `schema` | `FormSchema` | 表单 Schema（必填） |
| `components` | `Record<string, ComponentType>` | 自定义组件映射 |
| `registry` | `ComponentRegistry` | 组件注册表（默认使用全局注册表） |
| `onSubmit` | `(values: Record<string, any>) => void` | 提交回调（校验通过后触发） |
| `onReset` | `() => void` | 重置回调 |
| `onFormStateChange` | `(state: FormState) => void` | 表单状态变化回调 |
| `className` | `string` | 表单容器 className |
| `style` | `React.CSSProperties` | 表单容器 style |

#### ComponentRegistry

组件注册表，管理 Schema 中的 `component` 名到实际 React 组件的映射：

```typescript
import { globalRegistry } from '@form-render/react'

globalRegistry.register('MyWidget', {
  component: MyWidgetComponent,
  valueProp: 'value',
  onChangeProp: 'onChange',
  transformChange: (e) => e.target.value,
  defaultProps: { placeholder: '请输入' },
})
```

| 方法 | 说明 |
|------|------|
| `register(type, definition)` | 注册单个组件 |
| `registerMany(definitions)` | 批量注册 |
| `resolve(type)` | 按类型名解析组件 |
| `override(type, definition)` | 覆盖已注册组件 |
| `has(type)` | 判断是否已注册 |
| `getAllTypes()` | 获取所有注册类型 |

#### ComponentDefinition

```typescript
interface ComponentDefinition {
  component: ComponentType<any>       // React 组件
  defaultProps?: Record<string, any>  // 默认 props
  valueProp?: string                  // 值属性名，默认 'value'
  onChangeProp?: string               // 变化回调属性名，默认 'onChange'
  transformValue?: (value: any) => any     // 值转换（传入组件前）
  transformChange?: (event: any) => any    // 变化值转换（如 e.target.value）
}
```

#### Hooks

```typescript
import { useFieldState, useFormState, useFormContext } from '@form-render/react'

function MyComponent() {
  const runtime = useFormContext()
  const fieldState = useFieldState(runtime, 'name')
  const formState = useFormState(runtime)

  return <div>{fieldState?.value}</div>
}
```

| Hook | 签名 | 说明 |
|------|------|------|
| `useFieldState` | `(runtime: FormRuntime, path: string): FieldState \| undefined` | 订阅字段状态，字段变化时自动重渲染 |
| `useFormState` | `(runtime: FormRuntime): FormState` | 订阅表单状态 |
| `useFormContext` | `(): FormRuntime` | 获取 FormRuntime 实例（必须在 FormRenderer 内使用） |

#### 内置组件

默认已注册到 `globalRegistry`，Schema 中可直接使用：

| 组件名 | 说明 | 特有 Props |
|--------|------|-----------|
| `Input` | 文本输入框 | `placeholder` |
| `InputNumber` | 数字输入框 | `placeholder`, `min`, `max` |
| `Select` | 下拉选择框 | `placeholder`, `options: Array<{label, value}>` |
| `Checkbox` | 复选框 | `label` |
| `Switch` | 开关 | — |
| `DatePicker` | 日期选择器 | `placeholder` |
| `Textarea` | 多行文本框 | `placeholder`, `rows` |

---

## 联动示例

### 显隐联动

字段 b 为 `'opt1'` 时显示字段 c：

```json
{
  "c": {
    "type": "string",
    "title": "备注",
    "ui": { "component": "Input" },
    "visible": { "type": "eq", "field": "b", "value": "opt1" }
  }
}
```

### 条件必填

字段 a 为 `'configX'` 时字段 f 必填：

```json
{
  "f": {
    "type": "string",
    "title": "配置X专属字段",
    "ui": { "component": "Input" },
    "visible": { "type": "eq", "field": "a", "value": "configX" },
    "validation": {
      "required": { "type": "eq", "field": "a", "value": "configX" }
    }
  }
}
```

### 选项联动

字段 d 勾选时字段 e 展示高级选项，否则展示普通选项：

```json
{
  "e": {
    "type": "string",
    "title": "选项",
    "ui": { "component": "Select" },
    "reactions": [
      {
        "when": { "type": "eq", "field": "d", "value": true },
        "fulfill": {
          "state": {
            "ui.props.options": [
              { "label": "高级选项1", "value": "adv1" },
              { "label": "高级选项2", "value": "adv2" }
            ]
          }
        },
        "otherwise": {
          "state": {
            "ui.props.options": [
              { "label": "普通选项", "value": "normal" }
            ]
          }
        }
      }
    ]
  }
}
```

### 多条件组合（AND）

订单类型为紧急且金额超过 10000 时，审批级别展示高级选项：

```json
{
  "approvalLevel": {
    "type": "string",
    "title": "审批级别",
    "ui": { "component": "Select" },
    "reactions": [
      {
        "when": {
          "type": "and",
          "conditions": [
            { "type": "eq", "field": "orderType", "value": "urgent" },
            { "type": "gt", "field": "amount", value: 10000 }
          ]
        },
        "fulfill": {
          "state": {
            "ui.props.options": [
              { "label": "CEO 审批", "value": "ceo" },
              { "label": "董事会审批", "value": "board" }
            ]
          }
        }
      }
    ]
  }
}
```

### 级联选择

国家→省份→城市三级联动：

```json
{
  "country": {
    "type": "string",
    "title": "国家",
    "ui": {
      "component": "Select",
      "props": {
        "options": [
          { "label": "中国", "value": "CN" },
          { "label": "美国", "value": "US" }
        ]
      }
    }
  },
  "province": {
    "type": "string",
    "title": "省份",
    "ui": { "component": "Select" },
    "visible": { "type": "eq", "field": "country", "value": "CN" },
    "reactions": [
      {
        "when": { "type": "eq", "field": "country", "value": "CN" },
        "fulfill": {
          "state": {
            "ui.props.options": [
              { "label": "广东省", "value": "GD" },
              { "label": "浙江省", "value": "ZJ" }
            ]
          }
        }
      }
    ]
  },
  "city": {
    "type": "string",
    "title": "城市",
    "ui": { "component": "Select" },
    "visible": { "type": "exists", "field": "province" },
    "reactions": [
      {
        "when": { "type": "eq", "field": "province", "value": "GD" },
        "fulfill": {
          "state": {
            "ui.props.options": [
              { "label": "广州", "value": "GZ" },
              { "label": "深圳", "value": "SZ" }
            ]
          }
        }
      }
    ]
  }
}
```

---

## 自定义组件

### 注册自定义组件

```tsx
import { globalRegistry } from '@form-render/react'

const RichTextEditor: React.FC<{
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
}> = ({ value, onChange, disabled }) => {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      style={{ width: '100%', minHeight: 200 }}
    />
  )
}

globalRegistry.register('RichText', { component: RichTextEditor })
```

### 在 Schema 中使用

```json
{
  "content": {
    "type": "string",
    "title": "内容",
    "ui": { "component": "RichText" }
  }
}
```

### 通过 FormRenderer props 传入

```tsx
<FormRenderer
  schema={schema}
  components={{ RichText: RichTextEditor }}
/>
```

---

## 性能

### 编译阶段（一次性）

| 字段数 | 平均编译耗时 | 是否影响帧率 |
|--------|------------|-------------|
| 50 | <0.5ms | ✅ |
| 200 | <2ms | ✅ |
| 500 | <5ms | ✅ |
| 1000 | <10ms | ⚠️ 建议缓存 |

### 运行时阶段（每次输入）

O(k) 精准更新，k = 实际受影响字段数，通常 k << n。

| 操作 | 复杂度 |
|------|--------|
| setFieldValue | O(1) |
| 查依赖图 | O(1) |
| 条件求值 | O(1) |
| 通知订阅者 | O(k) |
| 组件重渲染 | O(k) |

详细性能分析见 [DESIGN.md 第八章](DESIGN.md)。

---

## 开发

```bash
pnpm install
pnpm dev          # 启动 Playground
pnpm build        # 构建 core + react 包
```

## License

MIT
