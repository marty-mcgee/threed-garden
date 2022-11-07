// ** MUI Imports
import List from '@mui/material/List'
import Avatar from '@mui/material/Avatar'
import ListItem from '@mui/material/ListItem'
import IconButton from '@mui/material/IconButton'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'

// ** Icons Imports
import Plus from 'mdi-material-ui/Plus'

const ListSecondary = () => {
  return (
    <List>
      <ListItem>
        <ListItemAvatar>
          <Avatar src='/images/avatars/2.png' alt='Caroline Black' />
        </ListItemAvatar>
        <ListItemText primary='Caroline Black' secondary='Sweet dessert brownie.' />
        <ListItemSecondaryAction>
          <IconButton edge='end'>
            <Plus />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
      <ListItem>
        <ListItemAvatar>
          <Avatar src='/images/avatars/1.png' alt='Alfred Copeland' />
        </ListItemAvatar>
        <ListItemText primary='Alfred Copeland' secondary='Pudding pie tiramisu.' />
        <ListItemSecondaryAction>
          <IconButton edge='end'>
            <Plus />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
      <ListItem>
        <ListItemAvatar>
          <Avatar src='/images/avatars/8.png' alt='Celia Schneider' />
        </ListItemAvatar>
        <ListItemText primary='Celia Schneider' secondary='Muffin pie chupa chups.' />
        <ListItemSecondaryAction>
          <IconButton edge='end'>
            <Plus />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    </List>
  )
}

export default ListSecondary
