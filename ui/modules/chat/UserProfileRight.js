// ** React Imports

// ** MUI Imports
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Badge from '@mui/material/Badge'
import MuiAvatar from '@mui/material/Avatar'
import ListItem from '@mui/material/ListItem'
import FormGroup from '@mui/material/FormGroup'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'

// ** Icons Imports
import Close from 'mdi-material-ui/Close'
import BlockHelper from 'mdi-material-ui/BlockHelper'
import StarOutline from 'mdi-material-ui/StarOutline'
import EmailOutline from 'mdi-material-ui/EmailOutline'
import PhoneOutline from 'mdi-material-ui/PhoneOutline'
import ImageOutline from 'mdi-material-ui/ImageOutline'
import DeleteOutline from 'mdi-material-ui/DeleteOutline'
import BookmarkOutline from 'mdi-material-ui/BookmarkOutline'
import ClockTimeFiveOutline from 'mdi-material-ui/ClockTimeFiveOutline'

// ** Third Party Components
import PerfectScrollbar from 'react-perfect-scrollbar'

// ** Custom Component Imports
import Sidebar from '#/ui/components/sidebar'
import CustomAvatar from '#/ui/components/mui/avatar'

const UserProfileRight = (props) => {
  const {
    store,
    hidden,
    statusObj,
    getInitials,
    sidebarWidth,
    userProfileRightOpen,
    handleUserProfileRightSidebarToggle,
  } = props

  const ScrollWrapper = ({ children }) => {
    if (hidden) {
      return <Box sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>{children}</Box>
    } else {
      return <PerfectScrollbar options={{ wheelPropagation: false }}>{children}</PerfectScrollbar>
    }
  }

  return (
    <Sidebar
      direction='right'
      show={userProfileRightOpen}
      backDropClick={handleUserProfileRightSidebarToggle}
      sx={{
        zIndex: 9,
        height: '100%',
        width: sidebarWidth,
        borderTopRightRadius: (theme) => theme.shape.borderRadius,
        borderBottomRightRadius: (theme) => theme.shape.borderRadius,
        '& + .MuiBackdrop-root': {
          zIndex: 8,
          borderRadius: 1,
        },
      }}>
      {store && store.selectedChat ? (
        <>
          <Box sx={{ position: 'relative' }}>
            <IconButton
              size='small'
              onClick={handleUserProfileRightSidebarToggle}
              sx={{ top: '0.5rem', right: '0.5rem', position: 'absolute', color: 'text.secondary' }}>
              <Close sx={{ fontSize: '1.375rem' }} />
            </IconButton>
            <Box sx={{ p: 5, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 5.5, display: 'flex', justifyContent: 'center' }}>
                <Badge
                  overlap='circular'
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  badgeContent={
                    <Box
                      component='span'
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        color: `${statusObj[store.selectedChat.contact.status]}.main`,
                        boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}`,
                        backgroundColor: `${statusObj[store.selectedChat.contact.status]}.main`,
                      }}
                    />
                  }>
                  {store.selectedChat.contact.avatar ? (
                    <MuiAvatar
                      sx={{ width: '5rem', height: '5rem' }}
                      src={store.selectedChat.contact.avatar}
                      alt={store.selectedChat.contact.fullName}
                    />
                  ) : (
                    <CustomAvatar
                      skin='light'
                      color={store.selectedChat.contact.avatarColor}
                      sx={{ width: '5rem', height: '5rem', fontWeight: 500, fontSize: '2rem' }}>
                      {getInitials(store.selectedChat.contact.fullName)}
                    </CustomAvatar>
                  )}
                </Badge>
              </Box>
              <Typography sx={{ mb: 0.5, fontWeight: 500, textAlign: 'center' }}>
                {store.selectedChat.contact.fullName}
              </Typography>
              <Typography variant='body2' sx={{ textAlign: 'center' }}>
                {store.selectedChat.contact.role}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ height: 'calc(100% - 11.8125rem)' }}>
            <ScrollWrapper>
              <Box sx={{ p: 5 }}>
                <FormGroup sx={{ mb: 10.5 }}>
                  <Typography variant='body2' sx={{ mb: 3.5, textTransform: 'uppercase' }}>
                    About
                  </Typography>
                  <Typography sx={{ fontSize: '0.875rem' }}>{store.selectedChat.contact.about}</Typography>
                </FormGroup>

                <Box sx={{ mb: 8.5 }}>
                  <Typography variant='body2' sx={{ mb: 3.5, textTransform: 'uppercase' }}>
                    Personal Information
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    <ListItem sx={{ px: 2 }}>
                      <ListItemIcon sx={{ mr: 2, color: 'text.primary' }}>
                        <EmailOutline sx={{ fontSize: '1.375rem' }} />
                      </ListItemIcon>
                      <ListItemText
                        sx={{ textTransform: 'lowercase' }}
                        primary={`${store.selectedChat.contact.fullName.replace(/\s/g, '_')}@email.com`}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 2 }}>
                      <ListItemIcon sx={{ mr: 2, color: 'text.primary' }}>
                        <PhoneOutline sx={{ fontSize: '1.375rem' }} />
                      </ListItemIcon>
                      <ListItemText primary='+1(123) 456 - 7890' />
                    </ListItem>
                    <ListItem sx={{ px: 2 }}>
                      <ListItemIcon sx={{ mr: 2, color: 'text.primary' }}>
                        <ClockTimeFiveOutline sx={{ fontSize: '1.375rem' }} />
                      </ListItemIcon>
                      <ListItemText primary='Mon - Fri 10AM - 8PM' />
                    </ListItem>
                  </List>
                </Box>

                <Box>
                  <Typography variant='body2' sx={{ mb: 3.5, textTransform: 'uppercase' }}>
                    Options
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    <ListItem disablePadding>
                      <ListItemButton sx={{ px: 2 }}>
                        <ListItemIcon sx={{ mr: 2, color: 'text.primary' }}>
                          <BookmarkOutline sx={{ fontSize: '1.375rem' }} />
                        </ListItemIcon>
                        <ListItemText primary='Add Tag' />
                      </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemButton sx={{ px: 2 }}>
                        <ListItemIcon sx={{ mr: 2, color: 'text.primary' }}>
                          <StarOutline sx={{ fontSize: '1.375rem' }} />
                        </ListItemIcon>
                        <ListItemText primary='Important Contact' />
                      </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemButton sx={{ px: 2 }}>
                        <ListItemIcon sx={{ mr: 2, color: 'text.primary' }}>
                          <ImageOutline sx={{ fontSize: '1.375rem' }} />
                        </ListItemIcon>
                        <ListItemText primary='Shared Media' />
                      </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemButton sx={{ px: 2 }}>
                        <ListItemIcon sx={{ mr: 2, color: 'text.primary' }}>
                          <DeleteOutline sx={{ fontSize: '1.375rem' }} />
                        </ListItemIcon>
                        <ListItemText primary='Delete Contact' />
                      </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemButton sx={{ px: 2 }}>
                        <ListItemIcon sx={{ mr: 2.5, ml: 0.5, color: 'text.primary' }}>
                          <BlockHelper sx={{ fontSize: '1.125rem' }} />
                        </ListItemIcon>
                        <ListItemText primary='Block Contact' />
                      </ListItemButton>
                    </ListItem>
                  </List>
                </Box>
              </Box>
            </ScrollWrapper>
          </Box>
        </>
      ) : null}
    </Sidebar>
  )
}

export default UserProfileRight
