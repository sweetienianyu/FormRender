export type { Unsubscribe, FieldListener, FormListener, FormEvent } from './state'
export type { FormState, FieldState } from './state'
export { createInitialFormState, createInitialFieldState } from './state'

export type EventHandler = (...args: any[]) => void

export class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map()

  on(event: string, handler: EventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)
    return () => {
      this.listeners.get(event)?.delete(handler)
    }
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      for (const handler of handlers) {
        handler(...args)
      }
    }
  }

  removeAll(): void {
    this.listeners.clear()
  }
}
