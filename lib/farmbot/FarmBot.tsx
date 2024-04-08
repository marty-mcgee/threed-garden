'use client' // testing

// ==========================================================
// RESOURCES

import { Farmbot } from 'farmbot'

import useSWR from 'swr'



// ** Helper Components
import Spinner from '#/ui/components/spinner'
// ** HELPFUL UTIL: COLORFUL CONSOLE MESSAGES (ccm)
import ccm from '#/lib/utils/console-colors'

// ==========================================================
// IMPORTS COMPLETE
// ==========================================================

// DEBUG PREFERENCES FOR THIS MODULE
const debug: boolean = true
const DEBUG: boolean = true
const debug_deep: boolean = true

const appVersion = 'v0.15.0-bot'
// const appVersion = process.env.NEXT_PUBLIC_APP_VERSION
// const appVersion = process.env.npm_package_version
// const appVersion: string = require('package.json').version
// const appVersion: string = require('../../package.json').version

if ((debug || DEBUG) && debug_deep) {
  console.log('%c🥕 ThreeDGarden<FARMBOT>: {.tsx}', ccm.green)
  console.log('%c🌱 appVersion', ccm.darkgreen, appVersion)
  console.log(`%c====================================`, ccm.darkgreen)
}

// ** FARMBOT KEY
const getFarmbotToken = () => {

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
  // data.append('email', 'mcgee.marty@gmail.com')
  // data.append('password', 'pursueB@8')

  const data = {
    user: {
      email: 'mcgee.marty@gmail.com',
      password: 'XXXxxxXXX',
    }
  }
  let MY_THREED_TOKEN = 'NADA LADA' // data.token.encoded
  MY_THREED_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJ1bmtub3duIiwic3ViIjoxNTI2NywiaWF0IjoxNzEyNTc2MzU2LCJqdGkiOiJmNzNjZTAxZS00NWY5LTQ4NzUtYTRiMC0xOWJhM2E0OTZiM2EiLCJpc3MiOiIvL215LmZhcm0uYm90OjQ0MyIsImV4cCI6MTcxNzc2MDM1NiwibXF0dCI6ImNsZXZlci1vY3RvcHVzLnJtcS5jbG91ZGFtcXAuY29tIiwiYm90IjoiZGV2aWNlXzE1Mjk3Iiwidmhvc3QiOiJ4aWNvbmZ1bSIsIm1xdHRfd3MiOiJ3c3M6Ly9jbGV2ZXItb2N0b3B1cy5ybXEuY2xvdWRhbXFwLmNvbTo0NDMvd3MvbXF0dCJ9.ZLYoVODi7OmwTkbCBopuNcznXvmvTqMtvpl-JScH-IGT4EKQqUC-SZ8Un-u402ws4z4RIBAxovcQqsTuSqGo9Ai3jWUFaA4VQHg0EQGwWcKFtyNUzrKPeIKpzxXVQGlspBBm0QuZgHPNqQDzx_zaMdD6KbVAISoADaKPW5fIHe9qq4_y8-7m5lfIQKBL2AQkwPPKYBEX7TviX_YX3YpMyBauhBc1eKtcChGRwEBm7HkuYPLl5yRory_NzsN0C3VYgPvx9GnXaLwCxT7w9YTKkTfETXTviFoUP6GRwFS_zaM95yi89ocjAfYkR9tHtYfXVeRKQa0BRyZ_wZWJuoc68A'

  return MY_THREED_TOKEN

  const fetcher = (url: string) => fetch(
    // url // + '?user.email=mcgee.marty@gmail.com&user.password=pursueB@8'
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
  .then(
    (res) => res.json()
  )

  // fetch(
  //   'https://my.farm.bot/api/tokens',
  //   {
  //     method: 'POST',
  //     headers: {
  //       // 'Content-Type': 'application/x-www-form-urlencoded'
  //       'Content-Type': 'application/json'
  //     },
  //     body: JSON.stringify(data)
  //   }
  // )
  // .then(response => {
  //   console.log('YO YO YO ', response)
  //   response.json()
  //   // @ ts-ignore
  //   // MY_THREED_TOKEN = response['token']['encoded']
  // })
  // .then(data => {
  //   console.log('HEY HEY HEY ', data)
  //   // MY_THREED_TOKEN = data?.token?.encoded
  // })
  // .catch(error => console.error(error))

  // ** next.js 'swr' (desired option)
  // const { data, error, isLoading } = useSWR('/api/user', fetcher)
  const { data: swrData, error: swrError, isLoading: swrIsLoading } = useSWR(
    // 'https://api.github.com/repos/vercel/swr',
    'https://my.farm.bot/api/tokens',
    fetcher
  )

  if (swrError) return 'Farmbot Token: An error has occurred.'
  if (swrIsLoading) return 'Farmbot Token: Loading...'

  console.debug('Farmbot Token: returned data', swrData)
  MY_THREED_TOKEN = swrData.token.encoded
  // const MY_THREED_TOKEN = 'NADA LADA'
  // console.debug('Farmbot Token: returned data.token.encoded', MY_THREED_TOKEN)

  return MY_THREED_TOKEN
}

const FarmbotComponent = (): JSX.Element => {
  // **
  const word: string = '[MM] FarmbotComponent'
  // **
  // return <>Farmbot: {word}</>
  // **
  const SUPER_SECRET_TOKEN = getFarmbotToken()
  // console.debug('Farmbot Token: SUPER_SECRET_TOKEN', SUPER_SECRET_TOKEN)
  // **
  // return <>Farmbot: {SUPER_SECRET_TOKEN}</>
  // **
  try {
    const threedBot = new Farmbot({ token: SUPER_SECRET_TOKEN })
    // ** interact with farmbot api
    threedBot
      .connect()
      .then(() => {
        console.debug('%c [MM] THREED GARDEN -- FARMBOT INITIATED.', ccm.greenAlert)
        // threedBot.setConfig('MARTY', 'HEY HEY HEY')
        // console.debug(threedBot.getConfig('MARTY'))
        // return threedBot.getConfig('MARTY')
      })
      // .then(() =>
      //   threedBot.moveRelative({
      //     x: 1,
      //     y: 2,
      //     z: 3,
      //     speed: 100,
      //   })
      // )

    // console.debug('%c [MM] THREED GARDEN: threedBot', ccm.green, threedBot)
    return <>Farmbot: {word}</>
  } catch (ERR) {
    // console.debug('%c [MM] THREED GARDEN: ERR', ccm.green, ERR)
    return <>Farmbot ERR: {word}</>
  }
}

export default FarmbotComponent
