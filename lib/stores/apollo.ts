// ==========================================================
// RESOURCES

// ** Apollo Client 3 -- Cache Store Imports
import create, { StoreApi } from '#/lib/api/graphql/createStore'

// ** GraphQL Queries + Mutations (here, locally-specific data needs)
import GetNouns from '#/lib/api/graphql/scripts/getNouns.gql'
import GetParticipants from '#/lib/api/graphql/scripts/getParticipants.gql'
import GetProjects from '#/lib/api/graphql/scripts/getProjects.gql'
import GetScenes from '#/lib/api/graphql/scripts/getScenes.gql'
import GetPlans from '#/lib/api/graphql/scripts/getPlans.gql'
import GetThreeDs from '#/lib/api/graphql/scripts/getThreeDs.gql'
import GetFiles from '#/lib/api/graphql/scripts/getFiles.gql'
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
// console.debug(`%c🥕 ThreeDGarden<FC,R3F>: Apollo {stores}`, ccm.blue)
// console.debug(`%c====================================`, ccm.blue)

// ** TESTING
const debug: boolean = false // false | true
const DEBUG: boolean = true // 1 == 0 | 1 == 1

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
  layers: [
    {
      _id: string
      _name: string
      data: Object
    }
  ]
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
  participantStore: StoreApi<any>
  planStore: StoreApi<any>
  threedStore: StoreApi<any>
  fileStore: StoreApi<any>
  sceneStore: StoreApi<any>
  allotmentStore: StoreApi<any>
  bedStore: StoreApi<any>
  plantStore: StoreApi<any>
  plantingPlanStore: StoreApi<any>
  // bearStore: StoreApi<any>
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
  this._name = _type.toUpperCase() + ' NAME (default)'
  // wp custom fields
  this.data = {
    title: 'NOT A THING, SIR',
  }
  // layers/levels
  this.layers = [
    {
      _id: newUUID(),
      _name: 'LAYER[0]',
      data: {},
    }
  ]
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
    all: [], // all of this nouns historical + current records (all scenes; all projects; all plans;)
    one: new (noun as any)(this._type), // {}, // the current noun, aka 'this one noun'

    // track current noun + noun history
    // current: ^this one noun,
    history: [], // from local storage

    // track payloads from db
    count: 0, // example counter (for fun/learning)
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
      this.store.update('allDB', [])
      this.store.update('oneDB', {})
      this.store.update('count', 0)
      this.store.update('countDB', 0)
      console.clear()
      console.debug(`%c X removeAll [${this._type}]`, ccm.red, true)
      console.debug(`%c get one [${this._type}]`, ccm.red, this.store.get('one'))
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
        } catch (ERROR) {
          console.error(`%caddNew {${this._type}} ERROR`, ERROR)
        }
      }
      // save + update old one
      else {
        // nounHistory (save existing before mutating, if not empty)
        this.store.update('history', [this.store.get('one'), ...this.store.get('history')])
        if (debug) console.debug(`%caddNew [${this._type}] (save history)`, ccm.orange, this.store.get('all'))

        // count
        // this.store.update('count', this.store.get('count') + 1) // manual
        this.store.update('count', this.store.get('all').length) // automatic
        // console.debug(`%caddNew {count}`, ccm.blue, this.store.get('count'))
        // console.debug(`%caddNew [${this._type}]`, ccm.blue, this.store.get('all').length)

        // nounCurrent (overwrite this one -- mutate)
        this.store.update('one', {
          _id: newUUID(),
          _ts: new Date().toISOString(),
          _type: _type.toLowerCase(),
          _name: _type.toUpperCase() + ' NAME (default modified)',
          data: {
            title: 'WE AINT FOUND SHIT',
          },
          layers: [
            {
              _id: newUUID(),
              _name: 'LAYER[0]',
              data: {},
            }
          ],
        })
      }
      if (debug) console.debug(`%caddNew {${this._type}} (added)`, ccm.orange, this.store.get('one'))

      // nounHistory (save recently mutated new one and all old ones)
      this.store.update('all', [this.store.get('one'), ...this.store.get('all')])
      if (debug) console.debug(`%caddNew [${this._type}] (all updated)`, ccm.orange, this.store.get('all'))

      // count (for fun/learning)
      // this.store.update('count', this.store.get('count') + 1) // manual
      this.store.update('count', this.store.get('all').length) // automatic
      if (debug) console.debug(`%caddNew {count}`, ccm.blue, this.store.get('count'))
      // console.debug(`%caddNew {${this._type}}`, ccm.blue, this.store.get('all').length)

      // saveToDisk
      this.actions.saveToDisk()
      // loadFromDisk
      // this.actions.loadFromDisk()

      if (debug) console.debug(`%caddNew [${this._type}] (final)`, ccm.green, this.store.get('one'))
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
        if (debug) console.debug(`%csaveToDisk [${this._type}]`, ccm.orange, this.store.get('all'))
        return true
      } catch (ERROR) {
        if (debug) console.debug(`%csaveToDisk [${this._type}] ERROR`, ccm.red, ERROR)
        return false
      }
    },

    // get data from browser local storage
    loadFromDisk: () => {
      try {
        const query = JSON.parse(localStorage.getItem(this._storageItem))
        if (query) {
          // if (debug) console.debug(`%cloadFromDisk [${this._type}] QUERY?`, ccm.blue, query)
          const { payload } = query
          // if (debug) console.debug(`%cloadFromDisk [${this._type}] QUERY.PAYLOAD?`, ccm.blue, payload)

          if (payload) {
            // console.debug(`%cloadFromDisk [${this._type}]`, ccm.blue, true, payload)

            this.store.update('all', [...payload]) // payload should have .data{}
            if (debug) console.debug(`%cloadFromDisk [${this._type}s] (after)`, ccm.blue, this.store.get('all'))

            // TODO : WHICH DB RECORD DO YOU WANT TO USE ???
            // default is the first one [0]
            const thisStoreUseOne = this.store.get('all')[0]
            if (debug) console.debug(`%cloadFromDisk {${this._type}} (after)`, ccm.blue, this.store.get('one'))

            // update metadata for the store to use
            if (thisStoreUseOne.data) {
              // this.store.update('one._name', thisStoreUseOne.data.title) // ideally
              this.store.update('one', {
                _id: thisStoreUseOne._id, // .data.projectId (TODO: get wp_post.id and not wp_type.projectId)
                _ts: thisStoreUseOne.data.modified,
                _type: _type.toLowerCase(),
                _name: thisStoreUseOne.data.title,
                // wp custom fields
                data: thisStoreUseOne.data,
                // layers/levels
                layers: thisStoreUseOne.layers,
              })

              return true
            }

          } else {
            console.debug(`%cloadFromDisk [${this._type}] EMPTY QUERY.PAYLOAD?`, ccm.orange, query)
          }
        } else {
          console.debug(`%cloadFromDisk [${this._type}] NOTHING TO LOAD`, ccm.orange, query)
        }

        // if everything in this logic fails, return false as default
        return false
      } catch (ERROR) {
        console.debug(`%cloadFromDisk [${this._type}] ERROR`, ccm.red, ERROR)
        return false
      }
    },

    // TODO: SAVE TO DB VIA GRAPHQL
    // save data to db via graphql mutation
    saveToDB: async (client: any) => {
      try {
        console.debug(`%csaveToDB [${this._type}] client`, ccm.red, client)
        // TODO: SAVE TO DB VIA GRAPHQL

        return true // OR false, if unsuccessful
      } catch (ERROR) {
        console.debug(`%csaveToDB [${this._type}]: ERROR`, ccm.red, ERROR)
        return false
      }
    },

    // get data from db via graphql query
    loadFromDB: async (client: any) => {
      try {
        // const _this = this
        if (debug) console.debug(`%cloadFromDB this`, ccm.yellow, this)

        // .gql
        let QUERY = GetProjects // default
        switch (this._type) {
          case 'noun':
            QUERY = GetNouns
            break
          case 'project':
            QUERY = GetProjects
            break
          case 'participants':
            QUERY = GetParticipants
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
        // console.debug(`%cloadFromDB [${this._type}]: QUERY RETURNED`, ccm.blue, query)

        const { data, loading, error } = query
        // console.debug(`%cloadFromDB [${this._type}]: DATA RETURNED`, data, loading, error)

        if (loading) {
          // console.debug(`%cloadFromDB [${this._type}]: DATA LOADING`, loading)
          return false // <div>loading...</div>
        }

        if (error) {
          console.debug(`%cloadFromDB [${this._type}]: DATA RETURNED with error`, error)
          return false // <div>{JSON.stringify(error.message)}</div>
        }

        if (data) {
          // console.debug(`%cloadFromDB [${this._type}]: DATA RETURNED`, ccm.yellow, data, loading, error)

          let payload
          let nodes = payload
          if (data[this._plural]?.edges?.length) {
            // const payload = data[this._plural].edges
            payload = data[this._plural].edges.map(
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
          } else if (data[this._plural]?.nodes?.length) {
            // const payload = data[this._plural].nodes
            payload = data[this._plural].nodes.map(
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
          }
          if (payload.length) {

            // map over payload to set this.data{}
            const all = payload.map((node: Object): Object => {
              const one = new (noun as any)(this._type)
              one.data = node
              return one
            })
            // console.debug(`%cloadFromDB [${this._type}]`, ccm.blue, all)

            // set state from db
            // this.store.update('all', [...all]) // nodes
            this.store.update('all', ([this.store.get('all'), ...all])) // nodes, past + present
            const nouns = this.store.get('all')
            if (debug) console.debug(`%cloadFromDB [${this._type}] (all)`, ccm.blue, nouns)

            this.store.update('oneDB', nouns[nouns.length - 1]) // node (use last one)
            const nounDB = this.store.get('oneDB')
            if (debug) console.debug(`%cloadFromDB [${this._type}] {oneDB}`, ccm.orange, nounDB)

            // save to disk here ??? no
            // this.actions.saveToDisk()

            // nounCurrent (overwrite -- mutate)
            this.store.update('one', {
              _id: newUUID(),
              _ts: new Date().toISOString(),
              _type: _type.toLowerCase(),
              _name: nounDB.data.title,
              // _name: _type.toUpperCase() + ' NAME: ' + nounDB.data.title,
              // wp custom fields
              data: nounDB.data,
              // layers/levels
              layers: [
                {
                  _id: newUUID(),
                  _name: 'LAYER[0]',
                  data: {},
                }
              ],
            })
            if (debug) console.debug(`%cloadFromDB [${this._type}] {one} (after)`, ccm.orange, this.store.get('one'))

            this.store.update('countDB', this.store.get('all').length)
            // if (debug) console.debug(`%cloadFromDB countDB`, ccm.orange, this.store.get('countDB'))
            if (debug) console.debug(`%c====================================`, ccm.black)

            // save to disk here ?? yes
            this.actions.saveToDisk()

            return true
          } else {
            console.debug(`%cloadFromDB [${this._type}] NO PAYLOAD`, ccm.red, data)
            return false
          }
        }

        console.debug(`%cloadFromDB [${this._type}]: OTHER ERROR`, ccm.red, data)
        return false
      } catch (ERROR) {
        console.debug(`%cloadFromDB [${this._type}]: ERROR`, ccm.red, ERROR)
        return false
      }
    },

    // load from data source: DB or DISK ??
    // check DISK first, then DB
    loadFromDataSource: (client: any) => {
      const responseData = {
        isLoadedFromDisk: false,
        isLoadedFromDB: false,
      }
      responseData.isLoadedFromDisk = this.actions.loadFromDisk(client)
      if (responseData.isLoadedFromDisk) {
        if (debug) console.debug('loadProjectFromChosenDataSource loadFromDataSource isLoadedFromDisk', responseData)
        return responseData
      } else {
        responseData.isLoadedFromDB = this.actions.loadFromDB(client)
        if (responseData.isLoadedFromDB) {
          if (debug) console.debug('loadProjectFromChosenDataSource loadFromDataSource isLoadedFromDisk', responseData)
          return responseData
        }
      }
      // default
      if (debug) console.debug('loadProjectFromChosenDataSource loadFromDataSource isLoadedFromDisk', responseData)
      return responseData
    },

    // load 'this' THREED[S] into React Three Fiber view
    loadToCanvas: (
      threeds: Object[] = [],
      _type: string = 'project',
      _requestType: string = 'plansOfThreeds',
      _id: string = '3333',
      _r3fCanvas: string = '#_r3fcanvas'
    ) => {
      try {

        if (threeds.length) {
          // send 'this' to '#_r3fCanvas'

          if (debug || DEBUG)
            console.debug('%c #_r3fCanvas to receive JS Object: threeds', ccm.green, threeds)
          return true // <div>...plan of threeds as r3f component...</div>
        }

        if (_type == 'project') {
          if (_requestType == 'plansOfThreeDs') {
            // const load_PlanOfThreeDs_ToThreeDCanvas = this.store.get('one').plans
            let load_PlanOfThreeDs_ToThreeDCanvas = []
            try {
              if (this.store.get('one')) {
                load_PlanOfThreeDs_ToThreeDCanvas = this.store.get('one').data?.plans?.nodes[0]?.threedsActive?.nodes // plans[] of threeds[]
              }
            } catch (ERROR) {
              if (debug || DEBUG)
                console.debug(`%c load_PlanOfThreeDs_ToThreeDCanvas: ERROR`, ccm.red, ERROR)
            }

            if (load_PlanOfThreeDs_ToThreeDCanvas && load_PlanOfThreeDs_ToThreeDCanvas.length) {
              // send 'this' to '_r3fCanvas'

              if (debug || DEBUG)
                console.debug(
                  '%c #_r3fCanvas to receive JS Object: load_PlanOfThreeDs_ToThreeDCanvas',
                  ccm.green,
                  load_PlanOfThreeDs_ToThreeDCanvas
                )
              return true
            }
          }
        }

        if (debug || DEBUG)
          console.debug('%c #_r3fCanvas to receive NOTHING', ccm.red)
        return false
      } catch (ERROR) {
        if (debug || DEBUG)
          console.debug(`%c load {noun}: ERROR`, ccm.red, ERROR)
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
  this._name = _type.toUpperCase() + ' NAME (default)'
  // wp custom fields
  this.data = {}
  // layers/levels
  this.layers = [
    {
      _id: newUUID(),
      _name: 'LAYER[0]',
      data: {},
    }
  ]
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
export const participantStore = new (nounStore as any)('participant')
export const planStore = new (nounStore as any)('plan')
export const threedStore = new (nounStore as any)('threed')
export const fileStore = new (nounStore as any)('file')
export const sceneStore = new (nounStore as any)('scene')
export const allotmentStore = new (nounStore as any)('allotment')
export const bedStore = new (nounStore as any)('bed')
export const plantStore = new (nounStore as any)('plant')
export const plantingPlanStore = new (nounStore as any)('plantingPlan')
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
  participantStore,
  sceneStore,
  planStore,
  threedStore,
  fileStore,
  allotmentStore,
  bedStore,
  plantStore,
  plantingPlanStore,
  modalStore,
  modalAboutStore,
  modalModel3dStore,
  modalLoadingStore,
  modalShareStore,
  modalStoreNoun,
}

// ** GraphQL Queries + Mutations (here, locally-specific data needs)
const queries = {
  GetNouns,
  GetProjects,
  GetParticipants,
  GetScenes,
  GetPlans,
  GetThreeDs,
  GetFiles,
  GetAllotments,
  GetBeds,
  GetPlants,
  GetPlantingPlans,
}
const mutations = {
  UpdateProjects: 'HEY HEY HEY UpdateProjects',
  UpdatePlans: 'HEY HEY HEY UpdatePlans',
}

export default stores
export { stores, queries, mutations }
