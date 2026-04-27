"use client"

import { useExampleStore } from "@/store/example-store"

export function DemoCounter() {
  const { count, increment, decrement, reset } = useExampleStore()

  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-lg border bg-card">
      <h2 className="text-2xl font-bold">Zustand Counter</h2>
      <p className="text-4xl font-mono">{count}</p>
      <div className="flex gap-2">
        <button
          onClick={decrement}
          className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80"
        >
          -1
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-md bg-muted hover:bg-muted/80"
        >
          Reset
        </button>
        <button
          onClick={increment}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          +1
        </button>
      </div>
    </div>
  )
}
