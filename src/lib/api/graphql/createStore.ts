// 🫙 Store is a Jar, with States inside

// ** "apollo-reactive-store": "0.0.4"
import { makeVar, ReactiveVar, useReactiveVar } from '@apollo/client'

// ** HELPER Components
import ccm from '#/lib/utils/console-colors'

type State<T> = Record<string | symbol, T>
type Store<T> = Record<string | symbol, ReactiveVar<T>>

type TypePolicies = {
  Query: {
    fields: {
      [key: string]: {
        read(): any
      }
    }
  }
}

type Updater<Value> = (state: Value) => Value | Value

export interface StoreApi<Value> {
  getState<T>(store: string | symbol): Object
  get<T>(key: string | symbol): Value
  update<StateSlice>(key: string | symbol, value: Updater<Value>): Value
  useStore<T>(key: string | symbol): Value
  getTypePolicies(): TypePolicies
  reset(): void
}

export default function create<Value> (
  initialState: State<Value>,
  options = { debug: true }
): StoreApi<Value> {

  // ** CREATE STORE SINGLETON
  const createStore = () => {
    return Object.keys(initialState).reduce<Store<Value>>((sum, key) => {
      return {
        ...sum,
        [key]: makeVar<Value>(initialState[key]),
      }
    }, {})
  }

  // ** CREATE AN INSTANCE OF STORE
  let store = createStore()

  // DEBUGGING
  if (options.debug) {
    // console.debug(`store`, store)
    // console.debug(`initialState`, initialState)
    // console.debug(`initialState._type`, initialState._type)
    if (initialState._type === 'scene') {
      // returns Object {fields}
      const fields: Object | any = {} // starts blank
      const keys: string[] = Object.keys(store)
      // console.debug('keys', keys)
      keys.forEach((key: string, index: number) => {
        fields[key] = store[key]()
        // console.debug(`${index}: ${key}: ${store[key]()} = ${fields[key]}`)
      })

      // returns Array of Objects {fields}[]
      // const fields = Object.keys(store).map((key: string) => {
      //   return { [key]: store[key]() }
      // })

      // not working here, for reference only
      // returns Array of Objects {fields}[]
      // const fields = Object.keys(store).reduce((sum, key) => {
      //   return {
      //     ...sum,
      //     [key]: {
      //       read() {
      //         return store[key]()
      //       },
      //     },
      //   }
      // })

      // console.debug(`${initialState._type}Store current state {fields}`, fields)
      // console.debug('%c🫙====================================', ccm5)
    }
  }

  const debug = (key: string, value: Updater<Value>): void => {
    if (options.debug) {
      // console.debug(`%c🫙===================================================`, ccm.blueAlert)
      // console.debug(`store update(key) "${key}" with value: ${JSON.stringify(value)}`)
      console.debug(`%c🫙 store update(key) "${key}"`, ccm.blueAlert, value)
      // console.debug(`%c🫙===================================================`, ccm.blueAlert)
    }
  }

  return {
    getState(): Object {
      // returns Object {fields}
      const fields: Object | any = {} // starts blank
      const keys: string[] = Object.keys(store)
      // console.debug('keys', keys)
      keys.forEach((key: string, index: number) => {
        fields[key] = store[key]()
        // console.debug(`${index}: ${key}: ${store[key]()} = ${fields[key]}`)
      })

      if (!fields) {
        throw new Error(`store getState(): "${JSON.stringify(store)}" is invalid`, store)
      }

      // console.debug(`%c🫙===================================================`, ccm.blueAlert)
      console.debug(`%c🫙 store getState(): {fields}`, ccm.blueAlert, fields)
      // console.debug(`%c🫙===================================================`, ccm.blueAlert)
      return fields
    },
    get(key: string) {
      const reactiveVar = store[key]

      if (!reactiveVar) {
        throw new Error(`store get(key) "${key}" is invalid`)
      }

      return reactiveVar()
    },
    update(key: string, value) {
      const reactiveVar = store[key]

      if (!reactiveVar) {
        throw new Error(`store update(key) "${key}" is invalid`)
      }

      debug(key, value)

      if (value instanceof Function) {
        return reactiveVar(value(reactiveVar()))
      } else {
        return reactiveVar(value)
      }
    },
    useStore(key: string) {
      const reactiveVar = store[key]

      if (!reactiveVar) {
        throw new Error(`useStore: key "${key}" is invalid`)
      }

      return useReactiveVar(reactiveVar)
    },
    getTypePolicies() {
      return {
        Query: {
          fields: Object.keys(store).reduce((sum, key) => {
            return {
              ...sum,
              [key]: {
                read() {
                  return store[key]()
                },
              },
            }
          }, {}),
        },
      }
    },
    reset: () => {
      store = createStore()
    },
  }
}
