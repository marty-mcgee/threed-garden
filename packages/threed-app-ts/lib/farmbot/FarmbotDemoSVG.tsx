import { FC } from 'react'
// import DOMPurify from 'isomorphic-dompurify'
import parse from 'html-react-parser'
import FarmbotSVG from '#/lib/farmbot/FarmbotSVG.js'

const dirtyHTML = FarmbotSVG
// const cleanHTML = DOMPurify.sanitize(dirtyHTML, {
//   USE_PROFILES: { html: true, svg: true, svgFilters: true },
// })
const parseHTML = parse(dirtyHTML)

const FarmbotDemoSVG: FC = (): JSX.Element => {
  // hey hey hey
  return <>{parseHTML}</>
  // return <>{dirtyHTML}</>
}

export default FarmbotDemoSVG
