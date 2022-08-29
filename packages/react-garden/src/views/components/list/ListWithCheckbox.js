// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import List from '@mui/material/List'
import Avatar from '@mui/material/Avatar'
import ListItem from '@mui/material/ListItem'
import Checkbox from '@mui/material/Checkbox'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'

const ListWithCheckbox = () => {
  // ** State
  const [checked, setChecked] = useState([0])

  const handleToggle = value => () => {
    const currentIndex = checked.indexOf(value)
    const newChecked = [...checked]
    if (currentIndex === -1) {
      newChecked.push(value)
    } else {
      newChecked.splice(currentIndex, 1)
    }
    setChecked(newChecked)
  }

  return (
    <List>
      <ListItem disablePadding>
        <ListItemButton onClick={handleToggle(0)}>
          <ListItemAvatar>
            <Avatar src='/images/avatars/2.png' alt='Caroline Black' />
          </ListItemAvatar>
          <ListItemText id='checkbox-list-label-0' primary='Caroline Black' />
          <ListItemSecondaryAction>
            <Checkbox
              edge='end'
              tabIndex={-1}
              disableRipple
              onChange={handleToggle(0)}
              checked={checked.indexOf(0) !== -1}
              inputProps={{ 'aria-labelledby': 'checkbox-list-label-0' }}
            />
          </ListItemSecondaryAction>
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton onClick={handleToggle(1)}>
          <ListItemAvatar>
            <Avatar src='/images/avatars/1.png' alt='Alfred Copeland' />
          </ListItemAvatar>
          <ListItemText id='checkbox-list-label-1' primary='Alfred Copeland' />
          <ListItemSecondaryAction>
            <Checkbox
              edge='end'
              tabIndex={-1}
              disableRipple
              onChange={handleToggle(1)}
              checked={checked.indexOf(1) !== -1}
              inputProps={{ 'aria-labelledby': 'checkbox-list-label-1' }}
            />
          </ListItemSecondaryAction>
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton onClick={handleToggle(2)}>
          <ListItemAvatar>
            <Avatar src='/images/avatars/8.png' alt='Celia Schneider' />
          </ListItemAvatar>
          <ListItemText id='checkbox-list-label-2' primary='Celia Schneider' />
          <ListItemSecondaryAction>
            <Checkbox
              edge='end'
              tabIndex={-1}
              disableRipple
              onChange={handleToggle(2)}
              checked={checked.indexOf(2) !== -1}
              inputProps={{ 'aria-labelledby': 'checkbox-list-label-2' }}
            />
          </ListItemSecondaryAction>
        </ListItemButton>
      </ListItem>
    </List>
  )
}

export default ListWithCheckbox
