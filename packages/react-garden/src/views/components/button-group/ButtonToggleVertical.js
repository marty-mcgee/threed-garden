// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

// ** Icons Imports
import ViewList from 'mdi-material-ui/ViewList'
import ViewQuilt from 'mdi-material-ui/ViewQuilt'
import ViewModule from 'mdi-material-ui/ViewModule'

const ButtonToggleVertical = () => {
  // ** State
  const [view, setView] = useState('left')

  const handleView = (event, newView) => {
    setView(newView)
  }

  return (
    <ToggleButtonGroup exclusive value={view} orientation='vertical' onChange={handleView} aria-label='text alignment'>
      <ToggleButton value='left' aria-label='left aligned'>
        <ViewList />
      </ToggleButton>
      <ToggleButton value='center' aria-label='center aligned'>
        <ViewModule />
      </ToggleButton>
      <ToggleButton value='right' aria-label='right aligned'>
        <ViewQuilt />
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

export default ButtonToggleVertical
