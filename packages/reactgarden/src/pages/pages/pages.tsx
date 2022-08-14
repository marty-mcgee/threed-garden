// import { NextPage } from 'next'
import type { NextPage } from "next"
import { IProps, IBooleans, IValues, IStructures } from "types/interfaces" // "@threed/garden/cpt"
import type { Page } from "types/interfaces"

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
//   <div>
//     {pages.map((page: Page) => (
//       <>
//         <div>[MM] Boilerplate Page</div>
//         <div key={page.title.rendered}>{page.title.rendered}</div>
//       </>
//     ))}
//   </div>
// )
// const Pages: NextPage<{ pages: Page[] }> = ({ pages }) => (
const PagePage: NextPage<IProps> = ({ userAgent }) => (
  <main>
    <div>[MM] Boilerplate Page</div>
    <div>Your user agent: {userAgent}</div>
  </main>
)

PagePage.getInitialProps = async ({ req }) => {
  const userAgent = req ? req.headers['user-agent'] : navigator.userAgent
  return { userAgent }
}

// export default Pages
export default PagePage

