// ==========================================================
// RESOURCES

// ** Apollo Client 3 -- Cache Store Imports
import { makeVar } from '@apollo/client'
import create, { StoreApi } from '#/lib/api/graphql/createStore'

// ** GraphQL Queries + Mutations (here, locally-specific data needs)
import GetNouns from '#/lib/api/graphql/scripts/getNouns.gql'
import GetPreferences from '#/lib/api/graphql/scripts/getPreferences.gql'
import GetProjects from '#/lib/api/graphql/scripts/getProjects.gql'
import GetScenes from '#/lib/api/graphql/scripts/getScenes.gql'
import GetParticipants from '#/lib/api/graphql/scripts/getParticipants.gql'
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
const debug: boolean = true // false | true
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

interface IStore extends StoreApi<any> {
  // params
  _type: string
  _plural: string
  _storageItem: string
  _storageItemHistory: string
  // store .store
  store: any
  // store .actions
  actions: any
}

interface IStorePreferences extends IStore {
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
    title: 'NOTHING YET, SIR',
    // custom fields (to be overwritten from db)
    // doAutoLoadData: true | false
    // doAutoRotate: true | false
    // projectName: ''
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

function nounStore(this: IStore, _type = 'noun') {
  // store params
  this._type = _type.toLowerCase()
  this._plural = _type + 's'
  this._storageItem = 'threed_' + this._type
  this._storageItemHistory = 'threed_' + this._type + 'History'

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
      localStorage.removeItem(this._storageItemHistory)
      this.store.update('all', [])
      this.store.update('one', new (noun as any)(this._type))
      this.store.update('allDB', [])
      this.store.update('oneDB', {})
      this.store.update('count', 0)
      this.store.update('countDB', 0)
      if (debug) console.clear()
      if (debug) console.debug(`%c X removeAll [${this._type}]`, ccm.red, true)
      if (debug) console.debug(`%c get one [${this._type}]`, ccm.red, this.store.get('one'))
    },

    // add a new current 'this' noun
    addNew: () => {
      // console.debug(`this`, this)
      if (debug) console.debug(`%c🌱 addNew [${this._type}] (before)`, ccm.orange, this.store.get('all'))
      // throw new Error(`[MM] testing... this`)

      // create a new one
      // if (Object.keys(this.store.get('one')).length === 0) {
      //   try {
      //     this.store.update('one', new (noun as any)(this._type))
      //   } catch (ERROR) {
      //     console.error(`%caddNew {${this._type}} ERROR`, ERROR)
      //   }
      // }
      // // save + update old one
      // else {
        // // noun history (save existing before mutating, if not empty)
        // this.store.update('history', [this.store.get('one'), ...this.store.get('history')])
        // if (debug) console.debug(`%caddNew [${this._type}] (save history)`, ccm.orange, this.store.get('history'))

        // count
        this.store.update('count', this.store.get('count') + 1) // manual
        this.store.update('countDB', this.store.get('allDB').length) // automatic

        // nounCurrent (overwrite this one -- mutate)
        this.store.update('one', {
          _id: newUUID(),
          _ts: new Date().toISOString(),
          _type: _type.toLowerCase(),
          _name: _type.toUpperCase() + ' NAME (default modified)',
          data: {
            title: 'NOT A THING, SIR', // 'WE AINT FOUND SHIT',
          },
          layers: [
            {
              _id: newUUID(),
              _name: 'LAYER[0]',
              data: {},
            }
          ],
        })
      // }
      if (debug) console.debug(`%caddNew {${this._type}} (added)`, ccm.orange, this.store.get('one'))

      // noun history (save existing before mutating, if not empty)
      this.store.update('history', [this.store.get('one'), ...this.store.get('history')])
      if (debug) console.debug(`%caddNew [${this._type}] (save history)`, ccm.orange, this.store.get('history'))

      // saveToDisk
      this.actions.saveToDisk()
      // loadFromDisk
      // this.actions.loadFromDisk()

      // if (debug) console.debug(`%caddNew [${this._type}] (final)`, ccm.green, this.store.get('one'))
    },

    updateData: () => {
      // this.store.update('one', ...this.store.get('one').data)
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
        localStorage.setItem(
          this._storageItemHistory,
          JSON.stringify({
            subject: this._plural,
            payload: this.store.get('history'),
          })
        )
        // if (debug) console.debug(`%c=======================================================`, ccm.black)
        if (debug) console.debug(`%c💾 saveToDisk [${this._type}]`, ccm.greenAlert, this.store.get('all'))
        if (debug) console.debug(`%c=======================================================`, ccm.black)
        return true
      } catch (ERROR) {
        if (debug) console.debug(`%c💾 saveToDisk [${this._type}] ERROR`, ccm.redAlert, ERROR)
        if (debug) console.debug(`%c=======================================================`, ccm.red)
        return false
      }
    },

    // get data from browser local storage
    loadFromDisk: () => {
      if (typeof window !== 'undefined') {
        try {
          const query = JSON.parse(localStorage.getItem(this._storageItem))
          if (query) {
            // if (debug) console.debug(`%c💾 loadFromDisk [${this._type}] QUERY?`, ccm.blue, query)
            const { payload } = query
            // if (debug) console.debug(`%c💾 loadFromDisk [${this._type}] QUERY.PAYLOAD?`, ccm.blue, payload)

            if (payload) {
              if (debug) console.debug(`%c💾 loadFromDisk [${this._type}] payload`, ccm.darkgreen, true, payload)

              this.store.update('all', payload) // payload should have .data{}
              if (debug) console.debug(`%c💾 loadFromDisk [${this._type}s] (after)`, ccm.blue, this.store.get('all'))

              // TODO : WHICH DB RECORD DO YOU WANT TO USE ???
              // default is the first one [0]
              const thisStoreUseOne = this.store.get('all')[0]
              if (debug) console.debug(`%c💾 loadFromDisk {${this._type}} (after)`, ccm.blue, thisStoreUseOne)

              // update metadata for the store to use
              if (thisStoreUseOne.data) {
                // this.store.update('one._name', thisStoreUseOne.data.title) // ideally
                this.store.update('one', {
                  _id: thisStoreUseOne._id, // .data.projectId (TODO: get wp_post.id and not wp_type.projectId)
                  _ts: thisStoreUseOne._ts, // thisStoreUseOne.data.modified,
                  _type: thisStoreUseOne._type,
                  _name: thisStoreUseOne._name, // .data.title,
                  // wp custom fields
                  data: thisStoreUseOne.data,
                  // layers/levels
                  layers: thisStoreUseOne.layers,
                })

                return true
              }

            } else {
              if (debug) console.debug(`%c💾 loadFromDisk [${this._type}] EMPTY QUERY.PAYLOAD?`, ccm.orange, query)
            }
          } else {
            if (debug) console.debug(`%c💾 loadFromDisk [${this._type}] NOTHING TO LOAD`, ccm.orange, query)
          }

          // if everything in this logic fails, return false as default
          return false
        } catch (ERROR) {
          if (debug) console.debug(`%c💾 loadFromDisk [${this._type}] ERROR`, ccm.red, ERROR)
          return false
        }
      } else {
        if (debug) console.debug(`%c💾 loadFromDisk [${this._type}] ERROR`, ccm.red)
        return false
      }
    },

    // TODO: SAVE TO DB VIA GRAPHQL
    // save data to db via graphql mutation
    saveToDB: async (client: any) => {
      try {
        if (debug) console.debug(`%c🌩️ saveToDB [${this._type}] client`, ccm.orangeAlert, client)
        // TODO: SAVE TO DB VIA GRAPHQL

        return true // OR false, if unsuccessful
      } catch (ERROR) {
        if (debug) console.debug(`%c🌩️ saveToDB [${this._type}]: ERROR`, ccm.redAlert, ERROR)
        return false
      }
    },

    // get data from db via graphql query
    loadFromDB: async (client: any) => {
      try {
        // const _this = this
        // if (debug) console.clear()
        if (debug) console.debug(`%c=======================================================`, ccm.black)
        if (debug) console.debug(`%c🌩️ loadFromDB this ${this._type}`, ccm.blue, this)
        if (debug) console.debug(`%c=======================================================`, ccm.black)

        // .gql
        let QUERY = null // default? GetProjects
        switch (this._type) {
          case 'preferences':
            QUERY = GetPreferences
            break
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
        // console.debug(`%c🌩️ loadFromDB [${this._type}]: DATA RETURNED`, data, loading, error)

        // using query directly
        const query = await client.query({
          query: QUERY,
          variables: { parameters },
        })
        // console.debug(`%c🌩️ loadFromDB [${this._type}]: QUERY RETURNED`, ccm.blue, query)

        const { data, loading, error } = query
        // console.debug(`%c🌩️ loadFromDB [${this._type}]: DATA RETURNED`, data, loading, error)

        if (loading) {
          // console.debug(`%c🌩️ loadFromDB [${this._type}]: DATA LOADING`, loading)
          return false // <div>loading...</div>
        }

        if (error) {
          if (debug) console.debug(`%c🌩️ loadFromDB [${this._type}]: DATA RETURNED with error`, ccm.red, error)
          return false // <div>{JSON.stringify(error.message)}</div>
        }

        if (data) {
          // console.debug(`%c🌩️ loadFromDB [${this._type}]: DATA RETURNED`, ccm.yellow, data, loading, error)

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
            const allPayload = payload.map((node: Object): Object[] => {
              const one = new (noun as any)(this._type)
              one.data = node
              return one
            })
            // console.debug(`%c🌩️ loadFromDB [${this._type}]`, ccm.blue, all)

            // save to disk here ?? yes
            this.actions.saveToDisk()

            // set state from db
            this.store.update('all', ([...allPayload, ...this.store.get('all')])) // merge all nodes, past + present
            const nouns = this.store.get('all')
            if (debug) console.debug(`%c🌩️ loadFromDB [${this._type}] (all)`, ccm.blue, nouns)

            this.store.update('history', ([...nouns, ...this.store.get('history')])) // merge all nodes, past + present

            this.store.update('oneDB', nouns[nouns.length - 1]) // node (use last one)
            const nounDB = this.store.get('oneDB')
            // if (debug) console.debug(`%c🌩️ loadFromDB [${this._type}] {oneDB}`, ccm.blue, nounDB)

            // save to disk here ??? no
            // this.actions.saveToDisk()

            // nounCurrent (overwrite -- mutate)
            this.store.update('one', {
              _id: nounDB._id, // newUUID(),
              _ts: nounDB._ts, // new Date().toISOString(),
              _type: nounDB._type,
              // _name: nounDB.data.title,
              // _name: _type.toUpperCase() + ' NAME: ' + nounDB.data.title,
              _name: nounDB._name,
              // wp custom fields
              data: nounDB.data,
              // layers/levels
              layers: nounDB.layers,
            })
            if (debug) console.debug(`%c🌩️ loadFromDB [${this._type}] {one} (after)`, ccm.blue, this.store.get('one'))

            this.store.update('count', this.store.get('all').length)
            this.store.update('countDB', this.store.get('all').length)
            // if (debug) console.debug(`%c🌩️ loadFromDB countDB`, ccm.blue, this.store.get('countDB'))
        if (debug) console.debug(`%c=======================================================`, ccm.black)

            // save to disk here ?? yes
            this.actions.saveToDisk()

            return true
          } else {
            console.debug(`%c🌩️ loadFromDB [${this._type}] NO PAYLOAD`, ccm.redAlert, data)
            return false
          }
        }

        console.debug(`%c🌩️ loadFromDB [${this._type}]: OTHER ERROR`, ccm.redAlert, data)
        return false
      } catch (ERROR) {
        console.debug(`%c🌩️ loadFromDB [${this._type}]: ERROR`, ccm.redAlert, ERROR)
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
        if (debug) console.debug(`%c ${this._type} loadFromDataSource isLoadedFromDisk`, ccm.darkgreen)
        return responseData
      } else {
        responseData.isLoadedFromDB = this.actions.loadFromDB(client)
        if (responseData.isLoadedFromDB) {
          if (debug) console.debug(`%c ${this._type} loadFromDataSource isLoadedFromDB`, ccm.darkgreen)
          return responseData
        }
      }
      // default
      if (debug) console.debug(`%c ${this._type} loadFromDataSource isLoadedFromDisk`, ccm.redAlert, responseData)
      return responseData
    },

    // load 'this' THREED[S] into React Three Fiber view
    loadToCanvas: (
      client: Object = {},
      nodes: Object[] = [], // hmmmm -- nodes?
      _type: string = 'project', // main type for query
      _requestType: string = 'plansOfThreeds', // sub-type for query
      _id: string = '3333', // some id
      _r3fCanvas: string = '_r3fcanvas1' // target canvas #_r3fCanvasX
    ) => {
      // **
      let objectArrayToReturn = []
      // **
      try {

        if (nodes.length) {
          // send 'nodes' to '#_r3fCanvas1'

          if (debug || DEBUG)
            console.debug('%c #_r3fCanvas1 to receive JS Object: nodes', ccm.greenAlert, nodes)
          // return true // <div>...plan of nodes as r3f component...</div>
          objectArrayToReturn = nodes
          return objectArrayToReturn
        }

        if (_type == 'project') {
          if (_requestType == 'plansOfThreeDs') {
            // const load_PlanOfThreeDNodes_ToThreeDCanvas = this.store.get('one').plans
            let load_PlanOfThreeDNodes_ToThreeDCanvas = []
            try {
              if (this.store.get('one')) {
                load_PlanOfThreeDNodes_ToThreeDCanvas = this.store.get('one').data?.plans?.nodes[0]?.threedsActive?.nodes // plans[] of threeds[]
              }
            } catch (ERROR) {
              if (debug || DEBUG)
                console.debug(`%c load_PlanOfThreeDNodes_ToThreeDCanvas: ERROR`, ccm.red, ERROR)
            }

            if (load_PlanOfThreeDNodes_ToThreeDCanvas && load_PlanOfThreeDNodes_ToThreeDCanvas.length) {
              // send 'threeds' to '_r3fCanvas'

              if (debug || DEBUG)
                console.debug(
                  '%c #_r3fCanvas to receive JS Object: load_PlanOfThreeDNodes_ToThreeDCanvas',
                  ccm.green,
                  load_PlanOfThreeDNodes_ToThreeDCanvas
                )

              objectArrayToReturn = load_PlanOfThreeDNodes_ToThreeDCanvas
              return objectArrayToReturn
              return true
            }
          }
        }

        // **
        if (debug || DEBUG)
          console.debug('%c #_r3fCanvas to receive NOTHING', ccm.red)
        return []
        return false
      // **
      } catch (ERROR) {
        if (debug || DEBUG)
          console.debug(`%c load {noun}: ERROR`, ccm.red, ERROR)
        return []
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

function modal(this: INoun, _type = 'modal') {
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

function modalStore(this: IStore, _type = 'modal') {
  // store params
  this._type = _type.toLowerCase()
  this._plural = _type + 's'
  this._storageItem = 'threed_' + this._type
  this._storageItemHistory = 'threed_' + this._type + 'History'

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
// ** Preferences Store -- Constructor Function
// -- returns new (preferencesStore as any)

function preferenceStoreCustom(this: IStorePreferences, _type = 'preferences') {
  // store params
  this._type = _type.toLowerCase()
  this._plural = _type // + 's'
  this._storageItem = 'threed_' + this._type
  this._storageItemHistory = 'threed_' + this._type + 'History'

  // ==============================================================
  // ** Preferences Store .store

  // **
  // const preferences = useReactiveVar(preferencesDataVar)
  // const doAutoLoadDataApollo = preferencesStore.store.useStore('doAutoLoadData')
  // const doAutoLoadDataApollo = preferences.doAutoLoadData
  // const doAutoLoadDataApollo = this.store.get('doAutoLoadData')
  const doAutoLoadDataApollo: boolean = false
  // console.log('ThreeDLevaControls doAutoLoadDataApollo', doAutoLoadDataApollo)
  // const doAutoRotateApollo = preferencesStore.store.useStore('doAutoRotate')
  // const doAutoRotateApollo = preferences.doAutoRotate
  // const doAutoRotateApollo = this.store.get('doAutoRotate')
  const doAutoRotateApollo: boolean = false
  // console.log('ThreeDLevaControls doAutoRotateApollo', doAutoRotateApollo)
  // const projectNameApollo = preferencesStore.store.useStore('projectName')
  // const projectNameApollo = preferences.projectName
  // const projectNameApollo = this.store.get('projectName')
  const projectNameApollo: string = ''
  // console.log('ThreeDLevaControls projectNameApollo', projectNameApollo)

  this.store = create({
    doAutoLoadData: doAutoLoadDataApollo, // true | false,
    doAutoRotate: doAutoRotateApollo, // true | false,
    projectName: projectNameApollo, // string | 'APOLLO PREFERENCES STORE: projectName'
  })

  // ==============================================================
  // ** Preferences Store .actions

  this.actions = {
    setDoAutoLoadData: (e: boolean = false) => {
      // this.store.update('doAutoLoadData', !this.store.get('doAutoLoadData'))
      this.store.update('doAutoLoadData', e)
      localStorage.setItem(
        this._storageItem,
        JSON.stringify({
          subject: 'doAutoLoadData',
          payload: this.store.get('doAutoLoadData'),
        })
      )
      return this.store.get('doAutoLoadData')
    },
    setDoAutoRotate: (e: boolean = false) => {
      // this.store.update('doAutoRotate', !this.store.get('doAutoRotate'))
      this.store.update('doAutoRotate', e)
      localStorage.setItem(
        this._storageItem,
        JSON.stringify({
          subject: 'doAutoRotate',
          payload: this.store.get('doAutoRotate'),
        })
      )
      return this.store.get('doAutoLoadData')
    },
    setProjectName: (e: string = 'nope') => {
      this.store.update('projectName', e)
      localStorage.setItem(
        this._storageItem,
        JSON.stringify({
          subject: 'projectName',
          payload: this.store.get('projectName'),
        })
      )
      // const doModifyProjectName = client.cache.modify({
      //   id: client.cache.identify(preferencesStore),
      //   fields: {
      //     name(projectName) {
      //       return projectName.toUpperCase()
      //     },
      //   },
      //   /* broadcast: false // Include this to prevent automatic query refresh */
      // })
      return this.store.get('projectName')
    },
  } // preferencesActions
} // preferencesStore

// ==============================================================

// ** CREATE REACTIVE VARS (APOLLO LOCAL STATE)
export const preferencesDataVar = makeVar(
  {
    doAutoLoadData: false,
    doAutoRotate: false,
    projectName: 'preferencesDataVar.projectName default',
  }
)
console.debug('Apollo Stores ReactiveVar preferencesDataVar()', preferencesDataVar())
// console.debug('Apollo Stores ReactiveVar preferencesDataVar().doAutoLoadData', preferencesDataVar().doAutoLoadData)
// console.debug('Apollo Stores ReactiveVar preferencesDataVar().doAutoRotate', preferencesDataVar().doAutoRotate)
// console.debug('Apollo Stores ReactiveVar preferencesDataVar().projectName', preferencesDataVar().projectName)

// ==============================================================

// ==============================================================

// ==============================================================
// ** Construct Stores + Export as Group of Stores

export { nounStore }
// export const nounStore = new (nounStore as any)('noun')
// export { preferencesStore }
export const preferencesStore = new (nounStore as any)('preferences')
// EXTEND nounStore to become preferencesStoreCustom
// export const preferencesStore = new (preferenceStoreCustom as any)('preferences')
// regular nouns
export const projectStore = new (nounStore as any)('project')
export const sceneStore = new (nounStore as any)('scene')
export const participantStore = new (nounStore as any)('participant')
export const planStore = new (nounStore as any)('plan')
export const threedStore = new (nounStore as any)('threed')
export const fileStore = new (nounStore as any)('file')
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

export const stores = {
  nounStore,
  preferencesStore,
  projectStore,
  sceneStore,
  participantStore,
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
export const queries = {
  GetNouns,
  GetPreferences,
  GetProjects,
  GetScenes,
  GetParticipants,
  GetPlans,
  GetThreeDs,
  GetFiles,
  GetAllotments,
  GetBeds,
  GetPlants,
  GetPlantingPlans,
}
export const mutations = {
  UpdatePreferences: 'HEY HEY HEY UpdatePreferences',
  UpdateProjects: 'HEY HEY HEY UpdateProjects',
  UpdatePlans: 'HEY HEY HEY UpdatePlans',
}

// export { stores, queries, mutations }
export default stores
