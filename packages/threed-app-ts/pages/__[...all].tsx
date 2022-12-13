import { useRouter } from 'next/router'
import React, { FC } from 'react'

import EthPage from '#/app/eth/page'
import { TPageProps } from '~~/types/models/TAppProps'

const Page: FC<TPageProps> = (props) => {
  // -----------------------------
  // 🔗 Get current url path
  // -----------------------------
  const router = useRouter()
  const urlPath = router.asPath
  let slug = 'threed' // 'main' | 'threed' | ''

  // get the component name from the url path
  if (urlPath.length > 1 && urlPath.startsWith('/')) {
    // remove starting '/' from path
    slug = urlPath.substring(1)
    if (slug.length > 1 && slug.endsWith('/')) {
      // remove ending '/' from path
      slug = slug.slice(0, slug.length - 1)
    }
  }

  return (
    // <div className='App WholeApp WholeEthApp WholeNextApp WholeReactApp'>
      <EthPage
        pageName={slug}
        {...props}
      >
        <div>no children? except me? accept me? the div</div>
      </EthPage>
    // </div>
  )
}

export default Page
