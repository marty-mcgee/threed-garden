// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

const initialState = {
  mouseX: null,
  mouseY: null
}

const MenuContext = () => {
  // ** State
  const [state, setState] = useState(initialState)

  const handleClick = event => {
    event.preventDefault()
    setState({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4
    })
  }

  const handleClose = () => {
    setState(initialState)
  }

  return (
    <Box onContextMenu={handleClick} sx={{ cursor: 'context-menu' }}>
      <Typography>
        Apple pie bonbon sweet brownie cake lemon drops carrot cake danish carrot cake. Marzipan jujubes cupcake cake
        bear claw jujubes. Macaroon candy canes jelly-o sugar plum biscuit. Cupcake cupcake oat cake cookie donut candy
        canes chupa chups. Jelly beans carrot cake soufflé gummies sweet cake halvah carrot cake. Candy marshmallow
        apple pie donut toffee pudding jelly croissant jelly. Dragée cake liquorice cake gummi bears. Gummi bears
        caramels tootsie roll caramels lemon drops caramels chocolate cake jelly oat cake. Oat cake tart biscuit cake.
      </Typography>
      <Menu
        keepMounted
        onClose={handleClose}
        open={state.mouseY !== null}
        anchorReference='anchorPosition'
        anchorPosition={
          state.mouseY !== null && state.mouseX !== null ? { top: state.mouseY, left: state.mouseX } : undefined
        }
      >
        <MenuItem onClick={handleClose}>Copy</MenuItem>
        <MenuItem onClick={handleClose}>Print</MenuItem>
        <MenuItem onClick={handleClose}>Email</MenuItem>
        <MenuItem onClick={handleClose}>Highlight</MenuItem>
      </Menu>
    </Box>
  )
}

export default MenuContext
