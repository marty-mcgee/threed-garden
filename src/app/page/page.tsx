'use client'

// ** LAYOUT Components (Head, Body, Foot)
import Header from '#/layout/header'
import Footer from '#/layout/footer'

// import type { NextPage } from 'next'
import type { TNextPageWithProps } from '#/lib/types/TAppProps'
import { GetServerSideProps } from 'next'
import { IPage, IBooleans, IValues, IStructures } from '#/lib/types/interfaces' // "@threed/garden/ts"
import type { TPage } from '#/lib/types/interfaces'

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

// const Page: TNextPageWithProps<{ pages: IPage[] }> = ({ pages }) => {
const Page: TNextPageWithProps = (pages: any): JSX.Element => {
  const word = 'ThreeD Garden'
  // const userAgent = middleware
  return (
    <>
      <Header />
      <main style={{ padding: '1em' }}>
        <h1>[ThreeD] Next.js Boilerplate Page</h1>
        <div>User Agent: {word}</div>
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
      <Footer />
    </>
  )
}

export default Page