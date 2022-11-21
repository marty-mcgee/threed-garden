// ==============================================================
// RESOURCES

// import Menu from '@mui/material/Menu'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
// import { Menu } from 'antd'

import Link from 'next/link'
import React, { ReactElement } from 'react'

/**
 * A name and element that represents a page
 */
type TContractPage = {
  name: string
  content: JSX.Element
}

export type TContractPageList = {
  /**
   * the default page to load on route '/'
   */
  mainPage: TContractPage
  /**
   * an array of all the other pages
   */
  pages: TContractPage[]
}

/**
 * Helper function that creates pages with routes.
 * It also creates tabs (menu items) associated with those routes,
 * so that you can click on them to navigate to the page.
 * @param pageList
 * @param route
 * @param setRoute
 * @returns
 */
export const createTabsAndPages = (
  pageList: TContractPageList
): { tabMenu: ReactElement; pages: Record<string, ReactElement> } => {
  const tabMenu = (
    <MenuList
      // style={{
      //   textAlign: 'center',
      //   display: 'inline-block',
      // }}
      // mode='horizontal'
      // open={true}
    >
      {/* <MenuItem
        key='/'
        style={{
          // textAlign: 'center',
          display: 'inline-block',
        }}
      >
        <Link href='/'>{pageList.mainPage.name}</Link>
      </MenuItem> */}
      {pageList.pages.map(({ name }) => (
        <MenuItem
          key={name}
          style={{
            // textAlign: 'center',
            display: 'inline-block',
          }}
        >
          <Link href={'/' + name}>{name}</Link>
        </MenuItem>
      ))}
    </MenuList>
  )

  const pages: Record<string, ReactElement> = {}
  pageList.pages.map(({ name, content }) => (pages[name] = content))
  pages['main'] = pageList.mainPage.content

  return { tabMenu, pages }
}
