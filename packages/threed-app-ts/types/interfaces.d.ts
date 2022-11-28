export type Page = {
  title: {
    rendered: string
  }
}

type Rendered = {
  rendered: string
}

// =================

// declare module "@threed/garden/cpt" {
interface IProps {
  userAgent?: string
}

interface IPage {
  title: Rendered
  userAgent?: string
}

interface IEvent {
  title: Rendered
}

interface IScene {
  title: {
    rendered: string
  }
}

interface IAllotment {
  title: {
    rendered: string
  }
}

interface IBed {
  title: {
    rendered: string
  }
}

interface IPlant {
  title: {
    rendered: string
  }
}

interface IPlantingPlan {
  title: {
    rendered: string
  }
}
// } // end declare module

export { IProps, IPage, IEvent, IScene, IAllotment, IBed, IPlant, IPlantingPlan }

// =================
// https://stackoverflow.com/questions/37263357/

interface IWords {
  [key: string]: string
}

interface INumbers {
  [key: string]: number
}

interface IBooleans {
  [key: string]: boolean
}

interface IValues {
  [key: string]: string | number
}

interface IStructures {
  [key: string]: INumbers | IBooleans | IValues
}

export { IWords, INumbers, IBooleans, IValues, IStructures }
