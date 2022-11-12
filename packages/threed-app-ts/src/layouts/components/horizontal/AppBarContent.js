// ** MUI Imports
import Box from '@mui/material/Box'

// ** Components
import Autocomplete from '~/layouts/components/Autocomplete'
import ModeToggler from '~/@core/layouts/components/shared-components/ModeToggler'
import UserDropdown from '~/@core/layouts/components/shared-components/UserDropdown'
import LanguageDropdown from '~/@core/layouts/components/shared-components/LanguageDropdown'
import NotificationDropdown from '~/@core/layouts/components/shared-components/NotificationDropdown'

const AppBarContent = (props) => {
  // ** Props
  const { hidden, settings, saveSettings } = props

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Autocomplete
        hidden={hidden}
        settings={settings}
      />
      <LanguageDropdown
        settings={settings}
        saveSettings={saveSettings}
      />
      <ModeToggler
        settings={settings}
        saveSettings={saveSettings}
      />
      <NotificationDropdown settings={settings} />
      <UserDropdown settings={settings} />
    </Box>
  )
}

export default AppBarContent
