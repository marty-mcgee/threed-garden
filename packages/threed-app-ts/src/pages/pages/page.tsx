// import { NextPage } from 'next'
import type { NextPage } from "next"
import { IPage, IProps, IBooleans, IValues, IStructures } from "~/types/interfaces" // "@threed/garden/cpt"
import type { Page } from "~/types/interfaces"

// examples
const flags: IBooleans = { read: true, write: false, delete: false }

const userFile: IValues = { user: 1, username: 'One', file: 'types.txt' }

const userContext: IStructures = {
  file: userFile,
  permissions: flags,
  counts: { views: 3, writes: 1 } // => INumbers (lint: try to remove IValues from IStructures)
}
// end examples

// const Pages: NextPage<{ pages: Page[] }> = ({ pages }) => (
//   <main>
//     {pages.map((page: Page) => (
//       <>
//         <div>[MM] Boilerplate Page</div>
//         <div key={page.title.rendered}>{page.title.rendered}</div>
//       </>
//     ))}
//   </main>
// )

// const PagePage: NextPage<IProps> = ({ userAgent }) => (
const PagePage: NextPage<IPage> = ({ userAgent }) => (
  <main>
    <div>[MM] Boilerplate Page</div>
    <div>Your user agent: {userAgent}</div>
  </main>
)

// export const getServerSideProps: GetServerSideProps = async () => {

//   let res = { data: [{ title: { rendered: "HEY HEY HEY" } }] }

//   try {
//     res = await axios.get<IPage[]>(`${process.env.WP_REST_API_URL}/page`)
//   } catch (e: any) {
//     res.data = [{ title: { rendered: "HEY HEY HEY" } }]
//     // console.log("catch e", e)
//   }

//   console.log("res.data", res.data)

//   return {
//     props: { pages: res.data },
//   }
// }

PagePage.getInitialProps = async ({ req }) => {
  const userAgent = req ? req.headers['user-agent'] : navigator.userAgent
  const title = { rendered: "HEY HEY HEY" }
  return { title, userAgent }
}

// export default Pages
export default PagePage
