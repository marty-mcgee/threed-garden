// ** React Imports
import { Fragment, useEffect, useState } from 'react'

// ** MUI Imports
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'

// ** Icons Imports
import Translate from 'mdi-material-ui/Translate'

// ** Third Party Import
import { useTranslation } from 'react-i18next'

const LanguageDropdown = ({ settings, saveSettings }) => {
  // ** State
  const [anchorEl, setAnchorEl] = useState(null)

  // ** Hook
  const { i18n } = useTranslation()

  // ** Vars
  const { layout, direction } = settings
  useEffect(() => {
    if (i18n.language === 'ar' && direction === 'ltr') {
      saveSettings({ ...settings, direction: 'ltr' })
    } else if (i18n.language === 'ar' || direction === 'rtl') {
      saveSettings({ ...settings, direction: 'rtl' })
    } else {
      saveSettings({ ...settings, direction: 'ltr' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, direction])

  const handleLangDropdownOpen = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleLangDropdownClose = () => {
    setAnchorEl(null)
  }

  const handleLangItemClick = lang => {
    i18n.changeLanguage(lang)
    handleLangDropdownClose()
  }

  return (
    <Fragment>
      <IconButton
        color='inherit'
        aria-haspopup='true'
        aria-controls='customized-menu'
        onClick={handleLangDropdownOpen}
        sx={layout === 'vertical' ? { mr: 0.75 } : { mx: 0.75 }}
      >
        <Translate />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleLangDropdownClose}
        sx={{ '& .MuiMenu-paper': { mt: 4, minWidth: 130 } }}
        anchorOrigin={{ vertical: 'bottom', horizontal: direction === 'ltr' ? 'right' : 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: direction === 'ltr' ? 'right' : 'left' }}
      >
        <MenuItem
          sx={{ py: 2 }}
          selected={i18n.language === 'en'}
          onClick={() => {
            handleLangItemClick('en')
            saveSettings({ ...settings, direction: 'ltr' })
          }}
        >
          English
        </MenuItem>
        <MenuItem
          sx={{ py: 2 }}
          selected={i18n.language === 'fr'}
          onClick={() => {
            handleLangItemClick('fr')
            saveSettings({ ...settings, direction: 'ltr' })
          }}
        >
          French
        </MenuItem>
        <MenuItem
          sx={{ py: 2 }}
          selected={i18n.language === 'ar'}
          onClick={() => {
            handleLangItemClick('ar')
            saveSettings({ ...settings, direction: 'rtl' })
          }}
        >
          Arabic
        </MenuItem>
      </Menu>
    </Fragment>
  )
}

export default LanguageDropdown
