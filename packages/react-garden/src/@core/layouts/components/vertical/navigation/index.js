// ** React Import
import { useRef, useState } from 'react'

// ** MUI Import
import List from '@mui/material/List'
import Box from '@mui/material/Box'
import { styled, useTheme } from '@mui/material/styles'

// ** Third Party Components
import PerfectScrollbar from 'react-perfect-scrollbar'
import themeConfig from 'src/configs/themeConfig'

// ** Component Imports
import Drawer from './Drawer'
import VerticalNavItems from './VerticalNavItems'
import VerticalNavHeader from './VerticalNavHeader'

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba'

const StyledBoxForShadow = styled(Box)(({ theme }) => ({
  top: 60,
  left: -8,
  zIndex: 2,
  display: 'none',
  position: 'absolute',
  pointerEvents: 'none',
  width: 'calc(100% + 15px)',
  height: theme.mixins.toolbar.minHeight,
  '&.d-block': {
    display: 'block'
  }
}))

const Navigation = props => {
  // ** Props
  const {
    hidden,
    navHover,
    settings,
    afterVerticalNavMenuContent,
    beforeVerticalNavMenuContent,
    verticalNavMenuContent: userVerticalNavMenuContent
  } = props

  // ** States
  const [groupActive, setGroupActive] = useState([])
  const [currentActiveGroup, setCurrentActiveGroup] = useState([])

  // ** Ref
  const shadowRef = useRef(null)

  // ** Hooks
  const theme = useTheme()

  // ** Var
  const { skin, navCollapsed } = settings
  const { afterVerticalNavMenuContentPosition, beforeVerticalNavMenuContentPosition } = themeConfig

  // ** Fixes Navigation InfiniteScroll
  const handleInfiniteScroll = ref => {
    if (ref) {
      // @ts-ignore
      ref._getBoundingClientRect = ref.getBoundingClientRect
      ref.getBoundingClientRect = () => {
        // @ts-ignore
        const original = ref._getBoundingClientRect()

        return { ...original, height: Math.floor(original.height) }
      }
    }
  }

  // ** Scroll Menu
  const scrollMenu = container => {
    if (beforeVerticalNavMenuContentPosition === 'static' || !beforeVerticalNavMenuContent) {
      container = hidden ? container.target : container
      if (shadowRef && container.scrollTop > 0) {
        // @ts-ignore
        if (!shadowRef.current.classList.contains('d-block')) {
          // @ts-ignore
          shadowRef.current.classList.add('d-block')
        }
      } else {
        // @ts-ignore
        shadowRef.current.classList.remove('d-block')
      }
    }
  }

  const shadowBgColor = () => {
    if (skin === 'semi-dark' && theme.palette.mode === 'light') {
      return `linear-gradient(${theme.palette.customColors.darkBg} 5%,${hexToRGBA(
        theme.palette.customColors.darkBg,
        0.85
      )} 30%,${hexToRGBA(theme.palette.customColors.darkBg, 0.5)} 65%,${hexToRGBA(
        theme.palette.customColors.darkBg,
        0.3
      )} 75%,transparent)`
    } else if (skin === 'semi-dark' && theme.palette.mode === 'dark') {
      return `linear-gradient(${theme.palette.customColors.lightBg} 5%,${hexToRGBA(
        theme.palette.customColors.lightBg,
        0.85
      )} 30%,${hexToRGBA(theme.palette.customColors.lightBg, 0.5)} 65%,${hexToRGBA(
        theme.palette.customColors.lightBg,
        0.3
      )} 75%,transparent)`
    } else {
      return `linear-gradient(${theme.palette.background.default} 5%,${hexToRGBA(
        theme.palette.background.default,
        0.85
      )} 30%,${hexToRGBA(theme.palette.background.default, 0.5)} 65%,${hexToRGBA(
        theme.palette.background.default,
        0.3
      )} 75%,transparent)`
    }
  }
  const ScrollWrapper = hidden ? Box : PerfectScrollbar

  return (
    <Drawer {...props}>
      <VerticalNavHeader {...props} />
      {beforeVerticalNavMenuContent && beforeVerticalNavMenuContentPosition === 'fixed'
        ? beforeVerticalNavMenuContent(props)
        : null}
      {(beforeVerticalNavMenuContentPosition === 'static' || !beforeVerticalNavMenuContent) && (
        <StyledBoxForShadow ref={shadowRef} sx={{ background: shadowBgColor() }} />
      )}
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <ScrollWrapper
          containerRef={ref => handleInfiniteScroll(ref)}
          {...(hidden
            ? {
                onScroll: container => scrollMenu(container),
                sx: { height: '100%', overflowY: 'auto', overflowX: 'hidden' }
              }
            : {
                options: { wheelPropagation: false },
                onScrollY: container => scrollMenu(container)
              })}
        >
          {beforeVerticalNavMenuContent && beforeVerticalNavMenuContentPosition === 'static'
            ? beforeVerticalNavMenuContent(props)
            : null}
          {userVerticalNavMenuContent ? (
            userVerticalNavMenuContent(props)
          ) : (
            <List
              className='nav-items'
              sx={{
                pt: 0,
                transition: 'padding .25s ease',
                '& > :first-child': { mt: '0' },
                pr: !navCollapsed || (navCollapsed && navHover) ? 4.5 : 1.25
              }}
            >
              <VerticalNavItems
                groupActive={groupActive}
                setGroupActive={setGroupActive}
                currentActiveGroup={currentActiveGroup}
                setCurrentActiveGroup={setCurrentActiveGroup}
                {...props}
              />
            </List>
          )}
          {afterVerticalNavMenuContent && afterVerticalNavMenuContentPosition === 'static'
            ? afterVerticalNavMenuContent(props)
            : null}
        </ScrollWrapper>
      </Box>
      {afterVerticalNavMenuContent && afterVerticalNavMenuContentPosition === 'fixed'
        ? afterVerticalNavMenuContent(props)
        : null}
    </Drawer>
  )
}

export default Navigation
