'use client'

// import { NextPage } from 'next'
// import type { NextPage } from 'next'
import type { TNextPageWithProps } from '#/lib/types/TAppProps'
// OR ???
import { TPage, IPage, IBooleans, IValues, IStructures } from '#/lib/types/interfaces' // "@threed/garden/cpt"

// ** Layout Import
// import BlankLayout from '#/ui/layouts/BlankLayout'
import DashboardLayout from '~/ui/layouts/LayoutContainers/DashboardLayout'
// import DashboardNavbar from '~/ui/layouts/Navbars/DashboardNavbar'

// examples
const flags: IBooleans = {
  read: true,
  write: false,
  delete: false
}
const userFile: IValues = {
  user: 1,
  username: 'One',
  file: 'types.txt'
}
const userContext: IStructures = {
  file: userFile,
  permissions: flags,
  counts: { views: 3, writes: 1 }, // => INumbers (lint: try to remove IValues from IStructures)
}
// end examples

// const Pages: TNextPageWithProps<{ pages: Page[] }> = ({ pages }) => (
//   <main>
//     {pages.map((page: Page) => (
//       <>
//         <div>[MM] Boilerplate Page</div>
//         <div key={page.title.rendered}>{page.title.rendered}</div>
//       </>
//     ))}
//   </main>
// )

// const PagePage: TNextPageWithProps<IProps> = ({ userAgent }) => (
// const PagePage: TNextPageWithProps<TPage> = ({ userAgent }) => (
const PagePage: TNextPageWithProps = (props): JSX.Element => {
  // const { userAgent } = props
  const userAgent = 'HEY HEY HEY'
  console.debug('PagePage props', props)
  return (
    <main>
      <h1>[MM] Scene(s): from PagePage Boilerplate NextPage</h1>
      <div>Your user agent: {userAgent}</div>
    </main>
  )
}

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
  const title = { rendered: 'HEY HEY HEY' }
  return { title, userAgent }
}
PagePage.getLayout = (page: any) => <DashboardLayout>{page}</DashboardLayout>
// PagePage.getLayout = (page: any) => <BlankLayout>{page}</BlankLayout>
PagePage.guestGuard = true

export default PagePage
