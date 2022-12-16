// ** MUI Imports
import Box from '@mui/material/Box'

// ** Components
import Autocomplete from '#/ui/layouts/common/Autocomplete'
import ModeToggler from '#/ui/layouts/common/ModeToggler'
import UserDropdown from '#/ui/layouts/common/UserDropdown'
import LanguageDropdown from '#/ui/layouts/common/LanguageDropdown'
import NotificationDropdown from '#/ui/layouts/common/NotificationDropdown'

const AppBarContent = (props) => {
  // ** Props
  const { hidden, settings, saveSettings } = props

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Autocomplete hidden={hidden} settings={settings} />
      <LanguageDropdown settings={settings} saveSettings={saveSettings} />
      <ModeToggler settings={settings} saveSettings={saveSettings} />
      <NotificationDropdown settings={settings} />
      <UserDropdown settings={settings} />
    </Box>
  )
}

export default AppBarContent
