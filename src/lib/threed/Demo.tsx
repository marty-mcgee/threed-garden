import { FunctionComponent, useEffect } from 'react'

import Head from 'next/head'
import dynamic from 'next/dynamic'
// import "#/lib/assets/demo/css/Demo.module.css"

// import * as $ from "jquery" // [MM] HEY HEY HEY

// import { TWEEN } from "three/examples/jsm/libs/tween.module.min"

const B3MM3 = require('#/lib/threed/demo-b3.mm')

// <script type="text/javascript" data-cfasync="false">
const Demo: FunctionComponent = (props): JSX.Element => {
  const word = `[MM] DEMO: HEY HEY HEY @ ${new Date().toISOString()}`

  // const fragment = null // grenade?
  const readOnly = false // really?
  const UILayout = 'default' // ok?

  // console.debug("props", props)

  useEffect(() => {
    console.debug('Demo onMount', word)
    // window.$ = window.jQuery = require('jquery')
    // window.$ = window.jQuery = require("#/lib/assets/demo/scripts/jquery-1.11.3.min")
    // const jQuery = require("#/lib/assets/demo/scripts/jquery-1.11.3.min")
    const jQuery = require('jquery')
    console.debug('[MM] Demo.tsx: jQuery', jQuery)
    // window.$ = window.jQuery = jQuery
    // window.jQuery = jQuery
    // console.debug("[MM] Demo.tsx: window.jQuery", window.jQuery)
    // window.$ = window.jQuery
    // console.debug("[MM] Demo.tsx: window.$", window.$)
    // console.debug(`[MM] Demo.tsx: $ @ ${new Date().toISOString()}`, window.$)

    // useEffect(() => {
    const B3 = dynamic(() => require('#/lib/threed/demo-b3.mm'), {
      // loading: () => <p>...loading...</p>,
      ssr: false,
    })
    // const B3 = dynamic(() => require("#/lib/assets/demo/scripts/b3.min"), { ssr: false })
    // window.b3 = B3
    // window.b3 = require("#/lib/assets/demo/scripts/b3.min")
    // const B3 = require("#/lib/assets/demo/scripts/b3.min")
    // require("#/lib/assets/demo/scripts/b3.min")
    console.debug(`[MM] Demo.tsx: B3.MM @ ${new Date().toISOString()}`, B3)

    const B3MM = B3
    console.debug(`[MM] Demo.tsx: B3MM @ ${new Date().toISOString()}`, B3MM)

    const B3MM1 = { ...B3MM }
    console.debug(`[MM] Demo.tsx: B3MM1 @ ${new Date().toISOString()}`, B3MM1)

    const B3MM2 = B3MM
    console.debug(`[MM] Demo.tsx: B3MM2 @ ${new Date().toISOString()}`, B3MM2)

    // const B3MM3 = B3MM3
    console.debug(`[MM] Demo.tsx: B3MM3 @ ${new Date().toISOString()}`, B3MM3)

    // window.ThreeCSG = require("#/lib/assets/demo/scripts/ThreeCSG")
    // window.minicolors = require("#/lib/assets/demo/scripts/jquery.minicolors.min")

    return console.debug('Demo onUnmount', word), console.info(`[MM] Demo.tsx: onUnmount @ ${new Date().toISOString()}`)
  }, [])

  return (
    <div>
      <Head>
        {/* <base href="http://localhost:5500/" /> */}
        <link
          rel='alternate'
          type='application/json+oembed'
          href='oembed.json'
        />
      </Head>
      <div id='DEMO'>DEMO</div>
    </div>
  )
}

export default Demo
