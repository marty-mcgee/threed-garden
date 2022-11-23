import { useRouter } from 'next/router'
import React, { FC } from 'react'

import { MainPage as ThreeDPage } from '~~/components/main/MainPage'
import { TPageProps } from '~~/models/TAppProps'

const Page: FC<TPageProps> = (props) => {
  // -----------------------------
  // 🔗 Get current url path
  // -----------------------------
  const router = useRouter()
  // remove starting '/' from path
  const slug = router.asPath
  let urlPath = 'main'

  if (slug.length > 1 && slug.startsWith('/')) {
    urlPath = slug.substring(1)
  }

  return (
    <div className='App'>
      <ThreeDPage
        pageName={urlPath}
        {...props}
      ></ThreeDPage>
    </div>
  )
}

export default Page
