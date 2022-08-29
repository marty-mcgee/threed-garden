// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import List from '@mui/material/List'
import Avatar from '@mui/material/Avatar'
import ListItem from '@mui/material/ListItem'
import IconButton from '@mui/material/IconButton'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'

// ** Icons Imports
import MessageTextOutline from 'mdi-material-ui/MessageTextOutline'

const ListItemSelected = () => {
  // ** State
  const [selectedIndex, setSelectedIndex] = useState(1)

  const handleListItemClick = index => {
    setSelectedIndex(index)
  }

  return (
    <List>
      <ListItem disablePadding>
        <ListItemButton selected={selectedIndex === 0} onClick={() => handleListItemClick(0)}>
          <ListItemAvatar>
            <Avatar src='/images/avatars/2.png' alt='Caroline Black' />
          </ListItemAvatar>
          <ListItemText primary='Caroline Black' />
          <ListItemSecondaryAction>
            <IconButton edge='end'>
              <MessageTextOutline fontSize='small' />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton selected={selectedIndex === 1} onClick={() => handleListItemClick(1)}>
          <ListItemAvatar>
            <Avatar src='/images/avatars/1.png' alt='Alfred Copeland' />
          </ListItemAvatar>
          <ListItemText primary='Alfred Copeland' />
          <ListItemSecondaryAction>
            <IconButton edge='end'>
              <MessageTextOutline fontSize='small' />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton selected={selectedIndex === 2} onClick={() => handleListItemClick(2)}>
          <ListItemAvatar>
            <Avatar src='/images/avatars/8.png' alt='Celia Schneider' />
          </ListItemAvatar>
          <ListItemText primary='Celia Schneider' />
          <ListItemSecondaryAction>
            <IconButton edge='end'>
              <MessageTextOutline fontSize='small' />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItemButton>
      </ListItem>
    </List>
  )
}

export default ListItemSelected
