// ** MUI Imports
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'

// ** Icons Imports
import MenuIcon from 'mdi-material-ui/Menu'

// ** Components
import Autocomplete from '#/ui/layouts/common/Autocomplete'
import ModeToggler from '#/ui/layouts/common/ModeToggler'
import UserDropdown from '#/ui/layouts/common/UserDropdown'
import LanguageDropdown from '#/ui/layouts/common/LanguageDropdown'
import NotificationDropdown from '#/ui/layouts/common/NotificationDropdown'

const AppBarContent = (props) => {
  // ** Props
  const { hidden, settings, saveSettings, toggleNavVisibility } = props

  return (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box className='actions-left' sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
        {/* THREED GARDEN
        {hidden ? (
          <IconButton color='inherit' sx={{ ml: -2.75 }} onClick={toggleNavVisibility}>
            <MenuIcon />
          </IconButton>
        ) : (
          // ) : null}
          <IconButton color='inherit' sx={{ ml: 2.75 }} onClick={toggleNavVisibility}>
            <MenuIcon />
          </IconButton>
        )} */}
      </Box>
      <Box className='actions-right' sx={{ display: 'flex', alignItems: 'center' }}>
        <Autocomplete hidden={hidden} settings={settings} />
        <LanguageDropdown settings={settings} saveSettings={saveSettings} />
        <ModeToggler settings={settings} saveSettings={saveSettings} />
        <NotificationDropdown settings={settings} />
        <UserDropdown settings={settings} />
      </Box>
    </Box>
  )
}

export default AppBarContent
