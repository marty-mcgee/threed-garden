import type { NextPage } from 'next'

import { Page } from '../../src/types/interfaces'

// const PagePage: NextPage<{ pages: Page[] }> = ({ pages }) => (
//   <div>
//     {pages.map((page: Page) => (
//       <>
//         <div>[MM] Boilerplate Page</div>
//         <div key={page.title.rendered}>{page.title.rendered}</div>
//       </>
//     ))}
//   </div>
// )
const PagePage: NextPage<{ pages: Page[] }> = ({ pages }) => <div>[MM] Boilerplate Page</div>

export default PagePage
