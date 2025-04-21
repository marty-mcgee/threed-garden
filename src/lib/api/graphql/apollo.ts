// 'use client' // no! should be ssr friendly
// 'use server' // yes! let nextjs manage this default
// ==========================================================
// RESOURCES

// ** APOLLO Client 3 -- Cache Store Imports
import { makeVar } from '@apollo/client'
import create, { StoreApi } from '#/lib/api/graphql/createStore'

// ** GRAPHQL -- Schema Objects, Queries, Mutations, Fragments, Subscriptions
// ==============================================================
// ** -- TYPES (Schema)
// ==============================================================
// ** schema objects
// import Nouns from '#/lib/api/graphql/schema/nouns.graphql'
// import Participants from '#/lib/api/graphql/schema/participants.graphql'
import Preferences from '#/lib/api/graphql/schema/preferencess.graphql'
// import CanvasStates from '#/lib/api/graphql/schema/canvasStates.graphql'
// import Projects from '#/lib/api/graphql/schema/projects.graphql'
// import Plans from '#/lib/api/graphql/schema/plans.graphql'
// import Scenes from '#/lib/api/graphql/schema/scenes.graphql'
// import ThreeDs from '#/lib/api/graphql/schema/threeds.graphql'
// import Files from '#/lib/api/graphql/scripts/files.graphql'
// import Allotments from '#/lib/api/graphql/scripts/allotments.graphql'
// import Beds from '#/lib/api/graphql/scripts/beds.graphql'
// import Plants from '#/lib/api/graphql/scripts/plants.graphql'
// import PlantingPlans from '#/lib/api/graphql/scripts/plantingPlans.graphql'
// ==============================================================
// ** scripts for objects
// ==============================================================
// ** -- QUERIES (Read/Get)
// ==============================================================
// ** get existing
import GetNouns from '#/lib/api/graphql/scripts/getNouns.gql'
import GetUsers from '#/lib/api/graphql/scripts/getUsers.gql'
import GetParticipants from '#/lib/api/graphql/scripts/getParticipants.gql'
import GetPreferences from '#/lib/api/graphql/scripts/getPreferences.gql'
import GetCanvasStates from '#/lib/api/graphql/scripts/getCanvasStates.gql'
import GetProjects from '#/lib/api/graphql/scripts/getProjects.gql'
import GetPlans from '#/lib/api/graphql/scripts/getPlans.gql'
import GetScenes from '#/lib/api/graphql/scripts/getScenes.gql'
import GetThreeDs from '#/lib/api/graphql/scripts/getThreeDs.gql'
// import GetFiles from '#/lib/api/graphql/scripts/getFiles.gql'
// import GetAllotments from '#/lib/api/graphql/scripts/getAllotments.gql'
// import GetBeds from '#/lib/api/graphql/scripts/getBeds.gql'
// import GetPlants from '#/lib/api/graphql/scripts/getPlants.gql'
// import GetPlantingPlans from '#/lib/api/graphql/scripts/getPlantingPlans.gql'
// ==============================================================
// ** -- MUTATIONS (Create/Post, Update/Patch, Delete)
// ==============================================================
// ** create new
// import CreateNouns from '#/lib/api/graphql/scripts/createNouns.gql'
// import CreateUsers from '#/lib/api/graphql/scripts/createUsers.gql'
// import CreateParticipants from '#/lib/api/graphql/scripts/createParticipants.gql'
import CreatePreferences from '#/lib/api/graphql/scripts/createPreferences.gql'
// import CreateCanvasStates from '#/lib/api/graphql/scripts/createCanvasStates.gql'
// import CreateProjects from '#/lib/api/graphql/scripts/createProjects.gql'
// import CreatePlans from '#/lib/api/graphql/scripts/createPlans.gql'
// import CreateScenes from '#/lib/api/graphql/scripts/createScenes.gql'
// import CreateThreeDs from '#/lib/api/graphql/scripts/createThreeDs.gql'
// import CreateFiles from '#/lib/api/graphql/scripts/createFiles.gql'
// import CreateAllotments from '#/lib/api/graphql/scripts/createAllotments.gql'
// import CreateBeds from '#/lib/api/graphql/scripts/createBeds.gql'
// import CreatePlants from '#/lib/api/graphql/scripts/createPlants.gql'
// import CreatePlantingPlans from '#/lib/api/graphql/scripts/createPlantingPlans.gql'
// ==============================================================
// ** update existing
// import UpdateNouns from '#/lib/api/graphql/scripts/updateNouns.gql'
// import UpdateUsers from '#/lib/api/graphql/scripts/updateUsers.gql'
// import UpdateParticipants from '#/lib/api/graphql/scripts/updateParticipants.gql'
import UpdatePreferences from '#/lib/api/graphql/scripts/updatePreferences.gql'
// import UpdateCanvasStates from '#/lib/api/graphql/scripts/updateCanvasStates.gql'
// import UpdateProjects from '#/lib/api/graphql/scripts/updateProjects.gql'
// import UpdatePlans from '#/lib/api/graphql/scripts/updatePlans.gql'
// import UpdateScenes from '#/lib/api/graphql/scripts/updateScenes.gql'
// import UpdateThreeDs from '#/lib/api/graphql/scripts/updateThreeDs.gql'
// import UpdateFiles from '#/lib/api/graphql/scripts/updateFiles.gql'
// import UpdateAllotments from '#/lib/api/graphql/scripts/updateAllotments.gql'
// import UpdateBeds from '#/lib/api/graphql/scripts/updateBeds.gql'
// import UpdatePlants from '#/lib/api/graphql/scripts/updatePlants.gql'
// import UpdatePlantingPlans from '#/lib/api/graphql/scripts/updatePlantingPlans.gql'
// ==============================================================
// ** delete existing
// import DeleteNouns from '#/lib/api/graphql/scripts/deleteNouns.gql'
// import DeleteUsers from '#/lib/api/graphql/scripts/deleteUsers.gql'
// import DeleteParticipants from '#/lib/api/graphql/scripts/deleteParticipants.gql'
// import DeletePreferences from '#/lib/api/graphql/scripts/deletePreferences.gql'
// import DeleteCanvasStates from '#/lib/api/graphql/scripts/deleteCanvasStates.gql'
// import DeleteProjects from '#/lib/api/graphql/scripts/deleteProjects.gql'
// import DeletePlans from '#/lib/api/graphql/scripts/deletePlans.gql'
// import DeleteScenes from '#/lib/api/graphql/scripts/deleteScenes.gql'
// import DeleteThreeDs from '#/lib/api/graphql/scripts/deleteThreeDs.gql'
// import DeleteFiles from '#/lib/api/graphql/scripts/deleteFiles.gql'
// import DeleteAllotments from '#/lib/api/graphql/scripts/deleteAllotments.gql'
// import DeleteBeds from '#/lib/api/graphql/scripts/deleteBeds.gql'
// import DeletePlants from '#/lib/api/graphql/scripts/deletePlants.gql'
// import DeletePlantingPlans from '#/lib/api/graphql/scripts/deletePlantingPlans.gql'
// ==============================================================
// ** JWT AUTH + REFRESH
import RegisterUser from '#/lib/api/graphql/scripts/registerUser.gql'
import LoginUser from '#/lib/api/graphql/scripts/loginUser.gql'
import RefreshJwtAuthToken from '#/lib/api/graphql/scripts/refreshJwtAuthToken.gql'
// ==============================================================

// ** THREE Imports (for typing only)
import * as THREE from 'three'

// ** UUID Imports
import { v4 as newUUID } from 'uuid'

// ** HELPER Imports
import ccm from '#/lib/utils/console-colors'

// ==============================================================
// IMPORTS COMPLETE
// console.debug(`%c====================================`, ccm.blue)
// console.debug(`%c🥕 ThreeDGarden<FC,R3F>: Apollo {stores}`, ccm.blue)
// console.debug(`%c====================================`, ccm.blue)

// ==========================================================
// ** DEBUG: this module
const debug: boolean = false
const DEBUG: boolean = false

// ==============================================================
// ** NOUN Types + Interfaces

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
  store: INoun
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
    // defaults
    title: 'NOUN TITLE: NOTHING YET, SIR',
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

    // track payloads from db ??
    count: 0, // example counter (for fun/learning)
    // countDB: 0, // example counter (for fun/learning)
    // allDB: [], // from db (mysql wordpress via graphql)
    // oneDB: {}, // pre-this noun, ready to be mapped to 'this' noun
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
      this.store.update('history', [])
      // this.store.update('allDB', [])
      // this.store.update('oneDB', {})
      this.store.update('count', 0)
      // this.store.update('countDB', 0)
      // if (debug) console.clear()
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
        // this.store.update('countDB', this.store.get('allDB').length) // automatic

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
      // saveToDisk (localStorage)
      this.actions.saveToDisk()
      // saveToDB (mutations via graphql api)
      this.actions.saveToDB()
    },

    // save data to browser local storage
    saveToDisk: () => {
      if (typeof window != 'undefined') {
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
      }
      // typeof window === 'undefined'
      else {
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
              if (debug) console.debug(`%c💾 loadFromDisk [${this._type}] payload`, ccm.blue, true, payload)

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
            if (debug) console.debug(`%c💾 loadFromDisk [${this._type}] NOTHING TO LOAD`, ccm.blue, query)
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
        // .gql
        let MUTATION = null // default? no
        switch (this._type) {
          // case 'participant':
          //   MUTATION = UpdateParticipants
          //   break
          case 'preferences':
            MUTATION = UpdatePreferences
            break
          // case 'canvasState':
          //   MUTATION = UpdateCanvasStates
          //   break
          // case 'noun':
          //   MUTATION = UpdateNouns
          //   break
          // case 'project':
          //   MUTATION = UpdateProjects
          //   break
          // case 'plan':
          //   MUTATION = UpdatePlans
          //   break
          // case 'scene':
          //   MUTATION = UpdateScenes
          //   break
          // case 'threed':
          //   MUTATION = UpdateThreeDs
          //   break
          // case 'file':
          //   MUTATION = UpdateFiles
          //   break
          // case 'allotment':
          //   MUTATION = UpdateAllotments
          //   break
          // case 'bed':
          //   MUTATION = UpdateBeds
          //   break
          // case 'plant':
          //   MUTATION = UpdatePlants
          //   break
          // case 'plantingPlan':
          //   MUTATION = UpdatePlantingPlans
          //   break
          // case 'bear':
          //   MUTATION = UpdateBears
          //   break
        }

        const parameters = {
          id: 0,
          title:`${this._type}: NUTHIN YET`,
          content: "YO YO YO",
          status: "draft",
        }

        // using mutation hook
        // const {
        //   data,
        //   loading,
        //   error,
        //   fetchMore,
        //   refetch,
        //   networkStatus
        // } = useMutation(MUTATION, { parameters }, { client })
        // console.debug(`%c🌩️ saveToDB [${this._type}]: DATA RETURNED`, data, loading, error)

        // using mutation directly
        const mutation = await client.mutation({
          mutation: MUTATION,
          variables: { parameters },
        })
        console.debug(`%c🌩️ saveToDB [${this._type}]: MUTATION RETURNED`, ccm.blue, mutation)

        const { data, loading, error } = mutation
        console.debug(`%c🌩️ saveToDB [${this._type}]: DATA RETURNED`, data, loading, error)



        return true // OR false, if unsuccessful

      // **
      } catch (ERROR) {
        if (debug) console.debug(`%c🌩️ saveToDB [${this._type}]: ERROR`, ccm.redAlert, ERROR)
        return false
      }
    },

    // get data from db via graphql query
    loadFromDB: async (client: any) => {
      // if (debug) console.clear()
      if (debug) console.debug(`%c🌩️ loadFromDB this ${this._type}`, ccm.blueAlert, this)

      // try {
        // .gql
        let QUERY = null // default? GetPreferences
        switch (this._type) {
          case 'participant':
            QUERY = GetParticipants
            break
          case 'preferences':
            QUERY = GetPreferences
            break
          case 'canvasState':
            QUERY = GetCanvasStates
            break
          case 'noun':
            QUERY = GetNouns
            break
          case 'project':
            QUERY = GetProjects
            break
          case 'plan':
            QUERY = GetPlans
            break
          case 'scene':
            QUERY = GetScenes
            break
          case 'threed':
            QUERY = GetThreeDs
            break
          // case 'file':
          //   QUERY = GetFiles
          //   break
          // case 'allotment':
          //   QUERY = GetAllotments
          //   break
          // case 'bed':
          //   QUERY = GetBeds
          //   break
          // case 'plant':
          //   QUERY = GetPlants
          //   break
          // case 'plantingPlan':
          //   QUERY = GetPlantingPlans
          //   break
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
          // ** EDGES or NODES ??
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

            // save to disk here ?? yes (if window.localStorage)
            this.actions.saveToDisk()

            // set state from db
            // this.store.update('all', ([...allPayload, ...this.store.get('all')])) // merge all nodes, past + present
            this.store.update('all', ([...allPayload])) // merge all nodes, past + present
            const nouns = this.store.get('all')
            if (debug) console.debug(`%c🌩️ loadFromDB [${this._type}] (all)`, ccm.blue, nouns)

            // this.store.update('history', ([...nouns, ...this.store.get('history')])) // merge all nodes, past + present

            // // nounCurrent (overwrite -- mutate)
            this.store.update('one', nouns[nouns.length - 1]) // node (use last one)
            // const nounDB = this.store.get('one')
            // if (debug) console.debug(`%c🌩️ loadFromDB [${this._type}] {one}`, ccm.blue, nounDB)

            // save to disk here ??? no
            // this.actions.saveToDisk()

            // // nounCurrent (overwrite -- mutate)
            // this.store.update('one', {
            //   _id: nounDB._id, // newUUID(),
            //   _ts: nounDB._ts, // new Date().toISOString(),
            //   _type: nounDB._type,
            //   // _name: nounDB.data.title,
            //   // _name: _type.toUpperCase() + ' NAME: ' + nounDB.data.title,
            //   _name: nounDB._name,
            //   // wp custom fields
            //   data: nounDB.data,
            //   // layers/levels
            //   layers: nounDB.layers,
            // })
            if (debug) console.debug(`%c🌩️ loadFromDB [${this._type}] {one} (after)`, ccm.blue, this.store.get('one'))

            // save to disk here ?? yes (if window.localStorage)
            this.actions.saveToDisk()

            // count
            // this.store.update('count', this.store.get('count') + 1) // manual
            // this.store.update('countDB', this.store.get('allDB').length) // automatic
            this.store.update('count', this.store.get('all').length)
            // this.store.update('countDB', this.store.get('all').length)
            // if (debug) console.debug(`%c🌩️ loadFromDB countDB`, ccm.blue, this.store.get('countDB'))
            // if (debug) console.debug(`%c=======================================================`, ccm.black)

            return true
          } else {
            console.debug(`%c🌩️ loadFromDB [${this._type}] NO PAYLOAD`, ccm.redAlert, data)
            return false
          }
        }

        console.debug(`%c🌩️ loadFromDB [${this._type}]: OTHER ERROR`, ccm.redAlert, data)
        return false
      // } catch (ERROR) {
      //   console.debug(`%c🌩️ loadFromDB [${this._type}]: ERROR`, ccm.redAlert, ERROR)
      //   return false
      // }
    },

    // load from data source: DB or DISK ??
    // check DISK first, then DB
    loadFromDataSource: async (client: any) => {
      const responseData = {
        isLoadedFromDisk: false,
        isLoadedFromDB: false,
      }
      responseData.isLoadedFromDisk = await this.actions.loadFromDisk(client)
      if (responseData.isLoadedFromDisk) {
        if (debug) console.debug(`%c ${this._type} loadFromDataSource isLoadedFromDisk`, ccm.blue, 'Local Disk')
        return responseData
      } else {
        responseData.isLoadedFromDB = await this.actions.loadFromDB(client)
        if (responseData.isLoadedFromDB) {
          if (debug) console.debug(`%c ${this._type} loadFromDataSource isLoadedFromDB`, ccm.blue, 'API => DB')
          return responseData
        }
      }
      // default
      if (debug) console.debug(`%c ${this._type} loadFromDataSource isLoadedFrom Nowhere`, ccm.redAlert, responseData)
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
            console.debug('%c #_r3fCanvas1 to receive JS Object: nodes', ccm.redAlert, nodes)
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
                console.debug(`%c load_PlanOfThreeDNodes_ToThreeDCanvas: ERROR`, ccm.redAlert, ERROR)
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
          console.debug('%c #_r3fCanvas to receive NOTHING', ccm.redAlert)
        return []
        return false
      // **
      } catch (ERROR) {
        if (debug || DEBUG)
          console.debug(`%c load {noun}: ERROR`, ccm.redAlert, ERROR)
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

// function preferenceStoreCustom(this: IStorePreferences, _type = 'preferences') {
//   // store params
//   this._type = _type.toLowerCase()
//   this._plural = _type // + 's'
//   this._storageItem = 'threed_' + this._type
//   this._storageItemHistory = 'threed_' + this._type + 'History'

//   // ==============================================================
//   // ** Preferences Store .store

//   // **
//   // const preferences = useReactiveVar(preferencesDataVar)
//   // const doAutoLoadDataApollo = preferencesStore.store.useStore('doAutoLoadData')
//   // const doAutoLoadDataApollo = preferences.doAutoLoadData
//   // const doAutoLoadDataApollo = this.store.get('doAutoLoadData')
//   const doAutoLoadDataApollo: boolean = false
//   // console.debug('APOLLO: ThreeDLevaControls doAutoLoadDataApollo', doAutoLoadDataApollo)
//   // const doAutoRotateApollo = preferencesStore.store.useStore('doAutoRotate')
//   // const doAutoRotateApollo = preferences.doAutoRotate
//   // const doAutoRotateApollo = this.store.get('doAutoRotate')
//   const doAutoRotateApollo: boolean = false
//   // console.debug('APOLLO: ThreeDLevaControls doAutoRotateApollo', doAutoRotateApollo)
//   // const projectNameApollo = preferencesStore.store.useStore('projectName')
//   // const projectNameApollo = preferences.projectName
//   // const projectNameApollo = this.store.get('projectName')
//   const projectNameApollo: string = ''
//   // console.debug('APOLLO: ThreeDLevaControls projectNameApollo', projectNameApollo)

//   this.store = create({
//     doAutoLoadData: doAutoLoadDataApollo, // true | false,
//     doAutoRotate: doAutoRotateApollo, // true | false,
//     projectName: projectNameApollo, // string | 'APOLLO PREFERENCES STORE: projectName'
//   })

//   // ==============================================================
//   // ** Preferences Store .actions

//   this.actions = {
//     setDoAutoLoadData: (e: boolean = false) => {
//       // this.store.update('doAutoLoadData', !this.store.get('doAutoLoadData'))
//       this.store.update('doAutoLoadData', e)
//       localStorage.setItem(
//         this._storageItem,
//         JSON.stringify({
//           subject: 'doAutoLoadData',
//           payload: this.store.get('doAutoLoadData'),
//         })
//       )
//       return this.store.get('doAutoLoadData')
//     },
//     setDoAutoRotate: (e: boolean = false) => {
//       // this.store.update('doAutoRotate', !this.store.get('doAutoRotate'))
//       this.store.update('doAutoRotate', e)
//       localStorage.setItem(
//         this._storageItem,
//         JSON.stringify({
//           subject: 'doAutoRotate',
//           payload: this.store.get('doAutoRotate'),
//         })
//       )
//       return this.store.get('doAutoRotate')
//     },
//     setProjectName: (e: string = 'nope') => {
//       this.store.update('projectName', e)
//       localStorage.setItem(
//         this._storageItem,
//         JSON.stringify({
//           subject: 'projectName',
//           payload: this.store.get('projectName'),
//         })
//       )
//       // const doModifyProjectName = client.cache.modify({
//       //   id: client.cache.identify(preferencesStore),
//       //   fields: {
//       //     name(projectName) {
//       //       return projectName.toUpperCase()
//       //     },
//       //   },
//       //   /* broadcast: false // Include this to prevent automatic query refresh */
//       // })
//       return this.store.get('projectName')
//     },
//   } // preferencesActions
// } // preferencesStoreCustom

// ==============================================================

// ** CREATE REACTIVE VARS (APOLLO LOCAL STATE)

// export const isParticipantDataSetVar = makeVar(false) // boolean: false | true
const userDataVarDefaults = {
  // api defaults
  userId: 0,
  title: 'USER DATA VAR: DEFAULT',
  content: 'juicy mastery',
  status: 'DRAFT',
  username: 'juicemaster',
  password: 'secret',
}

// export const isParticipantDataSetVar = makeVar(false) // boolean: false | true
const participantDataVarDefaults = {
  // api defaults
  participantId: 0,
  title: 'PARTICIPANT DATA VAR: DEFAULT',
  content: '',
  status: 'DRAFT',

  // custom fields
  ownerId: 1,
  version: '0.0.0',
}

// export const isPreferencesDataSetVar = makeVar(false) // boolean: false | true
const preferencesDataVarDefaults = {
  // api defaults
  id: '0',
  preferencesId: 0,
  title: 'PREFERENCES DATA VAR: DEFAULT',
  content: '',
  status: 'DRAFT',

  // custom fields
  ownerId: 1,
  version: '0.0.0',
  doAutoLoadData: false, // boolean: false | true
  doAutoRotate: false, // boolean: false | true
  // world prefs
  doWorldDebug: false, // boolean: false | true
  doWorldTesting: false, // boolean: false | true
  doWorldPhysics: false, // boolean: false | true
  doWorldControl: false, // boolean: false | true
  doWorldUnfollowCam: true, // boolean: false | true
  // home design prefs
  showPanelFirst: true, // boolean: true | false
  showPanelLast: true, // boolean: true | false
  // project prefs
  projectName: 'client should never see this string', // string: ''
  // scene prefs
  environmentPreset: 'park', // default (client should never see this)
  environmentBgBlur: 0.20, // default (our chosen maximum blur)
  // character prefs
  characterTrailColor: '#003300', // hex color
  doCharacterAnimation: true, // boolean: false | true
  
  // set functions
  // setPreferencesDataVar: () => {}, // function: set properties of "this"
}


// export const isCanvasStateSetVar = makeVar(false) // boolean: false | true
const canvasStatePaperVarDefaults: Object = {
  // api defaults
  canvasStateId: 0,
  title: 'CANVAS STATE PAPER VAR: DEFAULT',
  content: '',
  status: 'DRAFT',

  ownerId: 1,
  version: '0.0.0',

  state: {
    // ** PAPER Scope: paperjs.org/reference/paperscope/
    // ** PAPER Constructor
    // ** -- The global paper object is simply a reference to the currently active PaperScope.
    // PaperScope()
    // ** PAPER Properties
    version: '0.12.18' as string,
    settings: null as Object,
    project: null as Object,
    projects: null as Object,
    view: null as Object,
    tool: null as Object,
    tools: null as Object,
    // ** PAPER Methods
    // execute(code[, options])
    // install(scope)
    // setup(element)
    // activate()
    // ** PAPER Static Methods
    // PaperScope.get(id)
  },
  // set functions
  // setCanvasStatePaperVar: () => {}, // function: set properties of "this"
}

// ==============================================================

// export const isCanvasStateThreeDSetVar = makeVar(false) // boolean: false | true
const canvasStateThreeDVarDefaults: Object = {
  // api defaults
  canvasStateId: 0,
  title: 'CANVAS STATE THREED VAR: DEFAULT',
  content: '',
  status: 'DRAFT',

  ownerId: 1,
  version: '0.0.0',

  state: {
    // ** THREE WebGL Renderer
    gl: null as THREE.WebGLRenderer,
    // ** THREE Scene
    scene: null as THREE.Scene,
    // ** THREE Camera: Perspective | Orthographic
    camera: null as THREE.PerspectiveCamera,
    // ** THREE Properties
    // ** controls	A [makeDefault] *Controls	THREE.EventDispatcher or null
    controls: null as THREE.EventDispatcher,
    // ** raycaster	Default raycaster	THREE.Raycaster
    raycaster: null as THREE.Raycaster,
    // ** pointer	Contains updated, normalized, centric pointer coordinates	THREE.Vector2
    pointer: null as THREE.Vector2,
    // ** clock	Running system clock	THREE.Clock
    clock: null as THREE.Clock,
    // ** THREE Canvas size in pixels
    size: { 
      width: 0 as number, 
      height: 0 as number, 
      top: 0 as number, 
      left: 0 as number, 
      updateStyle: false as boolean 
    },
    // ** set	Allows you to set any state property	(state: SetState<RootState>) => void
    // set: null as void,
    // ** get	Allows you to retrieve any state property non-reactively	() => GetState<RootState>
    // get: null as void,

    // ** state property definitions
    // gl	Renderer	THREE.WebGLRenderer
    // scene	Scene	THREE.Scene
    // camera	Camera	THREE.PerspectiveCamera
    // controls	A [makeDefault] *Controls	THREE.EventDispatcher or null
    // raycaster	Default raycaster	THREE.Raycaster
    // pointer	Contains updated, normalized, centric pointer coordinates	THREE.Vector2
    // clock	Running system clock	THREE.Clock
    // linear	True when the colorspace is linear	boolean
    // flat	True when no tonemapping is used	boolean
    // legacy	Disables global color management via THREE.ColorManagement	boolean
    // frameloop	Render mode: always, demand, never	always, demand, never
    // performance	System regression	{ current: number, min: number, max: number, debounce: number, regress: () => void }
    // size	Canvas size in pixels	{ width: number, height: number, top: number, left: number, updateStyle?: boolean }
    // viewport	Canvas viewport size in three.js units. Note: This is different from gl.getViewport which returns the drawbuffer size	{ width: number, height: number, initialDpr: number, dpr: number, factor: number, distance: number, aspect: number, getCurrentViewport: (camera?: Camera, target?: THREE.Vector3, size?: Size) => Viewport }
    // xr	XR interface, manages WebXR rendering	{ connect: () => void, disconnect: () => void }
    // set	Allows you to set any state property	(state: SetState<RootState>) => void
    // get	Allows you to retrieve any state property non-reactively	() => GetState<RootState>
    // invalidate	Request a new render, given that frameloop === 'demand'	() => void
    // advance	Advance one tick, given that frameloop === 'never'	(timestamp: number, runGlobalEffects?: boolean) => void
    // setSize	Resize the canvas	(width: number, height: number, updateStyle?: boolean, top?: number, left?: number) => void
    // setDpr	Set the pixel-ratio	(dpr: number) => void
    // setFrameloop	Shortcut to set the current render mode	(frameloop?: 'always', 'demand', 'never') => void
    // setEvents	Shortcut to setting the event layer	(events: Partial<EventManager<any>>) => void
    // onPointerMissed	Response for pointer clicks that have missed a target	() => void
    // events	Pointer-event handling	{ connected: TargetNode, handlers: Events, connect: (target: TargetNode) => void, disconnect: () => void }

    // ** examples
    // advance: function advance(timestamp, runGlobalEffects)​​
    // camera: Object { isObject3D: true, uuid: "11e47621-59c8-xxx", type: "PerspectiveCamera" }
    // clock: Object { autoStart: true, startTime: 7005, oldTime: 17507 }
    // controls: null
    // events: Object { priority: 1, enabled: true, compute: compute(event, state, previous) }
    // flat: false
    // frameloop: "always"
    // get: function getState()​​
    // gl: Object { isWebGLRenderer: true, autoClear: true, autoClearColor: true }
    // internal: Object { active: false, priority: 0, frames: 0 }
    // invalidate: function invalidate(frames)
    // legacy: false
    // linear: false
    // onPointerMissed: function onPointerMissed(args)​​
    // performance: Object { current: 1, min: 0.5, max: 1 }
    // pointer: Object { x: 0.973346743776716, y: 0.24613951964073832 }
    // previousRoot: undefined
    // raycaster: Object { ray: {}, near: 0, far: Infinity }
    // scene: Object { isObject3D: true, uuid: "bc359d14-2566-4839-b743-b302632761be", type: "Scene" }
    // set: function setState(partial, replace)​​
    // setDpr: function setDpr(dpr)​​
    // setEvents: function setEvents(events)​​
    // setFrameloop: function setFrameloop(frameloop)​​
    // setSize: function setSize(width, height, updateStyle, top, left)​​
    // size: Object { width: 994.25, height: 411.2166748046875, top: 89.5 }
    // viewport: Object { initialDpr: 1, dpr: 1, width: 18.552624553963852 }
    // xr: Object { connect: connect(), disconnect: disconnect() }
  },
  // set functions
  // setCanvasStateThreeDVar: () => {}, // function: set properties of "this"
}

// ==============================================================

// ==============================================================
// ** MUTATIONS
export const createPreferences = CreatePreferences
  // console.debug('APOLLO: createPreferences', createPreferences)
  // console.debug('APOLLO: createPreferences', '[MM] TODO')
export const updatePreferences = UpdatePreferences
  // console.debug('APOLLO: updatePreferences', updatePreferences)
  // console.debug('APOLLO: updatePreferences', '[MM] TODO')

// ==============================================================

// ==============================================================
// ** STORES

// ** Construct Stores + Export as Group of Stores
export { nounStore }
// export const nounStore = new (nounStore as any)('noun')
  // console.debug('APOLLO: nounStore', nounStore)
export const userStore = new (nounStore as any)('user')
  // console.debug('APOLLO: userStore', userStore)
export const participantStore = new (nounStore as any)('participant')
  // console.debug('APOLLO: participantStore', participantStore)
export const preferencesStore = new (nounStore as any)('preferences')
  // console.debug('APOLLO: preferencesStore', preferencesStore)
  // console.debug('APOLLO: preferencesStore.store.getState()', preferencesStore.store.getState())
  // console.debug('APOLLO: preferencesStore.store.get(one) #1', preferencesStore.store.get('one').data)
  // const initialPreferences = async () => await preferencesStore.actions.loadFromDataSource()
  // console.debug('APOLLO: preferencesStore.actions.loadFromDataSource()', initialPreferences())
    // const initialPreferences = async () => await preferencesStore.store.get('one').data
      // console.debug('APOLLO: initialPreferences', initialPreferences())
      // console.debug('APOLLO: preferencesStore.store.get(one) #2', preferencesStore.store.get('one').data)
    // EXTEND nounStore to become preferencesStoreCustom
    // export const preferencesStore = new (preferenceStoreCustom as any)('preferences')
export const canvasStateStore = new (nounStore as any)('canvasState')
  // console.debug('APOLLO: canvasStateStore', canvasStateStore)
// other regular nouns
export const sceneStore = new (nounStore as any)('scene')
export const projectStore = new (nounStore as any)('project')
export const planStore = new (nounStore as any)('plan')
export const threedStore = new (nounStore as any)('threed')
export const fileStore = new (nounStore as any)('file')
export const allotmentStore = new (nounStore as any)('allotment')
export const bedStore = new (nounStore as any)('bed')
export const plantStore = new (nounStore as any)('plant')
export const plantingPlanStore = new (nounStore as any)('plantingPlan')
// ** MODAL STORES
export { modalStore }
// export const modalStore = new (modalStore as any)()
export const modalAboutStore = new (modalStore as any)('modalAbout')
export const modalModel3dStore = new (modalStore as any)('modalModel3d')
export const modalLoadingStore = new (modalStore as any)('modalLoading')
export const modalShareStore = new (modalStore as any)('modalShare')
export const modalStoreNoun = new (nounStore as any)('modal')

// ** export NOUN STORES
export const stores = {
  nounStore,
  userStore,
  participantStore,
  preferencesStore,
  canvasStateStore,
  projectStore,
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

// ==============================================================
// ** REACTIVE VARS

// ** user(s)
export const userDataVar = makeVar(userDataVarDefaults)
  // console.debug('APOLLO: userDataVar()', userDataVar())
export const isUserDataSetVar = makeVar(false) // boolean: false | true
  // console.debug('APOLLO: isUserDataSetVar()', isUserDataSetVar())

// ** participant(s)
export const participantDataVar = makeVar(participantDataVarDefaults)
  // console.debug('APOLLO: participantDataVar()', participantDataVar())
export const isParticipantDataSetVar = makeVar(false) // boolean: false | true
  // console.debug('APOLLO: isParticipantDataSetVar()', isParticipantDataSetVar())

// ** preferences(s)
export const preferencesDataVar = makeVar(preferencesDataVarDefaults)
  // console.debug('APOLLO: preferencesDataVar()', preferencesDataVar())
export const isPreferencesDataSetVar = makeVar(false) // boolean: false | true
  // console.debug('APOLLO: isPreferencesDataSetVar()', isPreferencesDataSetVar())

// ** canvasStatePaper(s)
export const canvasStatePaperVar = makeVar(canvasStatePaperVarDefaults)
  // console.debug('APOLLO: canvasStatePaperVar()', canvasStatePaperVar())
export const isCanvasStatePaperSetVar = makeVar(false) // boolean: false | true
  // console.debug('APOLLO: isCanvasStatePaperSetVar()', isCanvasStatePaperSetVar())
  
// ** canvasStateThreeD(s)
export const canvasStateThreeDVar = makeVar(canvasStateThreeDVarDefaults)
  // console.debug('APOLLO: canvasStateThreeDVar()', canvasStateThreeDVar())
  // console.debug('APOLLO: canvasStateThreeDVar().state.scene', canvasStateThreeDVar().state.scene)
export const isCanvasStateThreeDSetVar = makeVar(false) // boolean: false | true
  // console.debug('APOLLO: isCanvasStatePaperSetVar()', isCanvasStatePaperSetVar())

// ** loaded?(s)
export const isPaperCanvasLoadedVar = makeVar(false) // boolean: false | true
  // console.debug('APOLLO: isPaperCanvasLoadedVar()', isPaperCanvasLoadedVar())
export const isThreeDCanvasLoadedVar = makeVar(false) // boolean: false | true
  // console.debug('APOLLO: isThreeDCanvasLoadedVar()', isThreeDCanvasLoadedVar())

// ** export REACTIVE VARS
export const reactiveVars = {
  userDataVar, isUserDataSetVar,
  participantDataVar, isParticipantDataSetVar,
  preferencesDataVar, isPreferencesDataSetVar,
  canvasStatePaperVar, isCanvasStatePaperSetVar, isPaperCanvasLoadedVar,
  canvasStateThreeDVar, isCanvasStateThreeDSetVar, isThreeDCanvasLoadedVar,
}

// export QUERIES
// ** GraphQL Queries + Mutations (here, locally-specific data needs)
export const queries = {
  GetNouns,
  GetUsers,
  GetParticipants,
  GetPreferences,
  GetCanvasStates,
  GetProjects,
  GetPlans,
  GetScenes,
  GetThreeDs,
  // GetFiles,
  // GetAllotments,
  // GetBeds,
  // GetPlants,
  // GetPlantingPlans,
}

// :) [MM] THREED MILESTONE
// export MUTATIONS

// ** JWT AUTH + REFRESH
export const registerUser = RegisterUser
export const loginUser = LoginUser
export const refreshJwtAuthToken = RefreshJwtAuthToken

export const mutations = {
  // UpdateNouns: UpdateNouns,
  // UpdateUsers: UpdateUsers,
  // UpdateParticipants: UpdateParticipants,
  UpdatePreferences: UpdatePreferences,
  // UpdateCanvasStates: UpdateCanvasStates,
  // UpdateProjects: UpdateProjects,
  // UpdatePlans: UpdatePlans,
  // UpdateThreeDs: UpdateThreeDs,
  // UpdateFiles: UpdateFiles,
  // UpdateAllotments: UpdateAllotments,
  // UpdateBeds: UpdateBeds,
  // UpdatePlants: UpdatePlants,
  // UpdatePlantingPlans: UpdatePlantingPlans,
}

// export DEFAULT
// export { stores, queries, mutations }
export default stores
