// ========================================================
import { FunctionComponent, useEffect } from 'react'
import dynamic from 'next/dynamic'

// ** MUI Components
import Grid from '@mui/material/Grid'

import FarmbotSVG from '~/assets/images/farmbot-demo.svg'
import FarmbotDemoSVG from '~/components/farmbot/FarmbotDemoSVG'

// import Demo from "~/components/threed/Demo"
const DynamicCSRDemo = dynamic(() => import('~/components/threed/Demo'), {
  // loading: () => <p>...loading...</p>,
  ssr: false,
})

const DemoPage: FunctionComponent = (props): JSX.Element => {
  const word = 'HEY HEY HEY -- DEMO PAGE'

  const IFrame = () => (
    <div
      dangerouslySetInnerHTML={{
        __html:
          '<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/qwSbWy_1f8w?controls=0" title="Farmbot Video" frameborder="0" sandbox="allow-scripts allow-same-origin"></iframe>',
      }}
    />
  )

  const IFrameDoc = () => (
    <div
      dangerouslySetInnerHTML={{
        __html: `
        <iframe sandbox='allow-scripts allow-presentation allow-same-origin' width='560' height='315' frameborder='0'
          srcdoc='
            <!DOCTYPE html><html lang="en"><head><title>Farmbot YouTube Video IFrame</title></head><body>
            <!-- original source-code shared from youtube: -->
            <iframe width="560" height="315"
                src="https://www.youtube.com/embed//qwSbWy_1f8w?controls=0"
                frameborder="0" sandbox="allow-scripts allow-same-origin"
                allowfullscreen"></iframe>
            </body></html>
          '></iframe>`,
      }}
    />
  )

  const Video = () => (
    <div
      dangerouslySetInnerHTML={{
        __html:
          '<video muted="" autoplay="" loop="" style="opacity: 1; width: 560px; height: 315px;" preload="none"><source src="https://cdn.shopify.com/s/files/1/2040/0289/files/Farm_Designer_Loop.mp4?9862" type="video/mp4"></video>',
      }}
    />
  )

  const VideoSameOrigin = () => (
    <div
      dangerouslySetInnerHTML={{
        __html:
          '<video muted="" autoplay="" loop="" style="opacity: 1; width: 560px; height: 315px;" preload="none"><source src="/media/FarmBot-Genesis-XL-This_is_XL_Web_Hero.mp4" type="video/mp4"></video>',
      }}
    />
  )

  const SVG = () => (
    <img
      src={FarmbotSVG.src}
      alt='Farmbot Demo SVG'
    />
  )

  useEffect(() => {
    const newword = word

    // because we are in Client-Side-Rendering (SSR: FALSE)
    // window is available (not document though) ???

    // window.$ = window.jQuery = require("jquery")
    // console.log("window.$", window.$)

    // const B3 = dynamic(() =>
    //   require("~/components/threed/demo-b3.mm"),
    //   {
    //     ssr: false
    //   }
    // )
    // console.log("B3 onMount", B3)

    return console.info(`[MM] /demo: onUnmount @ ${new Date().toISOString()} ${newword}`)
  }, [])

  // return JSX.Element
  return (
    <Grid
      container
      spacing={4}
    >
      <Grid
        item
        xs={12}
        lg={12}
      >
        {/* <Demo /> */}
        {/* <DynamicCSRDemo /> */}
      </Grid>
      <Grid
        item
        xs={12}
        lg={12}
      >
        <FarmbotDemoSVG />
        {/* <SVG /> */}
      </Grid>
      <Grid
        item
        xs={12}
        lg={6}
      >
        <VideoSameOrigin />
      </Grid>
      <Grid
        item
        xs={12}
        lg={6}
      >
        <Video />
      </Grid>
      <Grid
        item
        xs={12}
        lg={6}
      >
        {/* <IFrame /> */}
        {/* <IFrameDoc /> */}
      </Grid>
    </Grid>
  )
}

export default DemoPage
// export default DynamicCSRDemo
