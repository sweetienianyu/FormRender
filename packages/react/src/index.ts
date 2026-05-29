export { FormRenderer } from './renderer'
export { FormContext, useFormContext } from './context'
export { ComponentRegistry, globalRegistry } from './registry'
export { useFieldState, useFormState } from './hooks'
export {
  Input,
  InputNumber,
  Select,
  Checkbox,
  Switch,
  DatePicker,
  Textarea,
} from './components'

import { globalRegistry } from './registry'
import {
  Input,
  InputNumber,
  Select,
  Checkbox,
  Switch,
  DatePicker,
  Textarea,
} from './components'

export function registerDefaultComponents(): void {
  globalRegistry.registerMany({
    Input: { component: Input },
    InputNumber: { component: InputNumber },
    Select: { component: Select },
    Checkbox: { component: Checkbox },
    Switch: { component: Switch },
    DatePicker: { component: DatePicker },
    Textarea: { component: Textarea },
  })
}

registerDefaultComponents()
