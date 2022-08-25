import { FunctionComponent, useEffect } from "react"

import Head from "next/head"
import dynamic from "next/dynamic"
import Script from "next/script"
// import "~/assets/demo/css/Demo.module.css"

// import * as $ from "jquery"
import paper from "paper"
import * as THREE from "three"
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js"
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader"
import { Sky } from "three/examples/jsm/objects/Sky.js"
// import { TWEEN } from "three/examples/jsm/libs/tween.module.min"
import TWEEN from "@tweenjs/tween.js"

// <script type="text/javascript" data-cfasync="false">
const Demo: FunctionComponent = (props): JSX.Element => {

  const word = "HEY HEY HEY"
  // const fragment = null
  // const readOnly = false
  // const UILayout = "default"

  console.log("props", props)

  useEffect(() => {
    console.debug("Demo onMount", word)
    // window.$ = window.jQuery = require('jquery')
    window.$ = window.jQuery = require("~/assets/demo/scripts/jquery-1.11.3.min")
    // window.$ = window.jQuery
    // window.Diamonds = require('../public/jquery.diamonds.js')
    // console.log("$", window.$)

    // useEffect(() => {
    const B3 = dynamic(
      () => require("~/components/threed/b3.mm"),
      {
        // loading: () => <p>...loading...</p>,
        ssr: false
      }
    )
    // const B3 = dynamic(() => require("~/assets/demo/scripts/b3.min"), { ssr: false })
    // window.b3 = B3
    // window.b3 = require("~/assets/demo/scripts/b3.min")
    // const B3 = require("~/assets/demo/scripts/b3.min")
    // require("~/assets/demo/scripts/b3.min")
    console.log("B3.MM", B3)

    // window.ThreeCSG = require("~/assets/demo/scripts/ThreeCSG")
    // window.minicolors = require("~/assets/demo/scripts/jquery.minicolors.min")

    // window.jQuery("#demo").diamonds({
    //     size : 100, // Size of diamonds in pixels. Both width and height.
    //     gap : 5, // Pixels between each square.
    //     hideIncompleteRow : false, // Hide last row if there are not enough items to fill it completely.
    //     autoRedraw : true, // Auto redraw diamonds when it detects resizing.
    //     itemSelector : `.${styles.item}` // the css selector to use to select diamonds-items.
    // })
    return (
      console.debug("Demo onUnmount", word)
    )
  }, [])

  /*
  // eslint-disable-next-line no-extra-boolean-cast
  if (!!window.location.hash) { // for old fragment type links. very rare.
    let tmpFragment = window.location.hash.substr(1)
    let tmpUILayout = "default"
    if (tmpFragment.endsWith("_plan")) {
      // eslint-disable-next-line prefer-destructuring
      tmpFragment = tmpFragment.split("_")[0]
      tmpUILayout = "planView"
    } else if (tmpFragment.endsWith("_3d")) {
      // eslint-disable-next-line prefer-destructuring
      tmpFragment = tmpFragment.split("_")[0]
      tmpUILayout = "3dView"
    }

    const re = /[0-9A-Fa-f]/g
    if (re.test(tmpFragment) && tmpFragment.length >= 40 && tmpFragment.length < 50) {
      // reload with static url
      if (tmpUILayout === "planView") {
        window.location.href = `/plan/${tmpFragment}`
      } else if (tmpUILayout === "3dView") {
        window.location.href = `/3d/${tmpFragment}`
      } else {
        window.location.href = `/edit/${tmpFragment}`
      }
    }
  }
  */

  return (
    <div>
      <Head>
        {/* <base href="http://localhost:5500/" /> */}
        <link rel="alternate" type="application/json+oembed" href="oembed.json" />
      </Head>

      {/* <Script id="heyheyhey">
        {`
          let fragment = null
          let readOnly = false
          let UILayout = "default"
        `}
      </Script> */}

      {/* <Script src="demo/scripts/three.min.js" strategy="beforeInteractive" /> */}
      {/* <Script src="demo/scripts/jquery-1.11.3.min.js" strategy="afterInteractive" /> */}
      {/* <Script src="demo/scripts/paper-full.js?a=1" strategy="afterInteractive" /> */}

      {/* <Script src="demo/scripts/b3.min.js" strategy="lazyOnload" /> */}
      {/* <Script src="demo/scripts/ThreeCSG.js" strategy="lazyOnload" />
      <Script src="demo/scripts/jquery.minicolors.min.js" strategy="lazyOnload" /> */}

      {/* <Script src="demo/scripts/trackballcontrols.js" strategy="afterInteractive" /> */}
      {/* <Script src="demo/scripts/tween.js" strategy="afterInteractive" /> */}
      {/* <Script src="demo/scripts/MTLLoader.js" strategy="afterInteractive" /> */}
      {/* <Script src="demo/scripts/OBJLoader.js" strategy="afterInteractive" /> */}
      {/* <Script src="demo/scripts/OBJExporter.js" strategy="afterInteractive" /> */}
      {/* <Script src="demo/scripts/sky.js" strategy="afterInteractive" /> */}
      {/*
      <!-- <Script src="demo/scripts/jsonc.min.js" /> -->
      <!-- SHADERS + PROCESSORS -->
      <!-- <Script src="demo/scripts/shaders/CopyShader.js" /> -->
      <!-- <Script src="demo/scripts/volumeMaskShader.js" /> -->
      <!-- <Script src="demo/scripts/shaders/RGBShiftShader.js" /> -->
      <!-- <Script src="demo/scripts/postprocessing/EffectComposer.js" /> -->
      <!-- <Script src="demo/scripts/postprocessing/RenderPass.js" /> -->
      <!-- <Script src="demo/scripts/postprocessing/ShaderPass.js" /> -->
      */}

      <div id="DEMO">
        DEMO
      </div>
    </div>
  )
}

export default Demo
