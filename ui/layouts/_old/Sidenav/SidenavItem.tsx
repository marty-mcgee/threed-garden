import { ReactNode } from 'react'

// @mui material components
import Collapse from '@mui/material/Collapse'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Icon from '@mui/material/Icon'
import type { Theme } from '@mui/material/styles'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'

// Custom styles for the SidenavItem
import { item, itemContent, itemArrow } from '#/ui/layouts/_old/Sidenav/styles/sidenavItem'

// ThreeD Garden contexts
import { useMaterialUIController } from '#/lib/contexts/MaterialUIContext'

// Declaring props types for SidenavCollapse
interface Props {
  color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'dark'
  name: string
  active?: boolean | string
  nested?: boolean
  children?: ReactNode
  open?: boolean
  [key: string]: any
}

function SidenavItem({ color, name, active, nested, children, open, ...rest }: Props): JSX.Element {
  const [controller] = useMaterialUIController()
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode } = controller

  return (
    <>
      <ListItem
        {...rest}
        component='li'
        sx={(theme) =>
          item(theme, {
            active,
            color,
            transparentSidenav,
            whiteSidenav,
            darkMode,
          })
        }
      >
        <MDBox
          sx={(theme: Theme): any =>
            itemContent(theme, {
              active,
              miniSidenav,
              name,
              open,
              nested,
              transparentSidenav,
              whiteSidenav,
              darkMode,
            })
          }
        >
          <ListItemText primary={name} />
          {children && (
            <Icon
              component='i'
              sx={(theme) =>
                itemArrow(theme, {
                  open,
                  miniSidenav,
                  transparentSidenav,
                  whiteSidenav,
                  darkMode,
                })
              }
            >
              expand_less
            </Icon>
          )}
        </MDBox>
      </ListItem>
      {children && (
        <Collapse
          in={open}
          timeout='auto'
          unmountOnExit
          {...rest}
        >
          {children}
        </Collapse>
      )}
    </>
  )
}

// Declaring default props for SidenavItem
SidenavItem.defaultProps = {
  color: 'dark',
  active: true,
  nested: false,
  children: false,
  open: true,
}

export default SidenavItem
