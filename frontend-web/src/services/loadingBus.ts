type Listener = (pending: number) => void

let pending = 0
const listeners = new Set<Listener>()

const emit = () => {
  for (const l of listeners) l(pending)
}

export const loadingBus = {
  start: () => {
    pending += 1
    emit()
  },
  end: () => {
    pending = Math.max(0, pending - 1)
    emit()
  },
  subscribe: (listener: Listener) => {
    listeners.add(listener)
    listener(pending)
    return () => {
      listeners.delete(listener)
    }
  },
}
