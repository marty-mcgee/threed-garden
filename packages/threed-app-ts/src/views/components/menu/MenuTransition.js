// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Menu from '@mui/material/Menu'
import Fade from '@mui/material/Fade'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'

const MenuTransition = () => {
  // ** State
  const [anchorEl, setAnchorEl] = useState(null)

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <div>
      <Button variant='outlined' aria-controls='fade-menu' aria-haspopup='true' onClick={handleClick}>
        Open with fade transition
      </Button>
      <Menu
        keepMounted
        id='fade-menu'
        anchorEl={anchorEl}
        onClose={handleClose}
        open={Boolean(anchorEl)}
        TransitionComponent={Fade}
      >
        <MenuItem onClick={handleClose}>Profile</MenuItem>
        <MenuItem onClick={handleClose}>My account</MenuItem>
        <MenuItem onClick={handleClose}>Logout</MenuItem>
      </Menu>
    </div>
  )
}

export default MenuTransition
