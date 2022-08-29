// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import List from '@mui/material/List'
import Divider from '@mui/material/Divider'
import ListItem from '@mui/material/ListItem'
import Collapse from '@mui/material/Collapse'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'

// ** Icons Imports
import ChevronUp from 'mdi-material-ui/ChevronUp'
import SendClock from 'mdi-material-ui/SendClock'
import ContentCopy from 'mdi-material-ui/ContentCopy'
import ChevronDown from 'mdi-material-ui/ChevronDown'
import EmailOutline from 'mdi-material-ui/EmailOutline'
import ClockOutline from 'mdi-material-ui/ClockOutline'
import AlertCircleOutline from 'mdi-material-ui/AlertCircleOutline'

const ListNested = () => {
  // ** State
  const [open, setOpen] = useState(true)

  const handleClick = () => {
    setOpen(!open)
  }

  return (
    <Fragment>
      <List component='nav' aria-label='main mailbox'>
        <ListItem disablePadding>
          <ListItemButton onClick={handleClick}>
            <ListItemIcon>
              <EmailOutline fontSize='small' />
            </ListItemIcon>
            <ListItemText primary='Inbox' />
            {open ? <ChevronUp /> : <ChevronDown />}
          </ListItemButton>
        </ListItem>
        <Collapse in={open} timeout='auto' unmountOnExit>
          <List component='div' disablePadding>
            <ListItem disablePadding>
              <ListItemButton sx={{ pl: 8 }}>
                <ListItemIcon sx={{ mr: 4 }}>
                  <SendClock fontSize='small' />
                </ListItemIcon>
                <ListItemText primary='Scheduled' />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <ContentCopy fontSize='small' />
            </ListItemIcon>
            <ListItemText primary='Draft' />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider sx={{ m: 0 }} />
      <List component='nav' aria-label='secondary mailbox'>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <ClockOutline fontSize='small' />
            </ListItemIcon>
            <ListItemText primary='Snoozed' />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <AlertCircleOutline fontSize='small' />
            </ListItemIcon>
            <ListItemText primary='Spam' />
          </ListItemButton>
        </ListItem>
      </List>
    </Fragment>
  )
}

export default ListNested
