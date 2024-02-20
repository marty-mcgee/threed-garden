// ==========================================================
// RESOURCES

// ** Apollo Client 3 -- Cache Store Imports
import create, { StoreApi } from '#/lib/api/graphql/createStore'

// ** GraphQL Queries + Mutations (here, locally-specific data needs)
import GetNouns from '#/lib/api/graphql/scripts/getNouns.gql'
import GetProjects from '#/lib/api/graphql/scripts/getProjects.gql'
import GetThreeDProjects from '#/lib/api/graphql/scripts/GetThreeDProjects.gql'
import GetPlans from '#/lib/api/graphql/scripts/getPlans.gql'
import GetWorkspaces from '#/lib/api/graphql/scripts/getWorkspaces.gql'
import GetThreeDs from '#/lib/api/graphql/scripts/getThreeDs.gql'
import GetFiles from '#/lib/api/graphql/scripts/getFiles.gql'
import GetScenes from '#/lib/api/graphql/scripts/getScenes.gql'
import GetAllotments from '#/lib/api/graphql/scripts/getAllotments.gql'
import GetBeds from '#/lib/api/graphql/scripts/getBeds.gql'
import GetPlants from '#/lib/api/graphql/scripts/getPlants.gql'
import GetPlantingPlans from '#/lib/api/graphql/scripts/getPlantingPlans.gql'

// ** UUID Imports
import { v4 as newUUID } from 'uuid'

// [MM] COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'
// console.debug(`%cSUCCESS!!`, ccm.orange)
// console.debug(`%cWHOOPSIES`, ccm.red)

// ==========================================================
// IMPORTS COMPLETE
console.debug(`%c🥕 ThreeDGarden<FC,R3F>: {stores}`, ccm.yellow)
console.debug(`%c====================================`, ccm.blue)

// ==============================================================
// ==============================================================
// ==============================================================
// ** Noun Types + Interfaces

// {one}
interface INoun {
  _id: string
  _ts: string
  _type: string
  _name: string
  data: Object
  layers: Object[]
  layer: Object
}

// [all]
interface INouns {
  nouns: Array<INoun>
}

interface INounStore {
  // params
  _type: string
  _plural: string
  _storageItem: string
  // store
  store: any
  // store.store
  nounStore: (_type?: string) => boolean
  projectStore: StoreApi<any>
  workspaceStore: StoreApi<any>
  planStore: StoreApi<any>
  threedStore: StoreApi<any>
  fileStore: StoreApi<any>
  sceneStore: StoreApi<any>
  allotmentStore: StoreApi<any>
  bedStore: StoreApi<any>
  plantStore: StoreApi<any>
  plantingPlanStore: StoreApi<any>
  bearStore: StoreApi<any>
  modalStore: (_type?: string) => void
  modalAboutStore: StoreApi<any>
  modalModel3dStore: StoreApi<any>
  modalLoadingStore: StoreApi<any>
  modalShareStore: StoreApi<any>
  modalStoreNoun: StoreApi<any>
  // store.actions
  actions: any
}

// ** Noun Object -- Constructor Function
// -- returns new noun

function noun(this: INoun, _type: string = 'noun') {
  // object params
  this._id = newUUID()
  this._ts = new Date().toISOString()
  this._type = _type.toLowerCase()
  this._name = _type.toUpperCase() + ' 0'
  // wp custom fields
  this.data = {}
  // layers/levels
  this.layers = []
  this.layer = {
    _name: 'LAYER 0',
    data: {},
  }
}

// ==============================================================
// ==============================================================
// ==============================================================
// ** Noun Store -- Constructor Function
// -- returns new (nounStore as any)

function nounStore(this: INounStore, _type = 'noun') {
  // store params
  this._type = _type.toLowerCase()
  this._plural = _type + 's'
  this._storageItem = 'threed_' + _type + 'History'

  // ==============================================================
  // ** Noun Store .store
  // -- returns Object of Functions (ac3 reactive vars)

  this.store = create({
    _id: newUUID(),
    _ts: new Date().toISOString(),
    _type: this._type,
    count: 0, // example counter (for fun/learning)
    all: [], // all of this nouns historical + current records (all scenes, all projects)
    one: new (noun as any)(this._type), // {}, // the current workspace noun, aka 'this one noun'

    // track current noun + noun history
    // current: ^this one noun,
    history: [], // from local storage

    // track payloads from db
    countDB: 0, // example counter (for fun/learning)
    allDB: [], // from db (mysql wordpress via graphql)
    oneDB: {}, // pre-this noun, ready to be mapped to 'this' noun
  })

  // ==============================================================
  // ** Noun Store .actions
  // -- returns Object of Functions

  this.actions = {
    isVisible: () => {
      return (state: any): boolean => state
    },

    toggleIsVisible: () => {
      return (state: any): boolean => !state
    },

    increaseCount: (n = 1) => {
      return (state: any): number => state + n
    },

    decreaseCount: (n = 1) => {
      return (state: any): number => state - n
    },

    // redundant (but useful ???)
    getState: (): Object => {
      return this.store.getState()
    },

    removeAll: (): void => {
      localStorage.removeItem(this._storageItem)
      this.store.update('all', [])
      this.store.update('one', {})
      this.store.update('count', 0)
      this.store.update('allDB', [])
      this.store.update('oneDB', {})
      this.store.update('countDB', 0)
      console.debug(`%cremoveAll [${this._type}]`, ccm.red, true)
    },

    // add a new current 'this' noun
    addNew: () => {
      // console.debug(`this`, this)
      console.debug(`%caddNew [${this._type}] (before)`, ccm.orange, this.store.get('all'))
      // throw new Error(`[MM] testing... this`)

      // create a new one
      if (Object.keys(this.store.get('one')).length === 0) {
        try {
          this.store.update('one', new (noun as any)(this._type))
        } catch (err) {
          console.error(`%caddNew {${this._type}} err`, err)
        }
      }
      // save + update old one
      else {
        // nounHistory (save existing before mutating, if not empty)
        this.store.update('all', [this.store.get('one'), ...this.store.get('all')])
        console.debug(`%caddNew [${this._type}] (during)`, ccm.orange, this.store.get('all'))

        // count
        // this.store.update('count', this.store.get('count') + 1) // manual
        this.store.update('count', this.store.get('all').length) // automatic
        // console.debug(`%caddNew {count}`, ccm.green, this.store.get('count'))
        // console.debug(`%caddNew [${this._type}]`, ccm.green, this.store.get('all').length)

        // nounCurrent (overwrite this one -- mutate)
        this.store.update('one', {
          _id: newUUID(),
          _ts: new Date().toISOString(),
          _type: _type.toLowerCase(),
          _name: _type.toUpperCase() + ' 1',
          layers: [],
          layer: {
            _name: 'LAYER 0',
            data: {},
          },
        })
      }
      console.debug(`%caddNew {${this._type}} (added)`, ccm.orange, this.store.get('one'))

      // nounHistory (save recently mutated new one and all old ones)
      this.store.update('all', [this.store.get('one'), ...this.store.get('all')])
      console.debug(`%caddNew [${this._type}] (after)`, ccm.orange, this.store.get('all'))

      // count (for fun/learning)
      // this.store.update('count', this.store.get('count') + 1) // manual
      this.store.update('count', this.store.get('all').length) // automatic
      console.debug(`%caddNew {count}`, ccm.green, this.store.get('count'))
      // console.debug(`%caddNew {${this._type}}`, ccm.green, this.store.get('all').length)

      // saveToDisk
      this.actions.saveToDisk()
      // loadFromDisk
      // this.actions.loadFromDisk()

      console.debug(`%caddNew [${this._type}] (final)`, ccm.orange, this.store.get('one'))
    },

    save: () => {
      // saveToDisk
      this.actions.saveToDisk()
      // saveToDB (coming soon !!!)
      // this.actions.saveToDB()
    },

    // save data to browser local storage
    saveToDisk: () => {
      try {
        localStorage.setItem(
          this._storageItem,
          JSON.stringify({
            subject: this._plural,
            payload: this.store.get('all'),
          })
        )
        console.debug(`%csaveToDisk [${this._type}]`, ccm.orange, this.store.get('all'))
        return true
      } catch (err) {
        console.debug(`%csaveToDisk [${this._type}] err`, ccm.red, err)
        return false
      }
    },

    // get data from browser local storage
    loadFromDisk: () => {
      try {
        const query = JSON.parse(localStorage.getItem(this._storageItem))
        if (query) {
          console.debug(`%cloadFromDisk [${this._type}] QUERY?`, ccm.green, query)
          const { payload } = query
          console.debug(`%cloadFromDisk [${this._type}] QUERY.PAYLOAD?`, ccm.green, payload)

          if (payload.length) {
            // console.debug(`%cloadFromDisk [${this._type}]`, ccm.green, true, payload)

            this.store.update('all', [...payload]) // payload should have .data{}
            console.debug(`%cloadFromDisk [${this._type}s] (after)`, ccm.green, this.store.get('all'))

            this.store.update('one', this.store.get('all')[0])
            console.debug(`%cloadFromDisk {${this._type}} (after)`, ccm.green, this.store.get('one'))

            return true
          } else {
            console.debug(`%cloadFromDisk [${this._type}] EMPTY QUERY.PAYLOAD?`, ccm.green, query)
          }
        } else {
          console.debug(`%cloadFromDisk [${this._type}] NOTHING TO LOAD`, ccm.green, query)
        }
        return false
      } catch (err) {
        console.debug(`%cloadFromDisk [${this._type}] err`, ccm.red, err)
        return false
      }
    },

    // save data to db via graphql mutation
    saveToDB: async (client: any) => {
      try {
        console.debug(`%csaveToDB [${this._type}] client`, ccm.red, client)

        console.debug(`%csaveToDB [${this._type}]`, ccm.red, false)
        return false
      } catch (err) {
        console.debug(`%csaveToDB [${this._type}]: err`, ccm.green, err)
        return false
      }
    },

    // get data from db via graphql query
    loadFromDB: async (client: any) => {
      try {
        // const _this = this
        console.debug(`%cloadFromDB this`, ccm.yellow, this)

        // .gql
        let QUERY = GetNouns
        switch (this._type) {
          case 'noun':
            QUERY = GetNouns
            break
          case 'project':
            QUERY = GetProjects
            break
          case 'workspace':
            QUERY = GetWorkspaces
            break
          case 'plan':
            QUERY = GetPlans
            break
          case 'threed':
            QUERY = GetThreeDs
            break
          case 'file':
            QUERY = GetFiles
            break
          case 'scene':
            QUERY = GetScenes
            break
          case 'allotment':
            QUERY = GetAllotments
            break
          case 'bed':
            QUERY = GetBeds
            break
          case 'plant':
            QUERY = GetPlants
            break
          case 'plantingPlan':
            QUERY = GetPlantingPlans
            break
          // case 'bear':
          //   QUERY = GetBears
          //   break
        }

        const parameters = {
          first: 10,
          last: 0,
          after: 0,
          before: 0,
        }

        // using query hook
        // const {
        //   data,
        //   loading,
        //   error,
        //   fetchMore,
        //   refetch,
        //   networkStatus
        // } = useQuery(QUERY, { parameters }, { client })
        // console.debug(`%cloadFromDB [${this._type}]: DATA RETURNED`, data, loading, error)

        // using query directly
        const query = await client.query({
          query: QUERY,
          variables: { parameters },
        })
        // console.debug(`%cloadFromDB [${this._type}]: QUERY RETURNED`, query)

        const { data, loading, error } = query
        // console.debug(`%cloadFromDB [${this._type}]: DATA RETURNED`, data, loading, error)

        if (loading) {
          console.debug(`%cloadFromDB [${this._type}]: DATA LOADING`, loading)
          return false // <div>loading...</div>
        }

        if (error) {
          console.debug(`%cloadFromDB [${this._type}]: DATA RETURNED with error`, error)
          return false // <div>{JSON.stringify(error.message)}</div>
        }

        if (data) {
          console.debug(`%cloadFromDB [${this._type}]: DATA RETURNED`, ccm.yellow, data, loading, error)

          if (data[this._plural]?.edges?.length) {
            // const payload = data[this._plural].edges
            const payload = data[this._plural].edges.map(
              (node: Object): Object =>
                // nounId, id, uri, slug, title
                // <div key={node.nounId}>
                //   wp nounId: {node.nounId}<br />
                //   gql id: {node.id}<br />
                //   uri: {node.uri}<br />
                //   slug: {node.slug}<br />
                //   title: {node.title}<br />
                // </div>
                node
            )

            // map over payload to set this.data{}
            const all = payload.map((node: Object): Object => {
              const one = new (noun as any)(this._type)
              one.data = node
              return one
            })
            console.debug(`%cloadFromDB [${this._type}]`, ccm.green, all)

            // set state from db
            this.store.update('all', [...all]) // nodes
            const nouns = this.store.get('all')
            console.debug(`%cloadFromDB [${this._type}] (after)`, ccm.green, nouns)

            this.store.update('oneDB', nouns[nouns.length - 1]) // node (use last one)
            const nounDB = this.store.get('oneDB')
            console.debug(`%cloadFromDB [${this._type}] {oneDB}`, ccm.orange, nounDB)

            // save to disk here ??? no
            // this.actions.saveToDisk()

            // nounCurrent (overwrite -- mutate)
            this.store.update('one', {
              _id: newUUID(),
              _ts: new Date().toISOString(),
              _type: _type.toLowerCase(),
              _name: _type.toUpperCase() + ': ' + nounDB.data.title,
              // wp custom fields
              data: nounDB.data,
              // layers/levels
              layers: [],
              layer: {
                _name: 'LAYER 0',
                data: {},
              },
            })
            console.debug(`%cloadFromDB [${this._type}] {one} (after)`, ccm.orange, this.store.get('one'))

            this.store.update('countDB', this.store.get('all').length)
            console.debug(`%cloadFromDB countDB`, ccm.orange, this.store.get('countDB'))
            console.debug(`%c====================================`, ccm5)

            // save to disk
            this.actions.saveToDisk()

            return true
          } else {
            console.debug(`%cloadFromDB [${this._type}]: data.${this._plural}.edges.length = 0`, ccm.green, data)
            return false
          }
        }

        console.debug(`%cloadFromDB [${this._type}]: OTHER ERROR`, ccm.green, data)
        return false
      } catch (err) {
        console.debug(`%cloadFromDB [${this._type}]: err`, ccm.green, err)
        return false
      }
    },

    // load 'this' noun into React Three Fiber view
    loadToWorkspace: (noun: Object, _type: string, _id: string, _r3fCanvas: string) => {
      try {
        const nounAlt = this.store.get('one')
        console.debug(`%cload {noun}`, ccm.orange, noun)
        console.debug(`%cload {nounAlt}`, ccm.orange, nounAlt)

        if (noun) {
          return true // <div>...noun as r3f component...</div>
        }

        return false
      } catch (err) {
        console.debug(`%cload {noun}: err`, ccm.green, err)
        return false
      }
    },
  } // nounActions
} // nounStore

// ==============================================================
// ==============================================================
// ==============================================================
// ** Modal Object -- Constructor Function
// -- returns new modal

function modal(this: any, _type = 'modal') {
  // object params
  this._id = newUUID()
  this._ts = new Date().toISOString()
  this._type = _type.toLowerCase()
  this._name = _type.toUpperCase() + ' 0'
  // wp custom fields
  this.data = {}
  // layers/levels
  this.layers = []
  this.layer = {
    _name: 'LAYER 0',
    data: {},
  }
}

// ==============================================================
// ** Modal Store -- Constructor Function
// -- returns new (modalStore as any)

function modalStore(this: any, _type = 'modal') {
  // store params
  this._type = _type.toLowerCase()
  this._plural = _type + 's'
  this._storageItem = 'threed_' + _type + 'History'

  // ==============================================================
  // ** Modal Store .store

  this.store = create({
    isVisible: false,
  })

  // ==============================================================
  // ** Modal Store .actions

  this.actions = {
    toggleIsVisible: (e: any = null) => {
      this.store.update('isVisible', !this.store.get('isVisible'))
      localStorage.setItem(
        this._storageItem,
        JSON.stringify({
          subject: 'isVisible',
          payload: this.store.get('isVisible'),
        })
      )
    },
    handleOpen: (e: any = null) => {
      this.store.update('isVisible', true)
      localStorage.setItem(
        this._storageItem,
        JSON.stringify({
          subject: 'isVisible',
          payload: true,
        })
      )
    },
    handleClose: (e: any = null) => {
      this.store.update('isVisible', false)
      localStorage.setItem(
        this._storageItem,
        JSON.stringify({
          subject: 'isVisible',
          payload: false,
        })
      )
    },
  } // modalActions
} // modalStore

// ==============================================================
// ==============================================================
// ==============================================================
// ** Construct Noun Stores + Export as Group of Stores

export { nounStore }
// export const nounStore = new (nounStore as any)('noun')
export const projectStore = new (nounStore as any)('project')
export const workspaceStore = new (nounStore as any)('workspace')
export const planStore = new (nounStore as any)('plan')
export const threedStore = new (nounStore as any)('threed')
export const fileStore = new (nounStore as any)('file')
export const sceneStore = new (nounStore as any)('scene')
export const allotmentStore = new (nounStore as any)('allotment')
export const bedStore = new (nounStore as any)('bed')
export const plantStore = new (nounStore as any)('plant')
export const plantingPlanStore = new (nounStore as any)('plantingPlan')
export const bearStore = new (nounStore as any)('bear')
export { modalStore }
// export const modalStore = new (modalStore as any)()
export const modalAboutStore = new (modalStore as any)('modalAbout')
export const modalModel3dStore = new (modalStore as any)('modalModel3d')
export const modalLoadingStore = new (modalStore as any)('modalLoading')
export const modalShareStore = new (modalStore as any)('modalShare')
export const modalStoreNoun = new (nounStore as any)('modal')

const stores = {
  nounStore,
  projectStore,
  workspaceStore,
  planStore,
  threedStore,
  fileStore,
  sceneStore,
  allotmentStore,
  bedStore,
  plantStore,
  plantingPlanStore,
  bearStore,
  modalStore,
  modalAboutStore,
  modalModel3dStore,
  modalLoadingStore,
  modalShareStore,
  modalStoreNoun,
}

export default stores
