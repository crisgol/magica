import { Emitter } from 'misc-utils-of-mine-generic'
import { State } from './state'

class Store extends Emitter<{ oldState: State, partial: Partial<State>, newState: State }> {
  constructor(protected state: State) {
    super()
  }

  get(s: string): any {
    return (this.state as any)[s]
  }

  setState(state: Partial<State>) {
    const oldState = this.state
    this.state = { ...this.state, ...state }
    requestAnimationFrame(() => this.emit({ oldState, partial: state, newState: this.state }))
  }

  getState() {
    return this.state
  }
}

let store: Store

export function getStore() {
  return store
}
export function getState() {
  return store.getState()
}
export function _setStore(s: State, silently = true) {
  store = new Store(s)
}
