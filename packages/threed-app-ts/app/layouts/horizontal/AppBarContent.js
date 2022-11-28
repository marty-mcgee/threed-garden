// ** MUI Imports
import Box from '@mui/material/Box'

// ** Components
import Autocomplete from '#/app/layouts/Autocomplete'
import ModeToggler from '#/ui/~core/layouts/shared-components/ModeToggler'
import UserDropdown from '#/ui/~core/layouts/shared-components/UserDropdown'
import LanguageDropdown from '#/ui/~core/layouts/shared-components/LanguageDropdown'
import NotificationDropdown from '#/ui/~core/layouts/shared-components/NotificationDropdown'

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
