# 复杂联动实例对比

## 联动场景定义

```
a(Select) ──→ b(Select) ──→ c(Input, 显隐联动: b 为 'opt1' 时显示)
│
├──→ f(Input, 依赖a的配置: a 为 'configX' 时显示且必填)
│
d(Checkbox) ──→ e(Select, 依赖d的选中项: d 勾选时展示高级选项，否则展示普通选项)
```

业务语义：
- **a**：用户类型选择（配置X / 配置Y）
- **b**：子类型选择（选项1 / 选项2）
- **c**：当 b 选择了"选项1"时才显示的备注字段
- **d**：是否启用高级选项（复选框）
- **e**：选项下拉框，d 勾选时展示高级选项列表，否则展示普通选项
- **f**：当 a 选择了"配置X"时才显示且必填的专属字段

---

## 一、Formily（阿里巴巴）

### 1.1 Schema 方式（JSON 驱动）

```json
{
  "type": "object",
  "properties": {
    "a": {
      "type": "string",
      "title": "用户类型",
      "x-component": "Select",
      "x-decorator": "FormItem",
      "x-component-props": {
        "options": [
          { "label": "配置X", "value": "configX" },
          { "label": "配置Y", "value": "configY" }
        ]
      },
      "x-validator": [{ "required": true }]
    },
    "b": {
      "type": "string",
      "title": "子类型",
      "x-component": "Select",
      "x-decorator": "FormItem",
      "x-component-props": {
        "options": [
          { "label": "选项1", "value": "opt1" },
          { "label": "选项2", "value": "opt2" }
        ]
      }
    },
    "c": {
      "type": "string",
      "title": "备注",
      "x-component": "Input",
      "x-decorator": "FormItem",
      "x-reactions": {
        "dependencies": ["b"],
        "fulfill": {
          "state": {
            "visible": "{{$deps.b === 'opt1'}}"
          }
        }
      }
    },
    "d": {
      "type": "boolean",
      "title": "启用高级选项",
      "x-component": "Checkbox",
      "x-decorator": "FormItem"
    },
    "e": {
      "type": "string",
      "title": "选项",
      "x-component": "Select",
      "x-decorator": "FormItem",
      "x-reactions": {
        "when": "{{$values.d === true}}",
        "fulfill": {
          "state": {
            "componentProps.options": [
              { "label": "高级选项1", "value": "adv1" },
              { "label": "高级选项2", "value": "adv2" }
            ]
          }
        },
        "otherwise": {
          "state": {
            "componentProps.options": [
              { "label": "普通选项", "value": "normal" }
            ]
          }
        }
      }
    },
    "f": {
      "type": "string",
      "title": "配置X专属字段",
      "x-component": "Input",
      "x-decorator": "FormItem",
      "x-reactions": {
        "dependencies": ["a"],
        "fulfill": {
          "state": {
            "visible": "{{$deps.a === 'configX'}}",
            "required": "{{$deps.a === 'configX'}}"
          }
        }
      }
    }
  }
}
```

### 1.2 JS Effects 方式（代码驱动）

```typescript
import { createForm, onFieldReact, onFieldChange } from '@formily/core'

const form = createForm({
  effects() {
    onFieldReact('c', (field) => {
      field.visible = field.query('b').value() === 'opt1'
    })

    onFieldReact('f', (field) => {
      const aVal = field.query('a').value()
      field.visible = aVal === 'configX'
      field.required = aVal === 'configX'
    })

    onFieldChange('d', ['value'], (dField) => {
      const eField = dField.query('e').take()
      if (!eField) return
      eField.componentProps.options = dField.value
        ? [
            { label: '高级选项1', value: 'adv1' },
            { label: '高级选项2', value: 'adv2' },
          ]
        : [{ label: '普通选项', value: 'normal' }]
    })
  },
})
```

### 1.3 渲染

```tsx
import { FormProvider, SchemaField } from '@formily/react'
import { FormItem, Input, Select, Checkbox } from '@formily/antd'

const Schema = jsonSchemaAbove

export default () => (
  <FormProvider form={form}>
    <SchemaField
      schema={Schema}
      components={{ FormItem, Input, Select, Checkbox }}
    />
  </FormProvider>
)
```

### 1.4 Formily 方案评价

| 维度 | 评价 |
|------|------|
| **联动表达** | `x-reactions` + `dependencies` 声明式，语义清晰 |
| **复杂联动** | `when/fulfill/otherwise` 三段式，可读性好 |
| **选项联动** | `componentProps.options` 可动态设置，但 JSON 中写数组略冗长 |
| **性能** | `dependencies` 精确声明依赖，字段级精准更新 |
| **学习成本** | 需理解 `$values` / `$deps` / `$self` / `onFieldReact` 等概念 |

---

## 二、Amis（百度）

### 2.1 完整 JSON 配置

```json
{
  "type": "page",
  "title": "联动表单示例",
  "body": {
    "type": "form",
    "api": "/api/submit",
    "body": [
      {
        "type": "select",
        "name": "a",
        "label": "用户类型",
        "required": true,
        "options": [
          { "label": "配置X", "value": "configX" },
          { "label": "配置Y", "value": "configY" }
        ]
      },
      {
        "type": "select",
        "name": "b",
        "label": "子类型",
        "options": [
          { "label": "选项1", "value": "opt1" },
          { "label": "选项2", "value": "opt2" }
        ]
      },
      {
        "type": "input-text",
        "name": "c",
        "label": "备注",
        "visibleOn": "this.b === 'opt1'"
      },
      {
        "type": "checkbox",
        "name": "d",
        "label": "启用高级选项",
        "option": "启用"
      },
      {
        "type": "select",
        "name": "e",
        "label": "选项",
        "visibleOn": "this.d",
        "options": [
          { "label": "高级选项1", "value": "adv1" },
          { "label": "高级选项2", "value": "adv2" }
        ]
      },
      {
        "type": "select",
        "name": "e",
        "label": "选项",
        "visibleOn": "!this.d",
        "options": [
          { "label": "普通选项", "value": "normal" }
        ]
      },
      {
        "type": "input-text",
        "name": "f",
        "label": "配置X专属字段",
        "visibleOn": "this.a === 'configX'",
        "requiredOn": "this.a === 'configX'"
      }
    ]
  }
}
```

### 2.2 选项联动的另一种写法：事件驱动

```json
{
  "type": "select",
  "name": "e",
  "label": "选项",
  "source": {
    "method": "get",
    "url": "/api/options?advanced=${d}"
  }
}
```

当 `d` 变化时，`${d}` 自动替换为新值，重新请求接口获取选项列表。

### 2.3 Amis 方案评价

| 维度 | 评价 |
|------|------|
| **联动表达** | `visibleOn` / `requiredOn` / `hiddenOn` / `disabledOn`，语义直观 |
| **复杂联动** | 条件表达式用 `this.xxx` 引用数据域，JS 表达式自由度高 |
| **选项联动** | 同名字段分组切换（静态）或 `source` 远程加载（动态），两种方式 |
| **性能** | 内部基于 MobX 响应式，字段级更新 |
| **学习成本** | 较低，`visibleOn` 一看就懂；但同名字段切换是 trick，不够直观 |

**注意**：Amis 的选项联动用同名字段 + `visibleOn` 切换是一种常见模式，但语义上不够清晰。更推荐用 `source` 远程加载或 `onEvent` 事件驱动方式。

---

## 三、react-jsonschema-form (RJSF)

### 3.1 Schema + uiSchema

```typescript
import Form from '@rjsf/core'
import validator from '@rjsf/validator-ajv8'

const schema = {
  type: 'object',
  properties: {
    a: {
      type: 'string',
      title: '用户类型',
      enum: ['configX', 'configY'],
      enumNames: ['配置X', '配置Y'],
    },
    b: {
      type: 'string',
      title: '子类型',
      enum: ['opt1', 'opt2'],
      enumNames: ['选项1', '选项2'],
    },
    c: {
      type: 'string',
      title: '备注',
    },
    d: {
      type: 'boolean',
      title: '启用高级选项',
      default: false,
    },
    e: {
      type: 'string',
      title: '选项',
    },
    f: {
      type: 'string',
      title: '配置X专属字段',
    },
  },
  dependencies: {
    a: {
      oneOf: [
        {
          properties: {
            a: { enum: ['configX'] },
            f: { type: 'string', title: '配置X专属字段' },
          },
          required: ['f'],
        },
        {
          properties: {
            a: { enum: ['configY'] },
          },
        },
      ],
    },
    b: {
      oneOf: [
        {
          properties: {
            b: { enum: ['opt1'] },
            c: { type: 'string', title: '备注' },
          },
          required: ['c'],
        },
        {
          properties: {
            b: { enum: ['opt2'] },
          },
        },
      ],
    },
  },
}

const uiSchema = {
  'ui:order': ['a', 'b', 'c', 'd', 'e', 'f'],
  d: {
    'ui:widget': 'checkbox',
  },
}

export default () => <Form schema={schema} uiSchema={uiSchema} validator={validator} />
```

### 3.2 RJSF 的局限：d→e 选项联动需要自定义

RJSF **原生不支持**"字段 A 的值决定字段 B 的 options"这种联动。需要通过自定义 Widget + `onChange` 手动实现：

```typescript
const CustomSelectWidget = ({ value, onChange, options, schema, formContext }) => {
  const dValue = formContext.dValue

  const advancedOptions = [
    { label: '高级选项1', value: 'adv1' },
    { label: '高级选项2', value: 'adv2' },
  ]
  const normalOptions = [
    { label: '普通选项', value: 'normal' },
  ]

  const currentOptions = dValue ? advancedOptions : normalOptions

  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">请选择</option>
      {currentOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

const form = (
  <Form
    schema={schema}
    uiSchema={{
      e: { 'ui:widget': CustomSelectWidget },
    }}
    formContext={{ dValue: false }}
    onChange={(e) => {
      e.formData.d
    }}
    validator={validator}
  />
)
```

### 3.3 RJSF 方案评价

| 维度 | 评价 |
|------|------|
| **联动表达** | `dependencies` + `oneOf`，JSON Schema 标准方式 |
| **复杂联动** | `oneOf` 分支写法冗长，深层嵌套可读性差 |
| **选项联动** | **原生不支持**，需自定义 Widget + formContext 手动实现 |
| **性能** | 一般，字段变化时整表重新计算 Schema |
| **学习成本** | 低（纯 JSON Schema 标准），但高级联动需要深入定制 |

**RJSF 的核心局限**：它严格遵循 JSON Schema 标准，而 JSON Schema 的 `dependencies` 只能控制"字段是否存在/是否必填"，无法控制"字段的 UI 属性（如 options）"。选项联动、值联动、属性联动都需要自定义 Widget 或 `uiSchema` 的 `updateSchemaOnChange` hack。

---

## 四、自研方案（协议驱动 + 编译型中间层）

### 4.1 Schema 定义

```json
{
  "version": "1.0",
  "type": "object",
  "properties": {
    "a": {
      "type": "string",
      "title": "用户类型",
      "ui": {
        "component": "Select",
        "props": {
          "options": [
            { "label": "配置X", "value": "configX" },
            { "label": "配置Y", "value": "configY" }
          ]
        }
      },
      "validation": { "required": true }
    },
    "b": {
      "type": "string",
      "title": "子类型",
      "ui": {
        "component": "Select",
        "props": {
          "options": [
            { "label": "选项1", "value": "opt1" },
            { "label": "选项2", "value": "opt2" }
          ]
        }
      }
    },
    "c": {
      "type": "string",
      "title": "备注",
      "ui": { "component": "Input" },
      "visible": { "type": "eq", "field": "b", "value": "opt1" }
    },
    "d": {
      "type": "boolean",
      "title": "启用高级选项",
      "ui": { "component": "Checkbox" }
    },
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
    },
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
}
```

### 4.2 编译层输出

编译器会从 Schema 中提取依赖关系，构建依赖图：

```typescript
const compiledOutput = {
  dependencyGraph: {
    'a': ['c', 'f'],
    'b': ['c'],
    'd': ['e'],
  },
  uiAST: [
    {
      id: 'a', path: 'a', component: 'Select',
      props: { options: [...] },
      isStatic: true,
    },
    {
      id: 'b', path: 'b', component: 'Select',
      props: { options: [...] },
      isStatic: true,
    },
    {
      id: 'c', path: 'c', component: 'Input',
      visible: {
        type: 'dynamic',
        deps: ['b'],
        evaluate: (ctx) => ctx.values.b === 'opt1',
      },
      isStatic: false,
    },
    {
      id: 'd', path: 'd', component: 'Checkbox',
      isStatic: true,
    },
    {
      id: 'e', path: 'e', component: 'Select',
      effects: [{
        deps: ['d'],
        handler: (ctx, field) => {
          if (ctx.values.d === true) {
            field.props.options = [
              { label: '高级选项1', value: 'adv1' },
              { label: '高级选项2', value: 'adv2' },
            ]
          } else {
            field.props.options = [
              { label: '普通选项', value: 'normal' },
            ]
          }
        },
      }],
      isStatic: false,
    },
    {
      id: 'f', path: 'f', component: 'Input',
      visible: {
        type: 'dynamic',
        deps: ['a'],
        evaluate: (ctx) => ctx.values.a === 'configX',
      },
      validation: {
        rules: [{
          type: 'required',
          deps: ['a'],
          validate: (val, ctx) => ctx.values.a !== 'configX' || !!val,
          message: '此字段为必填项',
        }],
      },
      isStatic: false,
    },
  ],
}
```

### 4.3 运行时执行流程

```
用户修改 a = 'configX'
  │
  ├─ 1. state.values.a = 'configX'
  ├─ 2. 查依赖图 → dependents('a') = ['c', 'f']
  │
  ├─ 3. evaluateField('c')
  │     └─ c.visible.evaluate({values: {a: 'configX', ...}})
  │        → values.b === 'opt1' → false → c 保持隐藏
  │
  └─ 4. evaluateField('f')
        ├─ f.visible.evaluate({values: {a: 'configX', ...}})
        │   → values.a === 'configX' → true → f 显示
        └─ 通知 f 的 UI 订阅者重渲染

用户修改 d = true
  │
  ├─ 1. state.values.d = true
  ├─ 2. 查依赖图 → dependents('d') = ['e']
  └─ 3. evaluateField('e')
        └─ e.effects[0].handler({values: {d: true}}, eField)
           → e.props.options = [高级选项1, 高级选项2]
        └─ 通知 e 的 UI 订阅者重渲染
```

### 4.4 渲染层

```tsx
function FormRenderer({ schema }: { schema: FormSchema }) {
  const compiled = useMemo(() => compile(schema), [schema])
  const runtime = useMemo(() => createFormRuntime(compiled), [compiled])

  return (
    <FormContext.Provider value={runtime}>
      {compiled.uiAST.map(node => (
        <NodeRenderer key={node.id} node={node} />
      ))}
    </FormContext.Provider>
  )
}

function NodeRenderer({ node }: { node: UINode }) {
  const runtime = useContext(FormContext)
  const fieldState = useFieldState(runtime, node.path)

  if (node.visible?.type === 'dynamic' && !node.visible.evaluate(runtime.getContext())) {
    return null
  }

  const Component = registry.resolve(node.component)

  return (
    <FormItemDecorator
      label={node.title || fieldState.title}
      errors={fieldState.errors}
      required={fieldState.required}
    >
      <Component
        {...node.props}
        value={fieldState.value}
        onChange={(val: any) => runtime.setFieldValue(node.path, val)}
        disabled={fieldState.disabled}
      />
    </FormItemDecorator>
  )
}
```

### 4.5 自研方案评价

| 维度 | 评价 |
|------|------|
| **联动表达** | `visible` 条件对象 + `reactions` 副作用，声明式与命令式结合 |
| **复杂联动** | `when/fulfill/otherwise` 三段式，与 Formily 类似 |
| **选项联动** | `reactions` 原生支持，无需 hack |
| **性能** | 编译期构建依赖图，运行时 O(k) 精准更新 |
| **学习成本** | 自主可控，但需要自建生态 |

---

## 五、方案对比总结

| 维度 | Formily | Amis | RJSF | 自研 |
|------|---------|------|------|------|
| **c 显隐联动** | `x-reactions` + `dependencies` | `visibleOn` | `dependencies` + `oneOf` | `visible` 条件对象 |
| **f 依赖 a 配置** | `x-reactions` + `$deps` | `visibleOn` + `requiredOn` | `oneOf` 分支 | `visible` + `validation.required` 条件 |
| **e 选项依赖 d** | `x-reactions` + `componentProps.options` | 同名字段切换 / `source` 远程 | **需自定义 Widget** | `reactions` 副作用 |
| **联动表达力** | ★★★★★ | ★★★★ | ★★ | ★★★★★ |
| **代码量** | 中 | 少 | 多 | 中 |
| **可读性** | 中 | 高 | 低 | 高 |
| **性能** | ★★★★★ | ★★★★ | ★★★ | ★★★★★ |
| **生态** | ★★★★★ | ★★★★★ | ★★★★ | ★ |

### 关键结论

1. **RJSF 不适合复杂联动场景**——它的 `dependencies` 只能控制字段存在性和必填性，选项联动需要自定义 Widget
2. **Amis 最易上手**——`visibleOn` / `requiredOn` 一看就懂，但选项联动用同名字段切换是 trick
3. **Formily 表达力最强**——`x-reactions` 的 `when/fulfill/otherwise` 三段式可以覆盖所有联动类型
4. **自研方案可以兼得**——借鉴 Formily 的 Reaction 模式 + Amis 的简洁条件语法，编译期构建依赖图保证性能
