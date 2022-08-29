// ** React Imports
import { useRef, useState, Fragment } from 'react'

// ** MUI Imports
import Grow from '@mui/material/Grow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Popper from '@mui/material/Popper'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import ButtonGroup from '@mui/material/ButtonGroup'
import ClickAwayListener from '@mui/material/ClickAwayListener'

// ** Icons Imports
import MenuDown from 'mdi-material-ui/MenuDown'

const options = ['Create a merge commit', 'Squash and merge', 'Rebase and merge']

const ButtonGroupSplit = () => {
  // ** States
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(1)

  // ** Ref
  const anchorRef = useRef(null)

  const handleClick = () => {
    console.info(`You clicked '${options[selectedIndex]}'`)
  }

  const handleMenuItemClick = (event, index) => {
    setSelectedIndex(index)
    setOpen(false)
  }

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Fragment>
      <ButtonGroup variant='contained' ref={anchorRef} aria-label='split button'>
        <Button onClick={handleClick}>{options[selectedIndex]}</Button>
        <Button
          size='small'
          aria-haspopup='menu'
          onClick={handleToggle}
          aria-label='select merge strategy'
          aria-expanded={open ? 'true' : undefined}
          aria-controls={open ? 'split-button-menu' : undefined}
        >
          <MenuDown />
        </Button>
      </ButtonGroup>
      <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal>
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id='split-button-menu'>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option}
                      disabled={index === 2}
                      selected={index === selectedIndex}
                      onClick={event => handleMenuItemClick(event, index)}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Fragment>
  )
}

export default ButtonGroupSplit
