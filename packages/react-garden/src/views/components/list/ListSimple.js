// ** React Imports
import { Fragment } from 'react'

// ** MUI Imports
import List from '@mui/material/List'
import Divider from '@mui/material/Divider'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'

// ** Icons Imports
import ContentCopy from 'mdi-material-ui/ContentCopy'
import EmailOutline from 'mdi-material-ui/EmailOutline'
import ClockOutline from 'mdi-material-ui/ClockOutline'
import AlertCircleOutline from 'mdi-material-ui/AlertCircleOutline'

const ListSimple = () => {
  return (
    <Fragment>
      <List component='nav' aria-label='main mailbox'>
        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <EmailOutline fontSize='small' />
            </ListItemIcon>
            <ListItemText primary='Inbox' />
          </ListItemButton>
        </ListItem>
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
          <ListItemButton component='a' href='#simple-list'>
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

export default ListSimple
