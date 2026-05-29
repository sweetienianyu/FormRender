import type { ComponentType } from 'react'

export interface ComponentDefinition {
  component: ComponentType<any>
  defaultProps?: Record<string, any>
  valueProp?: string
  onChangeProp?: string
  transformValue?: (value: any) => any
  transformChange?: (event: any) => any
}

export class ComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map()

  register(type: string, definition: ComponentDefinition): void {
    this.components.set(type, definition)
  }

  registerMany(definitions: Record<string, ComponentDefinition>): void {
    for (const [type, def] of Object.entries(definitions)) {
      this.register(type, def)
    }
  }

  resolve(type: string): ComponentDefinition | null {
    return this.components.get(type) || null
  }

  override(type: string, definition: ComponentDefinition): void {
    this.components.set(type, definition)
  }

  has(type: string): boolean {
    return this.components.has(type)
  }

  getAllTypes(): string[] {
    return Array.from(this.components.keys())
  }
}

export const globalRegistry = new ComponentRegistry()
