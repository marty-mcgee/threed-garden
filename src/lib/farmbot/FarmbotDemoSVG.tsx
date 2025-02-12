import { FC } from 'react'
import parse from 'html-react-parser'
import FarmbotSVG from '#/lib/farmbot/FarmbotSVG'

const dirtyHTML = FarmbotSVG
const parseHTML = parse(dirtyHTML)

const FarmbotDemoSVG: FC = (): React.ReactNode => {
  // hey hey hey
  return <>{parseHTML}</>
  // return <>{dirtyHTML}</>
}

export default FarmbotDemoSVG
