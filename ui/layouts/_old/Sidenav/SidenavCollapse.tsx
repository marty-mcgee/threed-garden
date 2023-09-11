import { ReactNode } from 'react'

// @mui material components
import Collapse from '@mui/material/Collapse'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Icon from '@mui/material/Icon'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'

// Custom styles for the SidenavCollapse
import {
  collapseItem,
  collapseIconBox,
  collapseIcon,
  collapseText,
  collapseArrow,
} from '#/ui/layouts/_old/Sidenav/styles/sidenavCollapse'

// ThreeD Garden context
import { useMaterialUIController } from '#/lib/contexts'

// Declaring props types for SidenavCollapse
interface Props {
  icon: ReactNode
  name: string
  children?: ReactNode
  active?: boolean
  noCollapse?: boolean
  open?: boolean
  [key: string]: any
}

function SidenavCollapse({ icon, name, children, active, noCollapse, open, ...rest }: Props): JSX.Element {
  const [controller] = useMaterialUIController()
  const { miniSidenav, transparentSidenav, whiteSidenav, darkMode } = controller

  return (
    <>
      <ListItem component='li'>
        <MDBox
          {...rest}
          sx={(theme: any) =>
            collapseItem(theme, {
              active,
              transparentSidenav,
              whiteSidenav,
              darkMode,
            })
          }
        >
          <ListItemIcon
            sx={(theme) =>
              collapseIconBox(theme, {
                transparentSidenav,
                whiteSidenav,
                darkMode,
              })
            }
          >
            {typeof icon === 'string' ? <Icon sx={(theme) => collapseIcon(theme, { active })}>{icon}</Icon> : icon}
          </ListItemIcon>

          <ListItemText
            primary={name}
            sx={(theme) =>
              collapseText(theme, {
                miniSidenav,
                transparentSidenav,
                whiteSidenav,
                active,
              })
            }
          />

          <Icon
            sx={(theme) =>
              collapseArrow(theme, {
                noCollapse,
                transparentSidenav,
                whiteSidenav,
                miniSidenav,
                open,
                active,
                darkMode,
              })
            }
          >
            expand_less
          </Icon>
        </MDBox>
      </ListItem>
      {children && (
        <Collapse
          in={Boolean(open)}
          unmountOnExit
        >
          {children}
        </Collapse>
      )}
    </>
  )
}

// Declaring default props for SidenavCollapse
SidenavCollapse.defaultProps = {
  active: false,
  noCollapse: false,
  children: false,
  open: false,
}

export default SidenavCollapse
