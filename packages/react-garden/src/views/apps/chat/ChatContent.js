// ** React Imports
import { useState, Fragment } from 'react'

// ** MUI Imports
import Menu from '@mui/material/Menu'
import Badge from '@mui/material/Badge'
import MuiAvatar from '@mui/material/Avatar'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'

// ** Icons Imports
import MenuIcon from 'mdi-material-ui/Menu'
import Magnify from 'mdi-material-ui/Magnify'
import PhoneOutline from 'mdi-material-ui/PhoneOutline'
import VideoOutline from 'mdi-material-ui/VideoOutline'
import DotsVertical from 'mdi-material-ui/DotsVertical'
import MessageOutline from 'mdi-material-ui/MessageOutline'

// ** Custom Components Import
import ChatLog from './ChatLog'
import SendMsgForm from 'src/views/apps/chat/SendMsgForm'
import CustomAvatar from 'src/@core/components/mui/avatar'
import UserProfileRight from 'src/views/apps/chat/UserProfileRight'

// ** Styled Components
const ChatWrapperStartChat = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  height: '100%',
  display: 'flex',
  borderRadius: 1,
  alignItems: 'center',
  flexDirection: 'column',
  justifyContent: 'center',
  backgroundColor: theme.palette.action.hover
}))

const ChatContent = props => {
  // ** Props
  const {
    store,
    hidden,
    sendMsg,
    mdAbove,
    dispatch,
    statusObj,
    getInitials,
    sidebarWidth,
    userProfileRightOpen,
    handleLeftSidebarToggle,
    handleUserProfileRightSidebarToggle
  } = props

  // ** State
  const [anchorEl, setAnchorEl] = useState(null)
  const open = Boolean(anchorEl)

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleStartConversation = () => {
    if (!mdAbove) {
      handleLeftSidebarToggle()
    }
  }

  const renderContent = () => {
    if (store) {
      const selectedChat = store.selectedChat
      if (!selectedChat) {
        return (
          <ChatWrapperStartChat
            sx={{
              ...(mdAbove ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 } : {})
            }}
          >
            <MuiAvatar
              sx={{
                mb: 6,
                pt: 8,
                pb: 7,
                px: 7.5,
                width: 110,
                height: 110,
                backgroundColor: 'background.paper',
                boxShadow: theme => theme.shadows[3]
              }}
            >
              <MessageOutline sx={{ fontSize: '3.125rem' }} />
            </MuiAvatar>
            <Box
              onClick={handleStartConversation}
              sx={{
                py: 2,
                px: 6,
                borderRadius: 5,
                backgroundColor: 'background.paper',
                boxShadow: theme => theme.shadows[3],
                cursor: mdAbove ? 'default' : 'pointer'
              }}
            >
              <Typography sx={{ fontWeight: 500, fontSize: '1.125rem', lineHeight: 'normal' }}>
                Start Conversation
              </Typography>
            </Box>
          </ChatWrapperStartChat>
        )
      } else {
        return (
          <Box
            sx={{
              flexGrow: 1,
              width: '100%',
              height: '100%',
              backgroundColor: theme => theme.palette.action.hover
            }}
          >
            <Box
              sx={{
                py: 3,
                px: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: theme => `1px solid ${theme.palette.divider}`
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {mdAbove ? null : (
                  <IconButton onClick={handleLeftSidebarToggle} sx={{ mr: 2 }}>
                    <MenuIcon />
                  </IconButton>
                )}
                <Box
                  onClick={handleUserProfileRightSidebarToggle}
                  sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <Badge
                    overlap='circular'
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right'
                    }}
                    sx={{ mr: 3 }}
                    badgeContent={
                      <Box
                        component='span'
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          color: `${statusObj[selectedChat.contact.status]}.main`,
                          boxShadow: theme => `0 0 0 2px ${theme.palette.background.paper}`,
                          backgroundColor: `${statusObj[selectedChat.contact.status]}.main`
                        }}
                      />
                    }
                  >
                    {selectedChat.contact.avatar ? (
                      <MuiAvatar
                        src={selectedChat.contact.avatar}
                        alt={selectedChat.contact.fullName}
                        sx={{ width: '2.375rem', height: '2.375rem' }}
                      />
                    ) : (
                      <CustomAvatar
                        skin='light'
                        color={selectedChat.contact.avatarColor}
                        sx={{ width: '2.375rem', height: '2.375rem', fontSize: '1rem' }}
                      >
                        {getInitials(selectedChat.contact.fullName)}
                      </CustomAvatar>
                    )}
                  </Badge>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                      {selectedChat.contact.fullName}
                    </Typography>
                    <Typography variant='caption' sx={{ color: 'text.disabled' }}>
                      {selectedChat.contact.role}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {mdAbove ? (
                  <Fragment>
                    <IconButton size='small' sx={{ color: 'text.secondary' }}>
                      <PhoneOutline sx={{ fontSize: '1.25rem' }} />
                    </IconButton>
                    <IconButton size='small' sx={{ color: 'text.secondary' }}>
                      <VideoOutline sx={{ fontSize: '1.5rem' }} />
                    </IconButton>
                    <IconButton size='small' sx={{ color: 'text.secondary' }}>
                      <Magnify sx={{ fontSize: '1.25rem' }} />
                    </IconButton>
                  </Fragment>
                ) : null}
                <IconButton size='small' onClick={handleClick} sx={{ color: 'text.secondary' }}>
                  <DotsVertical sx={{ fontSize: '1.25rem' }} />
                </IconButton>
                <Menu
                  open={open}
                  sx={{ mt: 2 }}
                  anchorEl={anchorEl}
                  onClose={handleClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right'
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right'
                  }}
                >
                  <MenuItem onClick={handleClose}>View Contact</MenuItem>
                  <MenuItem onClick={handleClose}>Mute Notifications</MenuItem>
                  <MenuItem onClick={handleClose}>Block Contact</MenuItem>
                  <MenuItem onClick={handleClose}>Clear Chat</MenuItem>
                  <MenuItem onClick={handleClose}>Report</MenuItem>
                </Menu>
              </Box>
            </Box>

            {selectedChat && store.userProfile ? (
              <ChatLog hidden={hidden} data={{ ...selectedChat, userContact: store.userProfile }} />
            ) : null}

            <SendMsgForm store={store} dispatch={dispatch} sendMsg={sendMsg} />

            <UserProfileRight
              store={store}
              hidden={hidden}
              statusObj={statusObj}
              getInitials={getInitials}
              sidebarWidth={sidebarWidth}
              userProfileRightOpen={userProfileRightOpen}
              handleUserProfileRightSidebarToggle={handleUserProfileRightSidebarToggle}
            />
          </Box>
        )
      }
    } else {
      return null
    }
  }

  return renderContent()
}

export default ChatContent
