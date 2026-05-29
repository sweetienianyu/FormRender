import React, { useState } from 'react'
import type { FormSchema, FormState } from '@form-render/core'
import { compile } from '@form-render/core'
import { FormRenderer } from '@form-render/react'

const linkageSchema: FormSchema = {
  version: '1.0',
  type: 'object',
  properties: {
    a: {
      type: 'string',
      title: '用户类型 (a)',
      ui: {
        component: 'Select',
        props: {
          placeholder: '请选择用户类型',
          options: [
            { label: '配置X', value: 'configX' },
            { label: '配置Y', value: 'configY' },
          ],
        },
      },
      validation: { required: true },
    },
    b: {
      type: 'string',
      title: '子类型 (b)',
      ui: {
        component: 'Select',
        props: {
          placeholder: '请选择子类型',
          options: [
            { label: '选项1', value: 'opt1' },
            { label: '选项2', value: 'opt2' },
          ],
        },
      },
    },
    c: {
      type: 'string',
      title: '备注 (c) — b 为"选项1"时显示',
      ui: { component: 'Input', props: { placeholder: '只有 b=opt1 时才可见' } },
      visible: { type: 'eq', field: 'b', value: 'opt1' },
    },
    d: {
      type: 'boolean',
      title: '启用高级选项 (d)',
      ui: { component: 'Checkbox', props: { label: '启用' } },
    },
    e: {
      type: 'string',
      title: '选项 (e) — d 勾选时展示高级选项',
      ui: { component: 'Select', props: { placeholder: '请选择选项' } },
      reactions: [
        {
          when: { type: 'eq', field: 'd', value: true },
          fulfill: {
            state: {
              'ui.props.options': [
                { label: '高级选项1', value: 'adv1' },
                { label: '高级选项2', value: 'adv2' },
              ],
            },
          },
          otherwise: {
            state: {
              'ui.props.options': [
                { label: '普通选项', value: 'normal' },
              ],
            },
          },
        },
      ],
    },
    f: {
      type: 'string',
      title: '配置X专属字段 (f) — a 为"配置X"时显示且必填',
      ui: { component: 'Input', props: { placeholder: '只有 a=configX 时才可见且必填' } },
      visible: { type: 'eq', field: 'a', value: 'configX' },
      validation: {
        required: { type: 'eq', field: 'a', value: 'configX' },
      },
    },
  },
}

const cascadeSchema: FormSchema = {
  version: '1.0',
  type: 'object',
  properties: {
    country: {
      type: 'string',
      title: '国家',
      ui: {
        component: 'Select',
        props: {
          placeholder: '请选择国家',
          options: [
            { label: '中国', value: 'CN' },
            { label: '美国', value: 'US' },
            { label: '日本', value: 'JP' },
          ],
        },
      },
    },
    province: {
      type: 'string',
      title: '省份',
      ui: { component: 'Select', props: { placeholder: '请先选择国家' } },
      visible: { type: 'eq', field: 'country', value: 'CN' },
      reactions: [
        {
          when: { type: 'eq', field: 'country', value: 'CN' },
          fulfill: {
            state: {
              'ui.props.options': [
                { label: '广东省', value: 'GD' },
                { label: '浙江省', value: 'ZJ' },
                { label: '江苏省', value: 'JS' },
                { label: '四川省', value: 'SC' },
              ],
            },
          },
        },
      ],
    },
    city: {
      type: 'string',
      title: '城市',
      ui: { component: 'Select', props: { placeholder: '请先选择省份' } },
      visible: { type: 'exists', field: 'province' },
      reactions: [
        {
          when: { type: 'eq', field: 'province', value: 'GD' },
          fulfill: {
            state: {
              'ui.props.options': [
                { label: '广州', value: 'GZ' },
                { label: '深圳', value: 'SZ' },
                { label: '东莞', value: 'DG' },
              ],
            },
          },
          otherwise: {
            state: {
              'ui.props.options': [
                { label: '杭州', value: 'HZ' },
                { label: '宁波', value: 'NB' },
                { label: '南京', value: 'NJ' },
                { label: '苏州', value: 'SZH' },
                { label: '成都', value: 'CD' },
                { label: '绵阳', value: 'MY' },
              ],
            },
          },
        },
      ],
    },
    stateUS: {
      type: 'string',
      title: 'State',
      ui: { component: 'Select', props: { placeholder: 'Select a state' } },
      visible: { type: 'eq', field: 'country', value: 'US' },
      reactions: [
        {
          when: { type: 'eq', field: 'country', value: 'US' },
          fulfill: {
            state: {
              'ui.props.options': [
                { label: 'California', value: 'CA' },
                { label: 'New York', value: 'NY' },
                { label: 'Texas', value: 'TX' },
              ],
            },
          },
        },
      ],
    },
    prefecture: {
      type: 'string',
      title: '都道府県',
      ui: { component: 'Select', props: { placeholder: '選択してください' } },
      visible: { type: 'eq', field: 'country', value: 'JP' },
      reactions: [
        {
          when: { type: 'eq', field: 'country', value: 'JP' },
          fulfill: {
            state: {
              'ui.props.options': [
                { label: '東京都', value: 'TK' },
                { label: '大阪府', value: 'OS' },
                { label: '京都府', value: 'KY' },
              ],
            },
          },
        },
      ],
    },
  },
}

const multiConditionSchema: FormSchema = {
  version: '1.0',
  type: 'object',
  properties: {
    orderType: {
      type: 'string',
      title: '订单类型',
      ui: {
        component: 'Select',
        props: {
          options: [
            { label: '普通订单', value: 'normal' },
            { label: '紧急订单', value: 'urgent' },
            { label: 'VIP 订单', value: 'vip' },
          ],
        },
      },
    },
    amount: {
      type: 'number',
      title: '金额',
      ui: { component: 'InputNumber', props: { placeholder: '请输入金额', min: 0 } },
    },
    isUrgent: {
      type: 'boolean',
      title: '是否加急',
      ui: { component: 'Switch' },
    },
    urgentReason: {
      type: 'string',
      title: '加急原因',
      ui: { component: 'Textarea', props: { placeholder: '请说明加急原因', rows: 2 } },
      visible: { type: 'eq', field: 'isUrgent', value: true },
      validation: {
        required: { type: 'eq', field: 'isUrgent', value: true },
      },
    },
    approvalLevel: {
      type: 'string',
      title: '审批级别',
      ui: { component: 'Select', props: { placeholder: '自动判定' } },
      visible: { type: 'exists', field: 'amount' },
      reactions: [
        {
          when: { type: 'and', conditions: [
            { type: 'eq', field: 'orderType', value: 'urgent' },
            { type: 'gt', field: 'amount', value: 10000 },
          ]},
          fulfill: {
            state: {
              'ui.props.options': [
                { label: 'CEO 审批', value: 'ceo' },
                { label: '董事会审批', value: 'board' },
              ],
            },
          },
          otherwise: {
            state: {
              'ui.props.options': [
                { label: '主管审批', value: 'manager' },
                { label: '总监审批', value: 'director' },
              ],
            },
          },
        },
      ],
    },
    vipDiscount: {
      type: 'string',
      title: 'VIP 折扣',
      ui: {
        component: 'Select',
        props: {
          options: [
            { label: '9 折', value: '0.9' },
            { label: '8 折', value: '0.8' },
            { label: '7 折', value: '0.7' },
          ],
        },
      },
      visible: { type: 'eq', field: 'orderType', value: 'vip' },
    },
    remarks: {
      type: 'string',
      title: '备注',
      ui: { component: 'Textarea', props: { placeholder: '选填', rows: 2 } },
    },
  },
}

const disabledAndReadonlySchema: FormSchema = {
  version: '1.0',
  type: 'object',
  properties: {
    mode: {
      type: 'string',
      title: '表单模式',
      ui: {
        component: 'Select',
        props: {
          options: [
            { label: '编辑模式', value: 'edit' },
            { label: '只读模式', value: 'readonly' },
            { label: '审核模式', value: 'review' },
          ],
        },
      },
    },
    name: {
      type: 'string',
      title: '姓名',
      ui: { component: 'Input', props: { placeholder: '请输入姓名' } },
      readonly: { type: 'eq', field: 'mode', value: 'readonly' },
      validation: { required: true },
    },
    department: {
      type: 'string',
      title: '部门',
      ui: {
        component: 'Select',
        props: {
          options: [
            { label: '技术部', value: 'tech' },
            { label: '产品部', value: 'product' },
            { label: '设计部', value: 'design' },
          ],
        },
      },
      disabled: { type: 'eq', field: 'mode', value: 'review' },
    },
    sameAsAbove: {
      type: 'boolean',
      title: '与姓名相同',
      ui: { component: 'Checkbox', props: { label: '联系人姓名与姓名相同' } },
    },
    contactName: {
      type: 'string',
      title: '联系人姓名',
      ui: { component: 'Input', props: { placeholder: '请输入联系人姓名' } },
      disabled: { type: 'eq', field: 'sameAsAbove', value: true },
    },
  },
}

function generateLargeSchema(fieldCount: number): FormSchema {
  const properties: Record<string, any> = {}
  for (let i = 0; i < fieldCount; i++) {
    const hasLinkage = i > 0 && i % 5 === 0
    properties[`field_${i}`] = {
      type: 'string',
      title: `字段 ${i}${hasLinkage ? ' (依赖 field_0)' : ''}`,
      ui: { component: i % 3 === 0 ? 'Select' : 'Input', props: i % 3 === 0 ? {
        options: [
          { label: '选项A', value: 'a' },
          { label: '选项B', value: 'b' },
          { label: '选项C', value: 'c' },
        ],
      } : { placeholder: `请输入字段 ${i}` } },
      ...(hasLinkage ? { visible: { type: 'eq', field: 'field_0', value: 'a' } } : {}),
      ...(i === 0 ? { validation: { required: true } } : {}),
    }
  }
  return { version: '1.0', type: 'object', properties }
}

const DEMOS = [
  { key: 'linkage', label: '基础联动链', schema: linkageSchema, desc: 'a→b→c(显隐) / d→e(选项) / a→f(显隐+必填)' },
  { key: 'cascade', label: '级联选择', schema: cascadeSchema, desc: '国家→省/州→城市，三级联动' },
  { key: 'multi', label: '多条件联动', schema: multiConditionSchema, desc: 'AND 条件组合 + 条件必填 + 条件显隐' },
  { key: 'disabled', label: '禁用/只读联动', schema: disabledAndReadonlySchema, desc: '模式切换控制 readonly/disabled' },
  { key: 'perf50', label: '性能测试 (50字段)', schema: generateLargeSchema(50), desc: '50 字段，10 个联动字段' },
  { key: 'perf200', label: '性能测试 (200字段)', schema: generateLargeSchema(200), desc: '200 字段，40 个联动字段' },
  { key: 'perf500', label: '性能测试 (500字段)', schema: generateLargeSchema(500), desc: '500 字段，100 个联动字段' },
]

function DebugPanel({ formState }: { formState: FormState }) {
  return (
    <div
      style={{
        marginTop: 24,
        padding: 16,
        backgroundColor: '#f6f8fa',
        borderRadius: 8,
        fontSize: 13,
        fontFamily: 'monospace',
      }}
    >
      <h3 style={{ margin: '0 0 12px 0', fontSize: 15 }}>实时状态</h3>
      <div style={{ marginBottom: 8 }}>
        <strong>values:</strong>
        <pre style={{ margin: 4, whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
          {JSON.stringify(formState.values, null, 2)}
        </pre>
      </div>
      <div style={{ marginBottom: 8 }}>
        <strong>errors:</strong>
        <pre style={{ margin: 4, whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(formState.errors, null, 2)}
        </pre>
      </div>
      <div>
        <strong>status:</strong> {formState.status}
      </div>
    </div>
  )
}

function PerfPanel({ schema }: { schema: FormSchema }) {
  const [result, setResult] = useState<string>('')

  const runBenchmark = () => {
    const memBefore = (performance as any).memory?.usedJSHeapSize

    const compileTimes: number[] = []
    const iterations = 100

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      compile(schema)
      compileTimes.push(performance.now() - start)
    }

    const avgCompile = compileTimes.reduce((a, b) => a + b, 0) / iterations
    const maxCompile = Math.max(...compileTimes)
    const minCompile = Math.min(...compileTimes)

    const fieldCount = Object.keys(schema.properties).length

    const memAfter = (performance as any).memory?.usedJSHeapSize
    const memDelta = memAfter && memBefore ? ((memAfter - memBefore) / 1024).toFixed(1) : 'N/A'

    setResult(
      `字段数: ${fieldCount}\n` +
      `编译 ${iterations} 次统计:\n` +
      `  平均: ${avgCompile.toFixed(3)}ms\n` +
      `  最小: ${minCompile.toFixed(3)}ms\n` +
      `  最大: ${maxCompile.toFixed(3)}ms\n` +
      `  首次: ${compileTimes[0].toFixed(3)}ms\n` +
      `  稳态(后50次平均): ${(compileTimes.slice(50).reduce((a, b) => a + b, 0) / 50).toFixed(3)}ms\n` +
      `内存增量: ${memDelta} KB\n` +
      `\n结论: ${avgCompile < 16 ? '✅ 编译耗时远低于一帧(16ms)，不会造成卡顿' : avgCompile < 50 ? '⚠️ 编译耗时接近一帧，大型 Schema 建议缓存编译结果' : '❌ 编译耗时超过一帧，必须异步编译或缓存'}`
    )
  }

  return (
    <div style={{ marginTop: 16, padding: 16, backgroundColor: '#fff8e1', borderRadius: 8 }}>
      <button
        onClick={runBenchmark}
        style={{
          padding: '8px 16px',
          backgroundColor: '#ff9800',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        运行编译性能基准测试
      </button>
      {result && (
        <pre style={{ marginTop: 12, whiteSpace: 'pre-wrap', fontSize: 13, fontFamily: 'monospace' }}>
          {result}
        </pre>
      )}
    </div>
  )
}

export default function App() {
  const [activeDemo, setActiveDemo] = useState('linkage')
  const [formState, setFormState] = useState<FormState | null>(null)

  const current = DEMOS.find((d) => d.key === activeDemo)!

  const handleSubmit = (values: Record<string, any>) => {
    alert('提交成功!\n' + JSON.stringify(values, null, 2))
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>FormRender Playground</h1>
      <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>
        协议驱动 + 编译型中间层的表单生成器
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {DEMOS.map((demo) => (
          <button
            key={demo.key}
            onClick={() => { setActiveDemo(demo.key); setFormState(null) }}
            style={{
              padding: '6px 14px',
              border: activeDemo === demo.key ? '2px solid #1890ff' : '1px solid #d9d9d9',
              borderRadius: 6,
              backgroundColor: activeDemo === demo.key ? '#e6f7ff' : '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activeDemo === demo.key ? 600 : 400,
              color: activeDemo === demo.key ? '#1890ff' : '#333',
            }}
          >
            {demo.label}
          </button>
        ))}
      </div>

      <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>{current.desc}</p>

      <FormRenderer
        key={activeDemo}
        schema={current.schema}
        onSubmit={handleSubmit}
        onFormStateChange={setFormState}
        style={{
          padding: 24,
          border: '1px solid #e8e8e8',
          borderRadius: 8,
          backgroundColor: '#fff',
          maxHeight: current.key.startsWith('perf') ? 500 : undefined,
          overflow: current.key.startsWith('perf') ? 'auto' : undefined,
        }}
      />

      {formState && <DebugPanel formState={formState} />}

      {current.key.startsWith('perf') && <PerfPanel schema={current.schema} />}
    </div>
  )
}
