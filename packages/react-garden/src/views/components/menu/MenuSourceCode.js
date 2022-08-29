export const MenuBasicJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Menu from '@mui/material/Menu'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'

const MenuBasic = () => {
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
      <Button variant='outlined' aria-controls='simple-menu' aria-haspopup='true' onClick={handleClick}>
        Open Menu
      </Button>
      <Menu keepMounted id='simple-menu' anchorEl={anchorEl} onClose={handleClose} open={Boolean(anchorEl)}>
        <MenuItem onClick={handleClose}>Profile</MenuItem>
        <MenuItem onClick={handleClose}>My account</MenuItem>
        <MenuItem onClick={handleClose}>Logout</MenuItem>
      </Menu>
    </div>
  )
}

export default MenuBasic
`}</code>
  </pre>
)

export const MenuCompositionJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useEffect, useRef, useState } from 'react'

// ** MUI Imports
import Grow from '@mui/material/Grow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Popper from '@mui/material/Popper'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
import ClickAwayListener from '@mui/material/ClickAwayListener'

// ** Hook Import
import { useSettings } from 'src/@core/hooks/useSettings'

const MenuComposition = () => {
  // ** States
  const [open, setOpen] = useState(false)

  // ** Hook & Var
  const { settings } = useSettings()
  const { skin } = settings

  // ** Ref
  const anchorRef = useRef(null)

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  const handleClose = event => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return
    }
    setOpen(false)
  }

  const handleListKeyDown = event => {
    if (event.key === 'Tab') {
      event.preventDefault()
      setOpen(false)
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = useRef(open)
  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus()
    }
    prevOpen.current = open
  }, [open])

  return (
    <div>
      <Button
        ref={anchorRef}
        variant='outlined'
        aria-haspopup='true'
        onClick={handleToggle}
        id='composition-button'
        aria-expanded={open ? 'true' : undefined}
        aria-controls={open ? 'composition-menu' : undefined}
        sx={{ '& + div': { zIndex: theme => theme.zIndex.modal } }}
      >
        Open Menu
      </Button>
      <Popper
        transition
        open={open}
        disablePortal
        role={undefined}
        placement='bottom-start'
        anchorEl={anchorRef.current}
        popperOptions={{
          modifiers: [
            {
              name: 'flip',
              options: {
                enabled: true,
                boundary: 'window'
              }
            }
          ]
        }}
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom-start' ? 'left top' : 'left bottom' }}
          >
            <Paper
              elevation={skin === 'bordered' ? 0 : 6}
              sx={skin === 'bordered' ? { border: theme => 1px solid {theme.palette.divider} } : {}}
            >
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <MenuList autoFocusItem={open} id='composition-menu' onKeyDown={handleListKeyDown}>
                  <MenuItem onClick={handleClose}>Profile</MenuItem>
                  <MenuItem onClick={handleClose}>My account</MenuItem>
                  <MenuItem onClick={handleClose}>Logout</MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  )
}

export default MenuComposition
`}</code>
  </pre>
)

export const MenuCustomizedJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import MuiMenu from '@mui/material/Menu'
import MuiMenuItem from '@mui/material/MenuItem'

// ** Icons Imports
import Send from 'mdi-material-ui/Send'
import EmailOpen from 'mdi-material-ui/EmailOpen'
import InboxArrowDown from 'mdi-material-ui/InboxArrowDown'

// Styled Menu component
const Menu = styled(MuiMenu)(({ theme }) => ({
  '& .MuiMenu-paper': {
    border: 1px solid {theme.palette.divider}
  }
}))

// Styled MenuItem component
const MenuItem = styled(MuiMenuItem)(({ theme }) => ({
  '&:focus': {
    backgroundColor: theme.palette.primary.main,
    '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
      color: theme.palette.common.white
    }
  }
}))

const MenuCustomized = () => {
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
      <Button variant='outlined' aria-haspopup='true' onClick={handleClick} aria-controls='customized-menu'>
        Open Menu
      </Button>
      <Menu
        keepMounted
        elevation={0}
        anchorEl={anchorEl}
        id='customized-menu'
        onClose={handleClose}
        open={Boolean(anchorEl)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        <MenuItem>
          <ListItemIcon>
            <Send fontSize='small' />
          </ListItemIcon>
          <ListItemText primary='Sent mail' />
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <EmailOpen fontSize='small' />
          </ListItemIcon>
          <ListItemText primary='Drafts' />
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <InboxArrowDown fontSize='small' />
          </ListItemIcon>
          <ListItemText primary='Inbox' />
        </MenuItem>
      </Menu>
    </div>
  )
}

export default MenuCustomized
`}</code>
  </pre>
)

export const MenuContextJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
`}</code>
  </pre>
)

export const MenuSelectedJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import List from '@mui/material/List'
import Menu from '@mui/material/Menu'
import ListItem from '@mui/material/ListItem'
import MenuItem from '@mui/material/MenuItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'

const options = [
  'Show some love to MUI',
  'Show all notification content',
  'Hide sensitive notification content',
  'Hide all notification content'
]

const MenuSelected = () => {
  // ** State
  const [selectedIndex, setSelectedIndex] = useState(1)

  // ** Ref
  const [anchorEl, setAnchorEl] = useState(null)

  const handleClickListItem = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuItemClick = (event, index) => {
    setAnchorEl(null)
    setSelectedIndex(index)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <div>
      <List component='nav' sx={{ p: 0 }} aria-label='Device settings'>
        <ListItem
          disablePadding
          aria-haspopup='true'
          aria-controls='lock-menu'
          onClick={handleClickListItem}
          aria-label='when device is locked'
        >
          <ListItemButton>
            <ListItemText primary='When device is locked' secondary={options[selectedIndex]} />
          </ListItemButton>
        </ListItem>
      </List>
      <Menu id='lock-menu' anchorEl={anchorEl} keepMounted open={Boolean(anchorEl)} onClose={handleClose}>
        {options.map((option, index) => (
          <MenuItem
            key={option}
            disabled={index === 0}
            selected={index === selectedIndex}
            onClick={event => handleMenuItemClick(event, index)}
          >
            {option}
          </MenuItem>
        ))}
      </Menu>
    </div>
  )
}

export default MenuSelected
`}</code>
  </pre>
)

export const MenuMaxHeightJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import IconButton from '@mui/material/IconButton'

// ** Icons Imports
import DotsVertical from 'mdi-material-ui/DotsVertical'

const options = [
  'None',
  'Atria',
  'Callisto',
  'Dione',
  'Ganymede',
  'Hangouts Call',
  'Luna',
  'Oberon',
  'Phobos',
  'Pyxis',
  'Sedna',
  'Titania',
  'Triton',
  'Umbriel'
]
const ITEM_HEIGHT = 48

const MenuMaxHeight = () => {
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
      <IconButton aria-label='more' aria-controls='long-menu' aria-haspopup='true' onClick={handleClick}>
        <DotsVertical />
      </IconButton>
      <Menu
        keepMounted
        id='long-menu'
        anchorEl={anchorEl}
        onClose={handleClose}
        open={Boolean(anchorEl)}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 4.5
          }
        }}
      >
        {options.map(option => (
          <MenuItem key={option} selected={option === 'Pyxis'} onClick={handleClose}>
            {option}
          </MenuItem>
        ))}
      </Menu>
    </div>
  )
}

export default MenuMaxHeight
`}</code>
  </pre>
)

export const MenuTransitionJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
`}</code>
  </pre>
)
