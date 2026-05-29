import React from 'react'

export const Input: React.FC<{
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  style?: React.CSSProperties
}> = ({ value, onChange, disabled, readOnly, placeholder, style }) => {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '6px 12px',
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        fontSize: 14,
        outline: 'none',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  )
}

export const InputNumber: React.FC<{
  value?: number
  onChange?: (value: number) => void
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  min?: number
  max?: number
  style?: React.CSSProperties
}> = ({ value, onChange, disabled, readOnly, placeholder, min, max, style }) => {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value
        onChange?.(v === '' ? undefined! : Number(v))
      }}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      min={min}
      max={max}
      style={{
        width: '100%',
        padding: '6px 12px',
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        fontSize: 14,
        outline: 'none',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  )
}

export const Select: React.FC<{
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  readOnly?: boolean
  options?: Array<{ label: string; value: string }>
  placeholder?: string
  style?: React.CSSProperties
}> = ({ value, onChange, disabled, readOnly, options = [], placeholder, style }) => {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '6px 12px',
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        fontSize: 14,
        outline: 'none',
        boxSizing: 'border-box',
        backgroundColor: disabled ? '#f5f5f5' : '#fff',
        ...style,
      }}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export const Checkbox: React.FC<{
  value?: boolean
  onChange?: (value: boolean) => void
  disabled?: boolean
  readOnly?: boolean
  label?: string
  style?: React.CSSProperties
}> = ({ value, onChange, disabled, readOnly, label, style }) => {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}>
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        readOnly={readOnly}
      />
      {label && <span style={{ fontSize: 14 }}>{label}</span>}
    </label>
  )
}

export const Switch: React.FC<{
  value?: boolean
  onChange?: (value: boolean) => void
  disabled?: boolean
  readOnly?: boolean
  style?: React.CSSProperties
}> = ({ value, onChange, disabled, readOnly, style }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!value}
      onClick={() => {
        if (!disabled && !readOnly) onChange?.(!value)
      }}
      disabled={disabled}
      style={{
        width: 44,
        height: 22,
        borderRadius: 11,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundColor: value ? '#1890ff' : '#ccc',
        position: 'relative',
        transition: 'background-color 0.2s',
        padding: 0,
        ...style,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: value ? 22 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          backgroundColor: '#fff',
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}

export const DatePicker: React.FC<{
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  style?: React.CSSProperties
}> = ({ value, onChange, disabled, readOnly, placeholder, style }) => {
  return (
    <input
      type="date"
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '6px 12px',
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        fontSize: 14,
        outline: 'none',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  )
}

export const Textarea: React.FC<{
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  rows?: number
  style?: React.CSSProperties
}> = ({ value, onChange, disabled, readOnly, placeholder, rows = 3, style }) => {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%',
        padding: '6px 12px',
        border: '1px solid #d9d9d9',
        borderRadius: 6,
        fontSize: 14,
        outline: 'none',
        boxSizing: 'border-box',
        resize: 'vertical',
        ...style,
      }}
    />
  )
}
