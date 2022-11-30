'use client'

// import { NextPage, GetServerSideProps } from "next"
import type { NextPage } from 'next'
import { IPage, IBooleans, IValues, IStructures } from '~/types/interfaces' // "@threed/garden/cpt"
import type { Page } from '~/types/interfaces'

import { GetServerSideProps } from 'next'
import axios from 'axios'

// import App from 'next/app'

import { NextRequest, userAgent } from 'next/server'

export function middleware(request: NextRequest) {
  // const url = request.nextUrl
  // const { device } = userAgent(request)
  // const viewport = device.type === 'mobile' ? 'mobile' : 'desktop'
  // url.searchParams.set('viewport', viewport)
  // return NextResponse.rewrite(url)
  return userAgent(request)
}

// const ua = middleware
const ua = middleware
console.log('ua', ua)

// App.getInitialProps = async ({ req }) => {
//   const userAgent = req ? req.headers['user-agent'] : navigator.userAgent
//   const title = { rendered: "HEY HEY HEY" }
//   return { title, userAgent }
// }

// const PagePage: NextPage<IProps> = ({ userAgent }) => (
// const PagePage: NextPage<IPage> = ({ userAgent }) => (
//   <main>
//     <div>[MM] Boilerplate Page</div>
//     <div>Your user agent: {userAgent}</div>
//   </main>
// )

const Pages: NextPage<{ pages: IPage[] }> = ({ pages }) => {
  const word = 'word'
  // const userAgent = middleware
  return (
    <main style={{ padding: '1em' }}>
      <h1>[MM] Boilerplate Page</h1>
      <div>User Agent: {word} ???</div>
      {pages.map(
        (
          page: Page // ooooo, interesting [MM] HEY HEY HEY
        ) => (
          <div
            key={Math.floor(100000 + Math.random() * 900000)}
            style={{ display: 'inline-flex' }}
          >
            <div>|</div>
            <div key={page.title.rendered}>{page.title.rendered}</div>
          </div>
        )
      )}
    </main>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  let res = { data: [{ title: { rendered: 'HEY HEY HEY' } }] }
  // console.log("let res", res)

  try {
    // REST GET resPONSE
    res = await axios.get<IPage[]>(`${process.env.WP_REST_API_URL}/pages`)
    // console.log("try res", res)
  } catch (e: any) {
    res.data = [{ title: { rendered: 'NOPE NOPE NOPE' } }]
    // console.log("catch e", e)
  }
  // console.log("res.data", res.data)

  // const userAgent = req ? req.headers["user-agent"] : navigator.userAgent

  return {
    props: { pages: res.data }, // ua: userAgent
  }
}

export default Pages

// ============================================================================================
// examples
const flags: IBooleans = { read: true, write: false, delete: false }

const userFile: IValues = { user: 1, username: 'One', file: 'types.txt' }

const userContext: IStructures = {
  file: userFile,
  permissions: flags,
  counts: { views: 3, writes: 1 }, // => INumbers (lint: try to remove IValues from IStructures)
}
// end examples
// ============================================================================================
