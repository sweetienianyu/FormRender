export class DependencyGraph {
  private forward: Map<string, Set<string>> = new Map()
  private backward: Map<string, Set<string>> = new Map()

  addDependency(from: string, to: string): void {
    if (!this.forward.has(from)) this.forward.set(from, new Set())
    this.forward.get(from)!.add(to)

    if (!this.backward.has(to)) this.backward.set(to, new Set())
    this.backward.get(to)!.add(from)
  }

  getDependents(field: string): Set<string> {
    return this.forward.get(field) || new Set()
  }

  getDependencies(field: string): Set<string> {
    return this.backward.get(field) || new Set()
  }

  getAllNodes(): string[] {
    const nodes = new Set<string>()
    for (const key of this.forward.keys()) nodes.add(key)
    for (const key of this.backward.keys()) nodes.add(key)
    return Array.from(nodes)
  }

  detectCycles(): string[][] | null {
    const visited = new Set<string>()
    const stack = new Set<string>()
    const cycles: string[][] = []

    const dfs = (node: string, path: string[]) => {
      if (stack.has(node)) {
        const cycleStart = path.indexOf(node)
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart).concat(node))
        }
        return
      }
      if (visited.has(node)) return

      visited.add(node)
      stack.add(node)

      const deps = this.forward.get(node)
      if (deps) {
        for (const dep of deps) {
          dfs(dep, [...path, node])
        }
      }

      stack.delete(node)
    }

    for (const node of this.getAllNodes()) {
      dfs(node, [])
    }

    return cycles.length > 0 ? cycles : null
  }

  topologicalSort(): string[] {
    const inDegree = new Map<string, number>()
    const allNodes = this.getAllNodes()

    for (const node of allNodes) {
      inDegree.set(node, 0)
    }

    for (const [, deps] of this.forward) {
      for (const dep of deps) {
        inDegree.set(dep, (inDegree.get(dep) || 0) + 1)
      }
    }

    const queue: string[] = []
    for (const [node, degree] of inDegree) {
      if (degree === 0) queue.push(node)
    }

    const result: string[] = []
    while (queue.length > 0) {
      const node = queue.shift()!
      result.push(node)

      const deps = this.forward.get(node)
      if (deps) {
        for (const dep of deps) {
          const newDegree = (inDegree.get(dep) || 1) - 1
          inDegree.set(dep, newDegree)
          if (newDegree === 0) queue.push(dep)
        }
      }
    }

    return result
  }
}
