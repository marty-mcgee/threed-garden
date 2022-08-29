// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import List from '@mui/material/List'
import Menu from '@mui/material/Menu'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import ListItem from '@mui/material/ListItem'
import { styled } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ListItemIcon from '@mui/material/ListItemIcon'

// ** Icons Import
import Circle from 'mdi-material-ui/Circle'
import Attachment from 'mdi-material-ui/Attachment'
import StarOutline from 'mdi-material-ui/StarOutline'
import ChevronLeft from 'mdi-material-ui/ChevronLeft'
import ChevronRight from 'mdi-material-ui/ChevronRight'
import ShareOutline from 'mdi-material-ui/ShareOutline'
import LabelOutline from 'mdi-material-ui/LabelOutline'
import DotsVertical from 'mdi-material-ui/DotsVertical'
import ReplyOutline from 'mdi-material-ui/ReplyOutline'
import EmailOutline from 'mdi-material-ui/EmailOutline'
import DeleteOutline from 'mdi-material-ui/DeleteOutline'
import FolderOutline from 'mdi-material-ui/FolderOutline'
import ArrowExpandVertical from 'mdi-material-ui/ArrowExpandVertical'
import ArrowCollapseVertical from 'mdi-material-ui/ArrowCollapseVertical'

// ** Third Party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// ** Hooks
import { useSettings } from 'src/@core/hooks/useSettings'

// ** Custom Components Imports
import Sidebar from 'src/@core/components/sidebar'
import CustomChip from 'src/@core/components/mui/chip'

const HiddenReplyBack = styled(Box)(({ theme }) => ({
  height: 11,
  width: '90%',
  opacity: 0.5,
  borderWidth: 1,
  borderBottom: 0,
  display: 'block',
  marginLeft: 'auto',
  marginRight: 'auto',
  borderStyle: 'solid',
  borderTopLeftRadius: theme.shape.borderRadius,
  borderTopRightRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  borderColor: `rgba(${theme.palette.customColors.main}, 0.12)`
}))

const HiddenReplyFront = styled(Box)(({ theme }) => ({
  height: 12,
  width: '95%',
  opacity: 0.75,
  borderWidth: 1,
  borderBottom: 0,
  display: 'block',
  marginLeft: 'auto',
  marginRight: 'auto',
  borderStyle: 'solid',
  borderTopLeftRadius: theme.shape.borderRadius,
  borderTopRightRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  borderColor: `rgba(${theme.palette.customColors.main}, 0.12)`
}))

const MailCardMenu = () => {
  const [mailMenuAnchorEl, setMailMenuAnchorEl] = useState(null)
  const openMailMenu = Boolean(mailMenuAnchorEl)

  const handleMailMenuClick = event => {
    setMailMenuAnchorEl(event.currentTarget)
  }

  const handleMailMenuClose = () => {
    setMailMenuAnchorEl(null)
  }

  return (
    <>
      <IconButton size='small' onClick={handleMailMenuClick}>
        <DotsVertical sx={{ fontSize: '1.375rem' }} />
      </IconButton>
      <Menu
        anchorEl={mailMenuAnchorEl}
        open={openMailMenu}
        onClose={handleMailMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
      >
        <MenuItem>
          <ShareOutline fontSize='small' sx={{ mr: 2 }} />
          Reply
        </MenuItem>
        <MenuItem>
          <ReplyOutline fontSize='small' sx={{ mr: 2 }} />
          Forward
        </MenuItem>
      </Menu>
    </>
  )
}

const MailDetails = props => {
  // ** Props
  const {
    mail,
    hidden,
    folders,
    dispatch,
    direction,
    updateMail,
    foldersObj,
    labelColors,
    routeParams,
    paginateMail,
    handleStarMail,
    mailDetailsOpen,
    handleLabelUpdate,
    handleFolderUpdate,
    setMailDetailsOpen
  } = props

  // ** State
  const [showReplies, setShowReplies] = useState(false)
  const [labelAnchorEl, setLabelAnchorEl] = useState(null)
  const [folderAnchorEl, setFolderAnchorEl] = useState(null)

  // ** Hook
  const { settings } = useSettings()

  // ** Vars
  const openLabelMenu = Boolean(labelAnchorEl)
  const openFolderMenu = Boolean(folderAnchorEl)

  const handleMoveToTrash = () => {
    dispatch(updateMail({ emailIds: [mail.id], dataToUpdate: { folder: 'trash' } }))
    setMailDetailsOpen(false)
  }

  const handleLabelMenuClick = event => {
    setLabelAnchorEl(event.currentTarget)
  }

  const handleLabelMenuClose = () => {
    setLabelAnchorEl(null)
  }

  const handleFolderMenuClick = event => {
    setFolderAnchorEl(event.currentTarget)
  }

  const handleFolderMenuClose = () => {
    setFolderAnchorEl(null)
    setMailDetailsOpen(false)
  }

  const handleReadMail = () => {
    dispatch(updateMail({ emailIds: [mail.id], dataToUpdate: { isRead: false } }))
    setMailDetailsOpen(false)
  }

  const renderLabelsMenu = () => {
    return Object.entries(labelColors).map(([key, value]) => {
      return (
        <MenuItem
          key={key}
          sx={{ display: 'flex', alignItems: 'center' }}
          onClick={() => {
            handleLabelUpdate([mail.id], key)
            handleLabelMenuClose()
          }}
        >
          <Circle sx={{ mr: 2, fontSize: '0.75rem', color: `${value}.main` }} />
          <Typography sx={{ textTransform: 'capitalize' }}>{key}</Typography>
        </MenuItem>
      )
    })
  }

  const renderFoldersMenu = () => {
    if (routeParams && routeParams.folder && !routeParams.label && foldersObj[routeParams.folder]) {
      return foldersObj[routeParams.folder].map(folder => {
        return (
          <MenuItem
            key={folder.name}
            sx={{ display: 'flex', alignItems: 'center' }}
            onClick={() => {
              handleFolderUpdate(mail.id, folder.name)
              handleFolderMenuClose()
            }}
          >
            {folder.icon}
            <Typography sx={{ textTransform: 'capitalize' }}>{folder.name}</Typography>
          </MenuItem>
        )
      })
    } else if (routeParams && routeParams.label) {
      return folders.map(folder => {
        return (
          <MenuItem
            key={folder.name}
            sx={{ display: 'flex', alignItems: 'center' }}
            onClick={() => {
              handleFolderUpdate(mail.id, folder.name)
              handleFolderMenuClose()
            }}
          >
            {folder.icon}
            <Typography sx={{ textTransform: 'capitalize' }}>{folder.name}</Typography>
          </MenuItem>
        )
      })
    } else {
      return foldersObj['inbox'].map(folder => {
        return (
          <MenuItem
            key={folder.name}
            sx={{ display: 'flex', alignItems: 'center' }}
            onClick={() => {
              handleFolderUpdate(mail.id, folder.name)
              handleFolderMenuClose()
            }}
          >
            {folder.icon}
            <Typography sx={{ textTransform: 'capitalize' }}>{folder.name}</Typography>
          </MenuItem>
        )
      })
    }
  }
  const PrevMailIcon = direction === 'rtl' ? ChevronRight : ChevronLeft
  const NextMailIcon = direction === 'rtl' ? ChevronLeft : ChevronRight
  const GoBackIcon = PrevMailIcon

  const ScrollWrapper = ({ children }) => {
    if (hidden) {
      return <Box sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>{children}</Box>
    } else {
      return <PerfectScrollbar options={{ wheelPropagation: false }}>{children}</PerfectScrollbar>
    }
  }

  return (
    <Sidebar
      hideBackdrop
      direction='right'
      show={mailDetailsOpen}
      sx={{ zIndex: 1, width: '100%', overflow: 'hidden' }}
      onClose={() => {
        setMailDetailsOpen(false)
        setShowReplies(false)
      }}
    >
      {mail ? (
        <Fragment>
          <Box
            sx={{
              px: 2.6,
              py: [2.25, 3],
              backgroundColor: 'background.paper',
              borderBottom: theme => `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ display: 'flex', alignItems: ['flex-start', 'center'], justifyContent: 'space-between' }}>
              <Box
                sx={{
                  display: 'flex',
                  overflow: 'hidden',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis'
                }}
              >
                <IconButton
                  size='small'
                  sx={{ mr: 3.5 }}
                  onClick={() => {
                    setMailDetailsOpen(false)
                    setShowReplies(false)
                  }}
                >
                  <GoBackIcon sx={{ fontSize: '2rem' }} />
                </IconButton>
                <Box
                  sx={{
                    display: 'flex',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    flexDirection: ['column', 'row']
                  }}
                >
                  <Typography noWrap sx={{ mr: 2, fontWeight: 500 }}>
                    {mail.subject}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {mail.labels && mail.labels.length
                      ? mail.labels.map(label => {
                          return (
                            <CustomChip
                              key={label}
                              size='small'
                              skin='light'
                              label={label}
                              color={labelColors[label]}
                              sx={{ textTransform: 'capitalize', '&:not(:last-of-type)': { mr: 2 } }}
                            />
                          )
                        })
                      : null}
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex' }}>
                <IconButton
                  size='small'
                  disabled={!mail.hasPreviousMail}
                  sx={{ color: mail.hasPreviousMail ? 'text.primary' : 'text.secondary' }}
                  onClick={() => dispatch(paginateMail({ dir: 'previous', emailId: mail.id }))}
                >
                  <PrevMailIcon />
                </IconButton>
                <IconButton
                  size='small'
                  disabled={!mail.hasNextMail}
                  sx={{ color: mail.hasNextMail ? 'text.primary' : 'text.secondary' }}
                  onClick={() => dispatch(paginateMail({ dir: 'next', emailId: mail.id }))}
                >
                  <NextMailIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
          <Box
            sx={{
              backgroundColor: 'background.paper',
              p: theme => theme.spacing(3, 2, 3, 3),
              borderBottom: theme => `1px solid ${theme.palette.divider}`
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {routeParams && routeParams.folder !== 'trash' ? (
                  <IconButton size='small' onClick={handleMoveToTrash}>
                    <DeleteOutline sx={{ fontSize: '1.375rem' }} />
                  </IconButton>
                ) : null}

                <IconButton size='small' onClick={handleReadMail}>
                  <EmailOutline sx={{ fontSize: '1.375rem' }} />
                </IconButton>
                <IconButton size='small' onClick={handleFolderMenuClick}>
                  <FolderOutline sx={{ fontSize: '1.375rem' }} />
                </IconButton>
                <Menu
                  open={openLabelMenu}
                  anchorEl={labelAnchorEl}
                  onClose={handleLabelMenuClose}
                  PaperProps={{ style: { minWidth: '9rem' } }}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left'
                  }}
                >
                  {renderLabelsMenu()}
                </Menu>
                <IconButton size='small' onClick={handleLabelMenuClick}>
                  <LabelOutline sx={{ fontSize: '1.375rem' }} />
                </IconButton>
                <Menu
                  open={openFolderMenu}
                  anchorEl={folderAnchorEl}
                  onClose={() => setFolderAnchorEl(null)}
                  PaperProps={{ style: { minWidth: '9rem' } }}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left'
                  }}
                >
                  {renderFoldersMenu()}
                </Menu>
              </Box>
              <Box>
                <IconButton
                  size='small'
                  onClick={e => handleStarMail(e, mail.id, !mail.isStarred)}
                  sx={{ ...(mail.isStarred ? { color: 'warning.main' } : {}) }}
                >
                  <StarOutline sx={{ fontSize: '1.375rem' }} />
                </IconButton>
                {mail.replies.length ? (
                  <IconButton size='small' onClick={() => (showReplies ? setShowReplies(false) : setShowReplies(true))}>
                    {showReplies ? (
                      <ArrowCollapseVertical sx={{ fontSize: '1.375rem' }} />
                    ) : (
                      <ArrowExpandVertical sx={{ fontSize: '1.375rem' }} />
                    )}
                  </IconButton>
                ) : null}
                <IconButton size='small'>
                  <DotsVertical sx={{ fontSize: '1.375rem' }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
          <Box sx={{ height: 'calc(100% - 7.75rem)', backgroundColor: theme => theme.palette.action.hover }}>
            <ScrollWrapper>
              <Box
                sx={{
                  py: 4,
                  px: 5,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                {mail.replies.length && !showReplies ? (
                  <Typography onClick={() => setShowReplies(true)} sx={{ mt: 1.5, mb: 5, cursor: 'pointer' }}>
                    {mail.replies.length} Earlier Messages
                  </Typography>
                ) : null}

                {showReplies
                  ? mail.replies.map((reply, index) => {
                      return (
                        <Box
                          key={index}
                          sx={{
                            mb: 4,
                            boxShadow: 6,
                            width: '100%',
                            borderRadius: 1,
                            backgroundColor: 'background.paper',
                            border: theme => `1px solid ${theme.palette.divider}`
                          }}
                        >
                          <Box sx={{ p: 5 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar
                                  alt={reply.from.name}
                                  src={reply.from.avatar}
                                  sx={{ width: '2.375rem', height: '2.375rem', mr: 3 }}
                                />
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  <Typography sx={{ fontWeight: 500 }}>{reply.from.name}</Typography>
                                  <Typography variant='body2'>{reply.from.email}</Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant='caption' sx={{ mr: 3 }}>
                                  {new Date(reply.time).toDateString()}{' '}
                                  {new Date(reply.time).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </Typography>
                                {mail.attachments.length ? (
                                  <IconButton size='small'>
                                    <Attachment sx={{ fontSize: '1.375rem' }} />
                                  </IconButton>
                                ) : null}
                                <IconButton size='small'>
                                  <DotsVertical sx={{ fontSize: '1.375rem' }} />
                                </IconButton>
                              </Box>
                            </Box>
                          </Box>
                          <Divider sx={{ m: 0 }} />
                          <Box sx={{ p: 5, pt: 0 }}>
                            <Box dangerouslySetInnerHTML={{ __html: reply.message }} />
                          </Box>
                          {reply.attachments.length ? (
                            <Fragment>
                              <Divider sx={{ m: 0 }} />
                              <Box sx={{ p: 5 }}>
                                <Typography variant='body2'>Attachments</Typography>
                                <List>
                                  {reply.attachments.map(item => {
                                    return (
                                      <ListItem disableGutters key={item.fileName}>
                                        <ListItemIcon>
                                          <img src={item.thumbnail} alt={item.fileName} width='24' height='24' />
                                        </ListItemIcon>
                                        <Typography variant='caption'>{item.fileName}</Typography>
                                      </ListItem>
                                    )
                                  })}
                                </List>
                              </Box>
                            </Fragment>
                          ) : null}
                        </Box>
                      )
                    })
                  : null}

                {mail.replies.length && !showReplies ? (
                  <Fragment>
                    <HiddenReplyBack sx={{ cursor: 'pointer' }} onClick={() => setShowReplies(true)} />
                    <HiddenReplyFront sx={{ cursor: 'pointer' }} onClick={() => setShowReplies(true)} />
                  </Fragment>
                ) : null}

                <Box
                  sx={{
                    mb: 4,
                    width: '100%',
                    borderRadius: 1,
                    overflow: 'visible',
                    position: 'relative',
                    backgroundColor: 'background.paper',
                    boxShadow: settings.skin === 'bordered' ? 0 : 6,
                    border: theme => `1px solid ${theme.palette.divider}`
                  }}
                >
                  <Box sx={{ p: 5 }}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          alt={mail.from.name}
                          src={mail.from.avatar}
                          sx={{ width: '2.375rem', height: '2.375rem', mr: 3 }}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography sx={{ fontWeight: 500 }}>{mail.from.name}</Typography>
                          <Typography variant='body2'>{mail.from.email}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant='caption' sx={{ mr: 3 }}>
                          {new Date(mail.time).toDateString()}{' '}
                          {new Date(mail.time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </Typography>
                        {mail.attachments.length ? (
                          <IconButton size='small'>
                            <Attachment sx={{ fontSize: '1.375rem' }} />
                          </IconButton>
                        ) : null}
                        <MailCardMenu />
                      </Box>
                    </Box>
                  </Box>
                  <Divider sx={{ m: 0 }} />
                  <Box sx={{ p: 5, pt: 0 }}>
                    <Box dangerouslySetInnerHTML={{ __html: mail.message }} />
                  </Box>
                  {mail.attachments.length ? (
                    <Fragment>
                      <Divider sx={{ m: 0 }} />
                      <Box sx={{ p: 5 }}>
                        <Typography variant='body2'>Attachments</Typography>
                        <List>
                          {mail.attachments.map(item => {
                            return (
                              <ListItem disableGutters key={item.fileName}>
                                <ListItemIcon>
                                  <img src={item.thumbnail} alt={item.fileName} width='24' height='24' />
                                </ListItemIcon>
                                <Typography variant='caption'>{item.fileName}</Typography>
                              </ListItem>
                            )
                          })}
                        </List>
                      </Box>
                    </Fragment>
                  ) : null}
                </Box>

                <Box
                  sx={{
                    p: 5,
                    width: '100%',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                    boxShadow: settings.skin === 'bordered' ? 0 : 6
                  }}
                >
                  <Typography sx={{ fontWeight: 500 }}>
                    Click here to{' '}
                    <Typography
                      component='span'
                      sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 'inherit' }}
                    >
                      Reply
                    </Typography>{' '}
                    or{' '}
                    <Typography
                      component='span'
                      sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 'inherit' }}
                    >
                      Forward
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            </ScrollWrapper>
          </Box>
        </Fragment>
      ) : null}
    </Sidebar>
  )
}

export default MailDetails
