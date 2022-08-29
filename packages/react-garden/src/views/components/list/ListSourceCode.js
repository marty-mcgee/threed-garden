export const ListDenseJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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

const ListDense = () => {
  return (
    <Fragment>
      <List dense>
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
      <List dense>
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

export default ListDense
`}</code>
  </pre>
)

export const ListNestedJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
`}</code>
  </pre>
)

export const ListItemSelectedJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
`}</code>
  </pre>
)

export const ListSimpleJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
`}</code>
  </pre>
)

export const ListSecondaryJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)

export const ListStickySubheaderJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListSubheader from '@mui/material/ListSubheader'

const ListWithSwitch = () => {
  return (
    <List subheader={<li />} sx={{ maxHeight: 300, overflow: 'auto', position: 'relative' }}>
      {[0, 1, 2, 3, 4].map(sectionId => (
        <Box component='li' key={section-{sectionId}} sx={{ backgroundColor: 'background.paper' }}>
          <Box component='ul' sx={{ p: 0, backgroundColor: 'inherit' }}>
            <ListSubheader>{I'm sticky {sectionId}}</ListSubheader>
            {[0, 1, 2].map(item => (
              <ListItem key={item-{sectionId}-{item}}>
                <ListItemText primary={Item {item}} />
              </ListItem>
            ))}
          </Box>
        </Box>
      ))}
    </List>
  )
}

export default ListWithSwitch
`}</code>
  </pre>
)

export const ListWithCheckboxJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
`}</code>
  </pre>
)

export const ListWithSwitchJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import List from '@mui/material/List'
import Switch from '@mui/material/Switch'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListSubheader from '@mui/material/ListSubheader'
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction'

// ** Icons Imports
import Wifi from 'mdi-material-ui/Wifi'
import Airplane from 'mdi-material-ui/Airplane'
import Broadcast from 'mdi-material-ui/Broadcast'
import Bluetooth from 'mdi-material-ui/Bluetooth'
import MapMarkerOutline from 'mdi-material-ui/MapMarkerOutline'
import MinusCircleOutline from 'mdi-material-ui/MinusCircleOutline'

const ListWithSwitch = () => {
  // ** State
  const [checked, setChecked] = useState(['wifi', 'location'])

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
    <List subheader={<ListSubheader>Settings</ListSubheader>}>
      <ListItem>
        <ListItemIcon>
          <Wifi fontSize='small' />
        </ListItemIcon>
        <ListItemText primary='Wi-Fi' />
        <ListItemSecondaryAction>
          <Switch edge='end' checked={checked.indexOf('wifi') !== -1} onChange={handleToggle('wifi')} />
        </ListItemSecondaryAction>
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <Bluetooth fontSize='small' />
        </ListItemIcon>
        <ListItemText primary='Bluetooth' />
        <ListItemSecondaryAction>
          <Switch edge='end' checked={checked.indexOf('bluetooth') !== -1} onChange={handleToggle('bluetooth')} />
        </ListItemSecondaryAction>
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <MapMarkerOutline fontSize='small' />
        </ListItemIcon>
        <ListItemText primary='Location' />
        <ListItemSecondaryAction>
          <Switch edge='end' checked={checked.indexOf('location') !== -1} onChange={handleToggle('location')} />
        </ListItemSecondaryAction>
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <Airplane fontSize='small' />
        </ListItemIcon>
        <ListItemText primary='Airplane Mode' />
        <ListItemSecondaryAction>
          <Switch edge='end' checked={checked.indexOf('airplane') !== -1} onChange={handleToggle('airplane')} />
        </ListItemSecondaryAction>
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <Broadcast fontSize='small' />
        </ListItemIcon>
        <ListItemText primary='Hotspot' />
        <ListItemSecondaryAction>
          <Switch edge='end' checked={checked.indexOf('hotspot') !== -1} onChange={handleToggle('hotspot')} />
        </ListItemSecondaryAction>
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <MinusCircleOutline fontSize='small' />
        </ListItemIcon>
        <ListItemText primary='Do not disturb' />
        <ListItemSecondaryAction>
          <Switch
            edge='end'
            checked={checked.indexOf('do-not-disturb') !== -1}
            onChange={handleToggle('do-not-disturb')}
          />
        </ListItemSecondaryAction>
      </ListItem>
    </List>
  )
}

export default ListWithSwitch
`}</code>
  </pre>
)
