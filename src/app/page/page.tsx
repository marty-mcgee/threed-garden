// 'use client'

// import type { NextPage } from 'next'
import type { TNextPageWithProps } from '#/lib/types/TAppProps'
import { GetServerSideProps } from 'next'
import { IPage, IBooleans, IValues, IStructures } from '#/lib/types/interfaces' // "@threed/garden/ts"
import type { TPage } from '#/lib/types/interfaces'

// import axios from 'axios'

// import NextApp from 'next/app'

// import { NextRequest, userAgent } from 'next/server'

// export function middleware(request: NextRequest) {
//   // const url = request.nextUrl
//   // const { device } = userAgent(request)
//   // const viewport = device.type === 'mobile' ? 'mobile' : 'desktop'
//   // url.searchParams.set('viewport', viewport)
//   // return NextResponse.rewrite(url)
//   return userAgent(request)
// }

// // const ua = middleware
// const ua = middleware
// console.debug('!@!@!@!@ ua (next/server userAgent request middleware) !@!@!@!@', ua)

// const Pages: NextPage<IProps> = ({ userAgent }) => (
// const Pages: NextPage<IPage> = ({ userAgent }) => (
//   <main>
//     <div>[MM] Boilerplate Page</div>
//     <div>Your user agent: {userAgent}</div>
//   </main>
// )

// const Pages: TNextPageWithProps<{ pages: IPage[] }> = ({ pages }) => {
const Pages: TNextPageWithProps = (pages: any): JSX.Element => {
  const word = 'word'
  // const userAgent = middleware
  return (
    <main style={{ padding: '1em' }}>
      <h1>[MM] Boilerplate Page</h1>
      <div>User Agent: {word} ???</div>
      {/* {pages.map(
        (
          page: IPage // ooooo, interesting [MM] HEY HEY HEY
        ) => (
          <div
            key={Math.floor(100000 + Math.random() * 900000)}
            style={{ display: 'inline-flex' }}
          >
            <div>|</div>
            <div key={page.title.rendered}>{page.title.rendered}</div>
          </div>
        )
      )} */}
    </main>
  )
}

// NextApp.getInitialProps = async ({ req }) => {
//   const userAgent = req ? req.headers['user-agent'] : navigator.userAgent
//   const title = { rendered: "HEY HEY HEY" }
//   return { title, userAgent }
// }
Pages.getInitialProps = async ({ req }) => {
  const userAgent = req ? req.headers['user-agent'] : navigator.userAgent
  const title = { rendered: 'HEY HEY HEY' }
  return { title, userAgent }
}
// PagePage.getLayout = (page: any) => <DashboardLayout>{page}</DashboardLayout>
// Pages.getLayout = (page: any) => <BlankLayout>{page}</BlankLayout>
Pages.getLayout = (page: any) => {page}
Pages.authGuard = true
Pages.guestGuard = true

// export const getServerSideProps: GetServerSideProps = async (req) => {
//   let res = { data: [{ title: { rendered: 'HEY HEY HEY' } }] }
//   console.log("let res", res)

//   const userAgent = req ? req.headers['user-agent'] : navigator.userAgent
//   const title = { rendered: "HEY HEY HEY" }
//   return { title, userAgent }

//   try {
//     // REST GET resPONSE
//     res = await axios.get<IPage[]>(`${process.env.WP_REST_API_URL}/pages`)
//     // console.log("try res", res)
//   } catch (e: any) {
//     res.data = [{ title: { rendered: 'NOPE NOPE NOPE' } }]
//     // console.log("catch e", e)
//   }
//   // console.log("res.data", res.data)

//   // const userAgent = req ? req.headers["user-agent"] : navigator.userAgent

//   return {
//     props: { pages: res.data }, // ua: userAgent
//   }
// }

export default Pages

// ===========================================================================
// examples
const flags: IBooleans = { read: true, write: false, delete: false }

const userFile: IValues = { user: 1, username: 'One', file: 'types.txt' }

const userContext: IStructures = {
  file: userFile,
  permissions: flags,
  counts: { views: 3, writes: 1 }, // => INumbers (lint: try to remove IValues from IStructures)
}
// end examples
// ===========================================================================
