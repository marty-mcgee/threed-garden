// ** React Imports
import { useState, useEffect } from 'react'

// ** Redux Imports
import { useDispatch, useSelector } from 'react-redux'

// ** MUI Imports
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

// ** Hooks
import { useSettings } from 'src/@core/hooks/useSettings'

// ** Email App Component Imports
import MailLog from 'src/views/apps/email/MailLog'
import SidebarLeft from 'src/views/apps/email/SidebarLeft'
import ComposePopup from 'src/views/apps/email/ComposePopup'

// ** Actions
import {
  fetchMails,
  updateMail,
  paginateMail,
  getCurrentMail,
  updateMailLabel,
  handleSelectMail,
  handleSelectAllMail
} from 'src/store/apps/email'

// ** Variables
const labelColors = {
  private: 'error',
  personal: 'success',
  company: 'primary',
  important: 'warning'
}

const EmailAppLayout = ({ folder, label }) => {
  // ** States
  const [query, setQuery] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [mailDetailsOpen, setMailDetailsOpen] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)

  // ** Hooks
  const theme = useTheme()
  const { settings } = useSettings()
  const dispatch = useDispatch()
  const lgAbove = useMediaQuery(theme.breakpoints.up('lg'))
  const mdAbove = useMediaQuery(theme.breakpoints.up('md'))
  const smAbove = useMediaQuery(theme.breakpoints.up('sm'))
  const hidden = useMediaQuery(theme.breakpoints.down('lg'))
  const store = useSelector(state => state.email)

  // ** Vars
  const leftSidebarWidth = 260
  const composePopupWidth = mdAbove ? 754 : smAbove ? 520 : '100%'
  const { skin, appBar, footer, layout, navHidden, direction } = settings

  const routeParams = {
    label: label || '',
    folder: folder || 'inbox'
  }
  useEffect(() => {
    // @ts-ignore
    dispatch(fetchMails({ q: query || '', folder: routeParams.folder, label: routeParams.label }))
  }, [dispatch, query, routeParams.folder, routeParams.label])
  const toggleComposeOpen = () => setComposeOpen(!composeOpen)
  const handleLeftSidebarToggle = () => setLeftSidebarOpen(!leftSidebarOpen)

  const calculateAppHeight = () => {
    return `(${
      (appBar === 'hidden' ? 0 : theme.mixins.toolbar.minHeight) * (layout === 'horizontal' && !navHidden ? 2 : 1) +
      (footer === 'hidden' ? 0 : 56)
    }px + ${theme.spacing(6)} * 2)`
  }

  return (
    <Box
      sx={{
        display: 'flex',
        borderRadius: 1,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: skin === 'bordered' ? 0 : 6,
        height: `calc(100vh - ${calculateAppHeight()})`,
        ...(skin === 'bordered' && { border: `1px solid ${theme.palette.divider}` })
      }}
    >
      <SidebarLeft
        store={store}
        hidden={hidden}
        lgAbove={lgAbove}
        dispatch={dispatch}
        mailDetailsOpen={mailDetailsOpen}
        leftSidebarOpen={leftSidebarOpen}
        leftSidebarWidth={leftSidebarWidth}
        toggleComposeOpen={toggleComposeOpen}
        setMailDetailsOpen={setMailDetailsOpen}
        handleSelectAllMail={handleSelectAllMail}
        handleLeftSidebarToggle={handleLeftSidebarToggle}
      />
      <MailLog
        query={query}
        store={store}
        hidden={hidden}
        lgAbove={lgAbove}
        dispatch={dispatch}
        setQuery={setQuery}
        direction={direction}
        updateMail={updateMail}
        routeParams={routeParams}
        labelColors={labelColors}
        paginateMail={paginateMail}
        getCurrentMail={getCurrentMail}
        updateMailLabel={updateMailLabel}
        mailDetailsOpen={mailDetailsOpen}
        handleSelectMail={handleSelectMail}
        setMailDetailsOpen={setMailDetailsOpen}
        handleSelectAllMail={handleSelectAllMail}
        handleLeftSidebarToggle={handleLeftSidebarToggle}
      />
      <ComposePopup
        mdAbove={mdAbove}
        composeOpen={composeOpen}
        composePopupWidth={composePopupWidth}
        toggleComposeOpen={toggleComposeOpen}
      />
    </Box>
  )
}

export default EmailAppLayout
