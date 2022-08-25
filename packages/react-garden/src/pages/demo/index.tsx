// ========================================================
import { FunctionComponent, useEffect } from "react"
import dynamic from "next/dynamic"

// import Demo from "~/components/threed/Demo"
const DynamicCSRDemo = dynamic(
  () => import("~/components/threed/Demo"),
  {
    loading: () => <p>...loading...</p>,
    ssr: false
  }
)

const DemoPage: FunctionComponent = (props): JSX.Element => {

  const word = "HEY HEY HEY -- DEMO PAGE"

  useEffect(() => {

    const newword = word

    // because we are in Client-Side-Rendering (SSR: FALSE)
    // window is available (not document though) ???

    // window.$ = window.jQuery = require("jquery")
    // console.log("window.$", window.$)

    // const B3 = dynamic(() =>
    //   require("~/components/threed/b3.mm"),
    //   {
    //     ssr: false
    //   }
    // )
    // console.log("B3 onMount", B3)

    return (
      console.info(`[MM] /demo: onUnmount @ ${new Date().toISOString()} ${newword}`)
    )
  }, [])

  // return JSX.Element
  return (
    <>
      {/* <Demo /> */}
      <DynamicCSRDemo />
    </>
  )
}

export default DemoPage
// export default DynamicCSRDemo
