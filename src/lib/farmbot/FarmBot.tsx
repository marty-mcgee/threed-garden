// 'use client' // testing
// 'use server' // testing

// ==========================================================
// RESOURCES

import React from 'react'

// ** FARMBOT Imports
import { Farmbot } from 'farmbot'

// import useSWR from 'swr'

// ** Helper Components
// import Spinner from '#/layout/ui/spinner'
// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

// ==========================================================

// ** DEBUG: this module
const debug: boolean = false
const DEBUG: boolean = false

const appVersion = 'v0.17.3-bot.0'
// const appVersion = process.env.NEXT_PUBLIC_APP_VERSION
// const appVersion = process.env.npm_package_version
// const appVersion: string = require('package.json').version
// const appVersion: string = require('../../package.json').version

if (debug || DEBUG) {
  console.debug('%c🥕 ThreeDGarden<FARMBOT>: {.tsx}', ccm.green)
  console.debug('%c🌱 appVersion', ccm.darkgreen, appVersion)
  console.debug(`%c====================================`, ccm.darkgreen)
}

// ==========================================================

// ** FARMBOT TOKEN KEY
// const getFarmbotToken = () => {
function getFarmbotToken() {

      // import requests
      // response = requests.request(
      //     method='POST',
      //     url='https://my.farm.bot/api/tokens',
      //     headers={'content-type': 'application/json'},
      //     json={'user': {'email': 'admin@admin.com', 'password': 'password123'}})
      // TOKEN = response.json()['token']['encoded']

  // Since the API supports [CORS](http://enable-cors.org/), you can generate your
  // token right in the browser. Here's an example:

  // ** jquery (old)
  // $.ajax({
  //   url: 'https://my.farm.bot/api/tokens',
  //   type: 'POST',
  //   data: JSON.stringify({user: {email: 'admin@admin.com', password: 'password123'}}),
  //   contentType: 'application/json',
  //   success: function (data) {
  //               // You can now use your token
  //               var MY_SHINY_TOKEN = data.token.encoded
  //           }
  // })

  // ** js fetch (default option)
  // fetch()
  // const data = new URLSearchParams()
  // data.append('email', process.env.NEXT_PUBLIC_FARMBOT_EMAIL)
  // data.append('password', process.env.NEXT_PUBLIC_FARMBOT_SECRET)

  const data = {
    user: {
      email: process.env.NEXT_PUBLIC_FARMBOT_EMAIL,
      password: process.env.NEXT_PUBLIC_FARMBOT_SECRET,
    }
  }

  // data.token.encoded
  let MY_THREED_TOKEN 
  
      MY_THREED_TOKEN = process.env.NEXT_PUBLIC_FARMBOT_TOKEN
                      ? process.env.NEXT_PUBLIC_FARMBOT_TOKEN
                      : 'NADA_LADA_DADA'

  return MY_THREED_TOKEN




  const fetcher = (url: string) => (
    fetch(
      // url // + '?user.email=process.env.NEXT_PUBLIC_FARMBOT_EMAIL&user.password=process.env.NEXT_PUBLIC_FARMBOT_SECRET'
      'https://my.farm.bot/api/tokens',
      {
        method: 'POST',
        headers: {
          // 'Content-Type': 'application/x-www-form-urlencoded'
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    )
    // .then(
    //   (res) => res.json()
    // )
    .then(response => {
      console.debug('YO YO YO ', response)
      response.json()
      // @ ts-ignore
      // MY_THREED_TOKEN = response['token']['encoded']
    })
    .then(data => {
      console.debug('HEY HEY HEY ', data)
      // MY_THREED_TOKEN = data?.token?.encoded
    })
    .catch(error => console.error(error))
  )



  // // ** next.js 'swr' (desired option ???)
  // // const { data, error, isLoading } = useSWR('/api/user', fetcher)
  // const { data: swrData, error: swrError, isLoading: swrIsLoading } = useSWR(
  //   // 'https://api.github.com/repos/vercel/swr',
  //   'https://my.farm.bot/api/tokens',
  //   fetcher
  // )

  // if (swrError) return 'Farmbot Token: An error has occurred.'
  // // if (swrIsLoading) return 'Farmbot Token: Loading...'

  // if (!swrIsLoading) {
  //   // console.debug('Farmbot Token: returned data', swrData)
  //   MY_THREED_TOKEN = swrData.token.encoded
  //   // const MY_THREED_TOKEN = 'NADA LADA'
  //   // console.debug('Farmbot Token: returned data.token.encoded', MY_THREED_TOKEN)

  //   return MY_THREED_TOKEN
  // }
  // else {
  //   return null
  // }



}

// ==========================================================




// const FarmbotComponent = (): React.ReactNode => {
export default function FarmbotComponent() {
  // **
  const word: string = 'FarmbotComponent: word = [MM]'
  
  // **
  const SUPER_SECRET_TOKEN = getFarmbotToken()
  console.debug('%c Farmbot Token: SUPER_SECRET_TOKEN', ccm.gray, SUPER_SECRET_TOKEN)
  
  // **
  if (SUPER_SECRET_TOKEN) {
    
    if (true) {
              const threedBot = new Farmbot({ token: SUPER_SECRET_TOKEN })
              console.debug('%c FarmbotComponent: threedBot', ccm.green, threedBot)
              
              
              // if (true && threedBot) {
              // try {

                // ** interact with farmbot api
                threedBot
                  // .client.end()

                  .connect()
                  // .connect("brisk-bear.rmq.cloudamqp.com", 1883, 60)
                  .then(() => {
                    console.debug('%c [MM] THREED GARDEN -- FARMBOT INITIATED.', ccm.greenAlert)
                    // threedBot.setConfig('MARTY', 'HEY HEY HEY')
                    // console.debug(threedBot.getConfig('MARTY'))
                    // return threedBot.getConfig('MARTY')
                  })
                  // .then(() =>
                  //   threedBot.moveRelative({
                  //     x: 100,
                  //     y: 100,
                  //     z: 100,
                  //     speed: 40,
                  //   })
                  // )

                return <>ThreeD: Farmbot: WORD: {word}</>


              // } catch (ERROR) {
              //   console.debug('%c [MM] THREED GARDEN: ERROR', ccm.red, ERROR)
              //   return <>ThreeD: Farmbot: ERROR: {word}</>
              // }
              // }


            }
    else {
      return <>Farmbot LOADING...</>
    }

  }
  else {
    return <>Farmbot STATIC.</>
  }
}
// export default FarmbotComponent
