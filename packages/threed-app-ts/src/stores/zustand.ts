// ** Zustand + Zustood + Immer Imports
// state management (instead of React.useState or Redux)
import create from "zustand"
import shallow from "zustand/shallow"
import { subscribeWithSelector } from "zustand/middleware"
import { createStore } from '@udecode/zustood'
import produce from "immer"

// ** UUID Imports
import { v4 as newUUID } from "uuid"

// ==========================================================
// [MM] COLORFUL CONSOLE MESSAGES (ccm)
const ccm0 = "color: white; font-size: 12px;"
const ccm1 = "color: green; font-size: 12px;"
const ccm2 = "color: red; font-size: 12px;"
const ccm3 = "color: orange; font-size: 12px;"
const ccm4 = "color: yellow; font-size: 12px;"
const ccm5 = "color: blue; font-size: 12px;"
console.log("%cThreeDGarden<FC,R3F> zustand", ccm1)
// console.log("%cWHOOPSIES", ccm2)
// ==========================================================

const useStoreImpl = create(() => {
  return {
    router: null,
    dom: null,
  }
})

const useStoreImpl2 = create(() => {
  return {
    router: null,
    dom: null,
  }
})

// ==============================================================
// ThreeD
// aka "Master File with Settings"

// export ??
export const useThreeDStore = create((set, get, api) => ({
  _id: newUUID() as string,
  _ts: new Date().toISOString() as string,
  threedCount: 0,
  threeds: [],
  threed: {
    _id: newUUID() as string,
    _ts: new Date().toISOString() as string,
    name: "HEY HEY HEY 0",
    layers: new Array,
    activeLayer: {
      name: "level0-MM",
      data: {}
    }
  },
  increaseThreeDCount: () => set(
    (state: any) => (
      { threedCount: state.threedCount + 1 }
    )
  ),
  removeAllThreeDs: () => set(
    {
      threedCount: 0,
      threeds: []
    }
  ),
  addThreeD: ({ set, get }: { set: any, get: any }) => {
    // threedCurrent
    set(
      (state: any) => (
        {
          threed: {
            _id: newUUID() as string,
            _ts: new Date().toISOString() as string,
            name: "HEY HEY HEY 1",
            layers: new Array,
            activeLayer: {
              name: "level1-MM",
              data: {}
            }
          },
          threedCount: state.threedCount + 1,
        }
      )
    )
    // threedHistory
    set(
      (state: any) => (
        {
          threeds: [state.threed, ...state.threeds],
          threedCount: state.threeds.length,
        }
      )
    )
    // saveToDisk
    get().saveToDisk()
    // loadFromDisk
    get().loadFromDisk()

    console.debug("%cAddThreeD", ccm1, get().threed)
  },
  saveProject: ({ set, get }: { set: any, get: any }) => {
    // saveToDisk
    get().saveToDisk()
  },
  saveToDisk: ({ set, get }: { set: any, get: any }) => {
    try {
      localStorage.setItem("threed_threedHistory", JSON.stringify({ subject: "threed", payload: get().threed }))
      console.debug("%cSaveToDisk", ccm1, get().threed)
      return true
    } catch (err) {
      console.debug("%cSaveToDisk", ccm3, err)
      return false
    }
  },
  loadFromDisk: ({ set, get }: { set: any, get: any }) => {
    try {
      const loaded = localStorage.getItem("threed_threedHistory")
      if (loaded) {
        console.debug("%cLoadFromDisk", ccm1, true) // loaded
        return loaded // string[]
      }
      console.debug("%cLoadFromDisk", ccm3, loaded)
      return false
    } catch (err) {
      console.debug("%cLoadFromDisk", ccm3, err)
      return false
    }
  }

})) // useThreeDStore

// ==============================================================
// Project

export const useProjectStore = create((set, get) => ({
  _id: newUUID() as string,
  _ts: new Date().toISOString() as string,
  projectCount: 0,
  projects: [],
  project: {
    _id: newUUID() as string,
    _ts: new Date().toISOString() as string,
    layers: new Array,
    activeLayer: {
      name: "level0-MM",
      data: {}
    }
  },
  increaseProjectCount: () => set(
    (state: any) => (
      { projectCount: state.projectCount + 1 }
    )
  ),
  removeAllProjects: () => set(
    {
      projectCount: 0,
      projects: []
    }
  ),
  addProject: ({ set, get }: { set: any, get: any }) => {
    // projectCurrent
    set(
      (state: any) => (
        {
          project: {
            _id: newUUID() as string,
            _ts: new Date().toISOString() as string,
            layers: new Array,
            activeLayer: {
              name: "level1-MM",
              data: {}
            }
          },
          projectCount: state.projectCount + 1,
        }
      )
    )
    // projectHistory
    set(
      (state: any) => (
        {
          projects: [state.project, ...state.projects],
          projectCount: state.projects.length,
        }
      )
    )
    // saveToDisk
    get().saveToDisk()
    // loadFromDisk
    get().loadFromDisk()

    console.debug("%cAddProject", ccm1, get().project)
  },
  saveProject: ({ set, get }: { set: any, get: any }) => {
    // saveToDisk
    get().saveToDisk()
  },
  saveToDisk: ({ set, get }: { set: any, get: any }) => {
    try {
      localStorage.setItem("threed_projectHistory", JSON.stringify({ subject: "projects", payload: get().projects }))
      console.debug("%cSaveToDisk", ccm1, get().projects)
      return true
    } catch (err) {
      console.debug("%cSaveToDisk", ccm3, err)
      return false
    }
  },
  loadFromDisk: ({ set, get }: { set: any, get: any }) => {
    try {
      const loaded = localStorage.getItem("threed_projectHistory")
      if (loaded) {
        console.debug("%cLoadFromDisk", ccm1, true) // loaded
        return loaded // string[]
      }
      console.debug("%cLoadFromDisk", ccm3, loaded)
      return false
    } catch (err) {
      console.debug("%cLoadFromDisk", ccm3, err)
      return false
    }
  }

})) // useProjectStore

// ==============================================================
// Plan

// export ??
export const usePlanStore = create((set, get) => ({
  _id: newUUID() as string,
  _ts: new Date().toISOString() as string,
  planCount: 0,
  plans: [],
  plan: {
    _id: newUUID() as string,
    _ts: new Date().toISOString() as string,
    levels: [{ id: 0, height: 0 }] as Object[],
    // levels[0]: { id: 0, height: 0 },
    floors: [] as Object[],
    roofs: [] as Object[],
    walls: [] as Object[],
    dimensions: [] as Object[],
    texts: [] as Object[],
    furniture: [] as Object[],

    verticalGuides: [] as Object[],
    horizontalGuides: [] as Object[],

    furnitureAddedKey: null as any,
    furnitureDirtyKey: null as any,
    furnitureDeletedKey: null as any,
    wallAddedKey: null as any,
    wallDirtyKey: null as any,
    wallDeletedKey: null as any,
    roofAddedKey: null as any,
    roofDirtyKey: null as any,
    roofDeletedKey: null as any,
    floorAddedKey: null as any,
    floorDirtyKey: null as any,
    floorDeletedKey: null as any,
    dimensionAddedKey: null as any,
    dimensionEditedKey: null as any,
    dimensionDeletedKey: null as any,
    textAddedKey: null as any,
    textEditedKey: null as any,
    textDeletedKey: null as any,

    wallDiffuse: null as string,
    wallOpacity: null as number,
    wallSpecular: null as string,
    roofDiffuse: null as string,
    roofOpacity: null as number,
    roofSpecular: null as string,
    floorDiffuse: null as string,
    floorOpacity: null as number,
    floorSpecular: null as string,
    groundDiffuse: null as string,
    groundOpacity: null as number,
    groundSpecular: null as string,

    depthWrite: null as any,
    sortObjects: null as any,

    azimuth: null as number,
    inclination: null as number
  },
  increasePlanCount: () => set(
    (state: any) => (
      { planCount: state.planCount + 1 }
    )
  ),
  removeAllPlans: () => set(
    {
      planCount: 0,
      plans: []
    }
  ),
  addPlan: ({ set, get }: { set: any, get: any }) => {
    // planCurrent
    set(
      (state: any) => (
        {
          plan: {
            _id: newUUID() as string,
            _ts: new Date().toISOString() as string,
            levels: [{ id: 0, height: 0 }] as Object[],
            // levels[0]: { id: 0, height: 0 },
            floors: [] as Object[],
            roofs: [] as Object[],
            walls: [] as Object[],
            dimensions: [] as Object[],
            texts: [] as Object[],
            furniture: [] as Object[],

            verticalGuides: [] as Object[],
            horizontalGuides: [] as Object[],

            furnitureAddedKey: null as any,
            furnitureDirtyKey: null as any,
            furnitureDeletedKey: null as any,
            wallAddedKey: null as any,
            wallDirtyKey: null as any,
            wallDeletedKey: null as any,
            roofAddedKey: null as any,
            roofDirtyKey: null as any,
            roofDeletedKey: null as any,
            floorAddedKey: null as any,
            floorDirtyKey: null as any,
            floorDeletedKey: null as any,
            dimensionAddedKey: null as any,
            dimensionEditedKey: null as any,
            dimensionDeletedKey: null as any,
            textAddedKey: null as any,
            textEditedKey: null as any,
            textDeletedKey: null as any,

            // wallDiffuse: wallMaterial.color.getHexString(),
            // wallOpacity: wallMaterial.opacity,
            // wallSpecular: wallMaterial.specular.getHexString(),
            // roofDiffuse: roofMaterial.color.getHexString(),
            // roofOpacity: roofMaterial.opacity,
            // roofSpecular: roofMaterial.specular.getHexString(),
            // floorDiffuse: floorMaterial.color.getHexString(),
            // floorOpacity: floorMaterial.opacity,
            // floorSpecular: floorMaterial.specular.getHexString(),
            // groundDiffuse: groundMaterial.color.getHexString(),
            // groundOpacity: groundMaterial.opacity,
            // groundSpecular: groundMaterial.specular.getHexString(),

            depthWrite: "checked", // document.getElementById("depthWriteMode").checked,
            sortObjects: "checked", // document.getElementById("sortObjectsMode").checked,

            // azimuth: azimuth,
            // inclination: inclination
          },
          planCount: state.planCount + 1
        }
      )
    )
    // planHistory
    set(
      (state: any) => (
        {
          plans: [state.plan, ...state.plans],
          planCount: state.plans.length,
        }
      )
    )
    // saveToDisk
    get().saveToDisk()
    // loadFromDisk
    get().loadFromDisk()

    console.debug("%cAddPlan", ccm1, get().plan)
  },
  savePlan: ({ set, get }: { set: any, get: any }) => {
    // saveToDisk
    get().saveToDisk()
  },
  saveToDisk: ({ set, get }: { set: any, get: any }) => {
    try {
      localStorage.setItem("threed_planHistory", JSON.stringify({ subject: "plans", payload: get().plans }))
      console.debug("%cSaveToDisk", ccm1, get().plans)
      return true
    } catch (err) {
      console.debug("%cSaveToDisk", ccm3, err)
      return false
    }
  },
  loadFromDisk: ({ set, get }: { set: any, get: any }) => {
    try {
      const loaded = localStorage.getItem("threed_planHistory")
      if (loaded) {
        console.debug("%cLoadFromDisk", ccm1, true) // loaded
        return loaded // string[]
      }
      console.debug("%cLoadFromDisk", ccm3, loaded)
      return false
    } catch (err) {
      console.debug("%cLoadFromDisk", ccm3, err)
      return false
    }
  }

})) // usePlanStore

// ==============================================================
// File

export const useFileStore = create((set) => ({
  fileCount: 0,
  files: [],
  file: {},
})) // useFileStore

// ==============================================================
// Bear

export const useBearStore = create((set) => ({
  bears: 0,
  increaseBearCount: () => set((state: any) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
})) // useBearStore

// ==============================================================
// Modal

export const modalStore = createStore('modal')({
  name: 'zustood',
  isOpenModalAbout: false,
  // handleOpenModalAbout: () => set(() => ({ isOpenModalAbout: true })),
  // handleCloseModalAbout: () => set(() => ({ isOpenModalAbout: false }))
  isOpenModalModel3d: false,
  isOpenModalLoading: false,
  isOpenModalShare: false,
})

export const useModalStore = create((set, get) => ({
  name: 'zustand',
  isOpenAboutModal: false,
  handleOpenAboutModal: () => set(() => ({ isOpenAboutModal: true })),
  handleCloseAboutModal: () => set(() => ({ isOpenAboutModal: false })),
  isOpenModel3dModal: false,
  handleOpenModel3dModal: () => set(() => ({ isOpenModel3dModal: true })),
  handleCloseModel3dModal: () => set(() => ({ isOpenModel3dModal: false })),
  isOpenLoadingModal: false,
  handleOpenLoadingModal: () => set(() => ({ isOpenLoadingModal: true })),
  handleCloseLoadingModal: () => set(() => ({ isOpenLoadingModal: false })),
  isOpenShareModal: false,
  handleOpenShareModal: () => set(() => ({ isOpenShareModal: true })),
  handleCloseShareModal: () => set(() => ({ isOpenShareModal: false })),
}))

// ==============================================================
// EXPORT STORES AS GROUP OBJECT "useStore" (as a HOOK ??)

export const useStore = (sel: any) => useStoreImpl(sel, shallow)
Object.assign(useStore,
  {
    useStoreImpl,
    useStoreImpl2,
    //
    useThreeDStore,
    useProjectStore,
    usePlanStore,
    useFileStore,
    useBearStore,
    useModalStore,
    modalStore
  }
)

// ==============================================================

const { getState, setState } = useStoreImpl

export { getState, setState }

export default useStore
