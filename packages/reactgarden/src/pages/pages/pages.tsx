// import { NextPage } from 'next'
import type { NextPage } from "next"
import { IPage, IProps, IBooleans, IValues, IStructures } from "types/interfaces" // "@threed/garden/cpt"
import type { Page } from "types/interfaces"

import { GetServerSideProps } from "next"
import axios from "axios"

// examples
const flags: IBooleans = { read: true, write: false, delete: false }

const userFile: IValues = { user: 1, username: 'One', file: 'types.txt' }

const userContext: IStructures = {
  file: userFile,
  permissions: flags,
  counts: { views: 3, writes: 1 } // => INumbers (lint: try to remove IValues from IStructures)
}
// end examples

const Pages: NextPage<{ pages: IPage[] }> = ({ pages }) => (
  <main>
    <div key={(Math.floor(100000 + Math.random() * 900000))}>[MM] Boilerplate Page</div>
    {pages.map((page: Page) => ( // ooooo, interesting [MM] HEY HEY HEY
      <div key={(Math.floor(100000 + Math.random() * 900000))}>
        <div key={page.title.rendered}>{page.title.rendered}</div>
      </div>
    ))}
  </main>
)

// const PagePage: NextPage<IProps> = ({ userAgent }) => (
//   <main>
//     <div>[MM] Boilerplate Page</div>
//     <div>Your user agent: {userAgent}</div>
//   </main>
// )

export const getServerSideProps: GetServerSideProps = async () => {

  let res = { data: [{ title: { rendered: "HEY HEY HEY" } }] }
  // console.log("let res", res)

  try {
    // REST GET resPONSE
    res = await axios.get<IPage[]>(`${process.env.WP_REST_API_URL}/pages`)
    // console.log("try res", res)
  } catch (e: any) {
    res.data = [{ title: { rendered: "NOPE NOPE NOPE" } }]
    // console.log("catch e", e)
  }

  // console.log("res.data", res.data)

  return {
    props: { pages: res.data },
  }
}

// PagePage.getInitialProps = async ({ req }) => {
//   const userAgent = req ? req.headers['user-agent'] : navigator.userAgent
//   return { userAgent }
// }

export default Pages
// export default PagePage
