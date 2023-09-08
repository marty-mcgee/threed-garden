import { useState } from 'react'

// nextjs components
import Link from 'next/link'

// @mui material components
import type { Theme } from '@mui/material/styles'
import Collapse from '@mui/material/Collapse'
import MuiLink from '@mui/material/Link'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// ThreeD Garden exampless
import DefaultNavbarDropdown from '#/ui/layouts/Navbars/DefaultNavbar/DefaultNavbarDropdown'

// Declaring props types for DefaultNavbarMobile
interface Props {
  routes: any
  open: any
}

function DefaultNavbarMobile({ routes, open }: Props): JSX.Element {
  const [collapse, setCollapse] = useState<string | boolean>('')

  const handleSetCollapse = (name: string) => (collapse === name ? setCollapse(false) : setCollapse(name))

  const renderNavbarItems = routes.map(
    ({ name, icon, collapse: routeCollapses, href, route, collapse: navCollapse }: any) => (
      <DefaultNavbarDropdown
        key={name}
        name={name}
        icon={icon}
        collapseStatus={name === collapse}
        onClick={() => handleSetCollapse(name)}
        href={href}
        route={route}
        collapse={Boolean(navCollapse)}
      >
        <MDBox sx={{ height: '15rem', maxHeight: '15rem', overflowY: 'scroll' }}>
          {routeCollapses &&
            routeCollapses.map((item: any) => (
              <MDBox
                key={item.name}
                px={2}
              >
                {item.collapse ? (
                  <>
                    <MDTypography
                      display='block'
                      variant='button'
                      fontWeight='bold'
                      textTransform='capitalize'
                      py={1}
                      px={0.5}
                    >
                      {item.name}
                    </MDTypography>
                    {item.collapse.map((el: any) => (
                      <MDTypography
                        key={el.name}
                        component={el.route ? Link : MuiLink}
                        // to={el.route ? el.route : ""}
                        href={
                          el.href
                            ? el.href
                            : // : (e: any) => e.preventDefault()
                              el.route
                        }
                        target={el.href ? '_blank' : ''}
                        rel={el.href ? 'noreferrer' : 'noreferrer'}
                        minWidth='11.25rem'
                        display='block'
                        variant='button'
                        color='text'
                        textTransform='capitalize'
                        fontWeight='regular'
                        py={0.625}
                        px={2}
                        sx={({ palette: { grey, dark }, borders: { borderRadius } }: Theme) => ({
                          borderRadius: borderRadius.md,
                          cursor: 'pointer',
                          transition: 'all 300ms linear',

                          '&:hover': {
                            backgroundColor: grey[200],
                            color: dark.main,
                          },
                        })}
                      >
                        {el.name}
                      </MDTypography>
                    ))}
                  </>
                ) : (
                  <MDBox
                    key={item.key}
                    display='block'
                    component={item.route ? Link : MuiLink}
                    // to={item.route ? item.route : ""}
                    href={
                      item.href
                        ? item.href
                        : // : (e: any) => e.preventDefault()
                          item.route
                    }
                    target={item.href ? '_blank' : ''}
                    rel={item.href ? 'noreferrer' : 'noreferrer'}
                    sx={({ palette: { grey, dark }, borders: { borderRadius } }: Theme) => ({
                      borderRadius: borderRadius.md,
                      cursor: 'pointer',
                      transition: 'all 300ms linear',
                      py: 1,
                      px: 1.625,

                      '&:hover': {
                        backgroundColor: grey[200],
                        color: dark.main,

                        '& *': {
                          color: dark.main,
                        },
                      },
                    })}
                  >
                    <MDTypography
                      display='block'
                      variant='button'
                      fontWeight='bold'
                      textTransform='capitalize'
                    >
                      {item.name}
                    </MDTypography>
                    <MDTypography
                      display='block'
                      variant='button'
                      color='text'
                      fontWeight='regular'
                      sx={{ transition: 'all 300ms linear' }}
                    >
                      {item.description}
                    </MDTypography>
                  </MDBox>
                )}
              </MDBox>
            ))}
        </MDBox>
      </DefaultNavbarDropdown>
    )
  )

  return (
    <Collapse
      in={Boolean(open)}
      timeout='auto'
      unmountOnExit
    >
      <MDBox
        width='calc(100% + 1.625rem)'
        my={2}
        ml={-2}
      >
        {renderNavbarItems}
      </MDBox>
    </Collapse>
  )
}

export default DefaultNavbarMobile
