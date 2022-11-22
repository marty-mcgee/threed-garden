// ==========================================================
// RESOURCES

// ** Apollo Client 3 -- Cache Store Imports
import create from '~/api/graphql/createStore'

// ** GraphQL Queries + Mutations (here, locally-specific data needs)
import GetNouns from '~/api/graphql/scripts/getNouns.gql'
import GetProjects from '~/api/graphql/scripts/getProjects.gql'
import GetPlans from '~/api/graphql/scripts/getPlans.gql'
import GetWorkspaces from '~/api/graphql/scripts/getWorkspaces.gql'
import GetThreeDs from '~/api/graphql/scripts/getThreeDs.gql'
import GetFiles from '~/api/graphql/scripts/getFiles.gql'
import GetScenes from '~/api/graphql/scripts/getScenes.gql'
import GetAllotments from '~/api/graphql/scripts/getAllotments.gql'
import GetBeds from '~/api/graphql/scripts/getBeds.gql'
import GetPlants from '~/api/graphql/scripts/getPlants.gql'
import GetPlantingPlans from '~/api/graphql/scripts/getPlantingPlans.gql'

// ** UUID Imports
import { v4 as newUUID } from 'uuid'

// [MM] COLORFUL CONSOLE MESSAGES (ccm)
import { ccm0, ccm1, ccm2, ccm3, ccm4, ccm5 } from '~/@core/utils/console-colors'
// console.debug(`%cSUCCESS!!`, ccm1)
// console.debug(`%cWHOOPSIES`, ccm2)

// ==========================================================
// IMPORTS COMPLETE
console.debug(`%c====================================`, ccm5)
console.debug(`%c🥕 ThreeDGarden<FC,R3F>: {stores}`, ccm4)
console.debug(`%c====================================`, ccm5)

// ==============================================================
// ==============================================================
// ==============================================================
// ** Noun Object -- Constructor Function
// -- returns new noun

function noun(_type = 'noun') {
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
// -- returns new nounStore

function nounStore(_type = 'noun') {
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
    one: new noun(this._type), // {}, // the current workspace noun, aka 'this one noun'

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
      return (state) => state
    },

    toggleIsVisible: () => {
      return (state) => !state
    },

    increaseCount: (n = 1) => {
      return (state) => state + n
    },

    decreaseCount: (n = 1) => {
      return (state) => state - n
    },

    // redundant (but useful ???)
    getState: () => {
      return this.store.getState()
    },

    removeAll: () => {
      localStorage.removeItem(this._storageItem)
      this.store.update('all', [])
      this.store.update('one', {})
      this.store.update('count', 0)
      this.store.update('allDB', [])
      this.store.update('oneDB', {})
      this.store.update('countDB', 0)
      console.debug(`%cremoveAll [${this._type}]`, ccm2, true)
    },

    // add a new current 'this' noun
    addNew: () => {
      // console.debug(`this`, this)
      console.debug(`%caddNew [${this._type}] (before)`, ccm1, this.store.get('all'))
      // throw new Error(`[MM] testing... this`)

      // create a new one
      if (Object.keys(this.store.get('one')).length === 0) {
        try {
          this.store.update('one', new noun(this._type))
        } catch (err) {
          console.error(`%caddNew {${this._type}} err`, err)
        }
      }
      // save + update old one
      else {
        // nounHistory (save existing before mutating, if not empty)
        this.store.update('all', [this.store.get('one'), ...this.store.get('all')])
        console.debug(`%caddNew [${this._type}] (during)`, ccm1, this.store.get('all'))

        // count
        // this.store.update('count', this.store.get('count') + 1) // manual
        this.store.update('count', this.store.get('all').length) // automatic
        // console.debug(`%caddNew {count}`, ccm3, this.store.get('count'))
        // console.debug(`%caddNew [${this._type}]`, ccm3, this.store.get('all').length)

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
      console.debug(`%caddNew {${this._type}} (added)`, ccm1, this.store.get('one'))

      // nounHistory (save recently mutated new one and all old ones)
      this.store.update('all', [this.store.get('one'), ...this.store.get('all')])
      console.debug(`%caddNew [${this._type}] (after)`, ccm1, this.store.get('all'))

      // count (for fun/learning)
      // this.store.update('count', this.store.get('count') + 1) // manual
      this.store.update('count', this.store.get('all').length) // automatic
      console.debug(`%caddNew {count}`, ccm3, this.store.get('count'))
      // console.debug(`%caddNew {${this._type}}`, ccm3, this.store.get('all').length)

      // saveToDisk
      this.actions.saveToDisk()
      // loadFromDisk
      // this.actions.loadFromDisk()

      console.debug(`%caddNew [${this._type}] (final)`, ccm1, this.store.get('one'))
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
        console.debug(`%csaveToDisk [${this._type}]`, ccm1, this.store.get('all'))
        return true
      } catch (err) {
        console.debug(`%csaveToDisk [${this._type}] err`, ccm2, err)
        return false
      }
    },

    // get data from browser local storage
    loadFromDisk: () => {
      try {
        const query = JSON.parse(localStorage.getItem(this._storageItem))
        if (query) {
          console.debug(`%cloadFromDisk [${this._type}] QUERY?`, ccm3, query)
          const { payload } = query
          console.debug(`%cloadFromDisk [${this._type}] QUERY.PAYLOAD?`, ccm3, payload)

          if (payload.length) {
            // console.debug(`%cloadFromDisk [${this._type}]`, ccm3, true, payload)

            this.store.update('all', [...payload]) // payload should have .data{}
            console.debug(`%cloadFromDisk [${this._type}s] (after)`, ccm3, this.store.get('all'))

            this.store.update('one', this.store.get('all')[0])
            console.debug(`%cloadFromDisk {${this._type}} (after)`, ccm3, this.store.get('one'))

            return true
          } else {
            console.debug(`%cloadFromDisk [${this._type}] EMPTY QUERY.PAYLOAD?`, ccm3, query)
          }
        } else {
          console.debug(`%cloadFromDisk [${this._type}] NOTHING TO LOAD`, ccm3, query)
        }
        return false
      } catch (err) {
        console.debug(`%cloadFromDisk [${this._type}] err`, ccm2, err)
        return false
      }
    },

    // save data to db via graphql mutation
    saveToDB: async (client) => {
      try {
        console.debug(`%csaveToDB [${this._type}] client`, ccm2, client)

        console.debug(`%csaveToDB [${this._type}]`, ccm2, false)
        return false
      } catch (err) {
        console.debug(`%csaveToDB [${this._type}]: err`, ccm3, err)
        return false
      }
    },

    // get data from db via graphql query
    loadFromDB: async (client) => {
      try {
        // const _this = this
        console.debug(`%cloadFromDB this`, ccm0, this)

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
          case 'bear':
            QUERY = GetBears
            break
        }

        const parameters = {
          first: 10,
          last: null,
          after: null,
          before: null,
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
          // return <div>loading...</div>
        }

        if (error) {
          console.debug(`%cloadFromDB [${this._type}]: DATA RETURNED with error`, error)
          return <div>{JSON.stringify(error.message)}</div>
        }

        if (data) {
          console.debug(`%cloadFromDB [${this._type}]: DATA RETURNED`, ccm0, data, loading, error)

          if (data[this._plural]?.edges?.length) {
            // const payload = data[this._plural].edges
            const payload = data[this._plural].edges.map(
              ({ node }) =>
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
            const all = payload.map((node) => {
              const one = new noun(this._type)
              one.data = node
              return one
            })
            console.debug(`%cloadFromDB [${this._type}]`, ccm3, all)

            // set state from db
            this.store.update('all', [...all]) // nodes
            const nouns = this.store.get('all')
            console.debug(`%cloadFromDB [${this._type}] (after)`, ccm3, nouns)

            this.store.update('oneDB', nouns[nouns.length - 1]) // node (use last one)
            const nounDB = this.store.get('oneDB')
            console.debug(`%cloadFromDB [${this._type}] {oneDB}`, ccm1, nounDB)

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
            console.debug(`%cloadFromDB [${this._type}] {one} (after)`, ccm1, this.store.get('one'))

            this.store.update('countDB', this.store.get('all').length)
            console.debug(`%cloadFromDB countDB`, ccm1, this.store.get('countDB'))
            console.debug(`%c====================================`, ccm5)

            // save to disk
            this.actions.saveToDisk()

            return true
          } else {
            console.debug(`%cloadFromDB [${this._type}]: data.${this._plural}.edges.length = 0`, ccm3, data)
            return false
          }
        }

        console.debug(`%cloadFromDB [${this._type}]: OTHER ERROR`, ccm3, data)
        return false
      } catch (err) {
        console.debug(`%cloadFromDB [${this._type}]: err`, ccm3, err)
        return false
      }
    },

    // load 'this' noun into React Three Fiber view
    loadToWorkspace: (noun, _type, _id, _r3fCanvas) => {
      try {
        const nounAlt = this.store.get('one')
        console.debug(`%cload {noun}`, ccm1, noun)
        console.debug(`%cload {nounAlt}`, ccm1, nounAlt)

        if (noun) {
          return <div>...noun as r3f component...</div>
        }

        return false
      } catch (err) {
        console.debug(`%cload {noun}: err`, ccm3, err)
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

function modal(_type = 'modal') {
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
// -- returns new modalStore

function modalStore(_type = 'modal') {
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
    toggleIsVisible: (e = null) => {
      this.store.update('isVisible', !this.store.get('isVisible'))
      localStorage.setItem(
        this._storageItem,
        JSON.stringify({
          subject: isVisible,
          payload: this.store.get('isVisible'),
        })
      )
    },
    handleOpen: (e = null) => {
      this.store.update('isVisible', true)
      localStorage.setItem(
        this._storageItem,
        JSON.stringify({
          subject: isVisible,
          payload: true,
        })
      )
    },
    handleClose: (e = null) => {
      this.store.update('isVisible', false)
      localStorage.setItem(
        this._storageItem,
        JSON.stringify({
          subject: isVisible,
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

const stores = {
  nounStore,
  // nounStore: new nounStore('noun'),
  projectStore: new nounStore('project'),
  workspaceStore: new nounStore('workspace'),
  planStore: new nounStore('plan'),
  threedStore: new nounStore('threed'),
  fileStore: new nounStore('file'),
  sceneStore: new nounStore('scene'),
  allotmentStore: new nounStore('allotment'),
  bedStore: new nounStore('bed'),
  plantStore: new nounStore('plant'),
  plantingPlanStore: new nounStore('plantingPlan'),
  bearStore: new nounStore('bear'),
  modalStore,
  // modalStore: new modalStore(),
  modalAboutStore: new modalStore('modalAbout'),
  modalModel3dStore: new modalStore('modalModel3d'),
  modalLoadingStore: new modalStore('modalLoading'),
  modalShareStore: new modalStore('modalShare'),
  modalStoreNoun: new nounStore('modal'),
}

export default stores
