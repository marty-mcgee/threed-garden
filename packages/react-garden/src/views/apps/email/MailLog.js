// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Menu from '@mui/material/Menu'
import Input from '@mui/material/Input'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import Backdrop from '@mui/material/Backdrop'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import { styled } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'
import ListItem from '@mui/material/ListItem'

// ** Icons Import
import MenuIcon from 'mdi-material-ui/Menu'
import Circle from 'mdi-material-ui/Circle'
import Reload from 'mdi-material-ui/Reload'
import Magnify from 'mdi-material-ui/Magnify'
import StarOutline from 'mdi-material-ui/StarOutline'
import EmailOutline from 'mdi-material-ui/EmailOutline'
import DotsVertical from 'mdi-material-ui/DotsVertical'
import LabelOutline from 'mdi-material-ui/LabelOutline'
import FolderOutline from 'mdi-material-ui/FolderOutline'
import PencilOutline from 'mdi-material-ui/PencilOutline'
import DeleteOutline from 'mdi-material-ui/DeleteOutline'
import EmailOpenOutline from 'mdi-material-ui/EmailOpenOutline'
import AlertCircleOutline from 'mdi-material-ui/AlertCircleOutline'
import AlertOctagonOutline from 'mdi-material-ui/AlertOctagonOutline'

// ** Third Party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// ** Email App Component Imports
import { setTimeout } from 'timers'
import MailDetails from './MailDetails'

const MailItem = styled(ListItem)(({ theme }) => ({
  zIndex: 1,
  cursor: 'pointer',
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(3),
  justifyContent: 'space-between',
  [theme.breakpoints.up('xs')]: {
    paddingLeft: theme.spacing(2.5),
    paddingRight: theme.spacing(2.5)
  },
  [theme.breakpoints.up('sm')]: {
    paddingLeft: theme.spacing(5),
    paddingRight: theme.spacing(5)
  }
}))

const ScrollWrapper = ({ children, hidden }) => {
  if (hidden) {
    return <Box sx={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>{children}</Box>
  } else {
    return <PerfectScrollbar options={{ wheelPropagation: false, suppressScrollX: true }}>{children}</PerfectScrollbar>
  }
}

const MailLog = props => {
  // ** Props
  const {
    store,
    query,
    hidden,
    lgAbove,
    dispatch,
    setQuery,
    direction,
    updateMail,
    routeParams,
    labelColors,
    paginateMail,
    getCurrentMail,
    mailDetailsOpen,
    updateMailLabel,
    handleSelectMail,
    setMailDetailsOpen,
    handleSelectAllMail,
    handleLeftSidebarToggle
  } = props

  // ** State
  const [refresh, setRefresh] = useState(false)
  const [labelAnchorEl, setLabelAnchorEl] = useState(null)
  const [folderAnchorEl, setFolderAnchorEl] = useState(null)

  // ** Vars
  const openLabelMenu = Boolean(labelAnchorEl)
  const openFolderMenu = Boolean(folderAnchorEl)

  const folders = [
    {
      name: 'draft',
      icon: <PencilOutline fontSize='small' sx={{ mr: 2 }} />
    },
    {
      name: 'spam',
      icon: <AlertOctagonOutline fontSize='small' sx={{ mr: 2 }} />
    },
    {
      name: 'trash',
      icon: <DeleteOutline fontSize='small' sx={{ mr: 2 }} />
    },
    {
      name: 'inbox',
      icon: <EmailOutline fontSize='small' sx={{ mr: 2 }} />
    }
  ]

  const foldersConfig = {
    draft: {
      name: 'draft',
      icon: <PencilOutline fontSize='small' sx={{ mr: 2 }} />
    },
    spam: {
      name: 'spam',
      icon: <AlertOctagonOutline fontSize='small' sx={{ mr: 2 }} />
    },
    trash: {
      name: 'trash',
      icon: <DeleteOutline fontSize='small' sx={{ mr: 2 }} />
    },
    inbox: {
      name: 'inbox',
      icon: <EmailOutline fontSize='small' sx={{ mr: 2 }} />
    }
  }

  const foldersObj = {
    inbox: [foldersConfig.spam, foldersConfig.trash],
    sent: [foldersConfig.trash],
    draft: [foldersConfig.trash],
    spam: [foldersConfig.inbox, foldersConfig.trash],
    trash: [foldersConfig.inbox, foldersConfig.spam]
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
  }

  const handleMoveToTrash = () => {
    dispatch(updateMail({ emailIds: store.selectedMails, dataToUpdate: { folder: 'trash' } }))
    dispatch(handleSelectAllMail(false))
  }

  const handleStarMail = (e, id, value) => {
    e.stopPropagation()
    dispatch(updateMail({ emailIds: [id], dataToUpdate: { isStarred: value } }))
  }

  const handleReadMail = (id, value) => {
    const arr = Array.isArray(id) ? [...id] : [id]
    dispatch(updateMail({ emailIds: arr, dataToUpdate: { isRead: value } }))
    dispatch(handleSelectAllMail(false))
  }

  const handleLabelUpdate = (id, label) => {
    const arr = Array.isArray(id) ? [...id] : [id]
    dispatch(updateMailLabel({ emailIds: arr, label }))
  }

  const handleFolderUpdate = (id, folder) => {
    const arr = Array.isArray(id) ? [...id] : [id]
    dispatch(updateMail({ emailIds: arr, dataToUpdate: { folder } }))
  }

  const handleRefreshMailsClick = () => {
    setRefresh(true)
    setTimeout(() => setRefresh(false), 1000)
  }

  const renderLabelsMenu = () => {
    return Object.entries(labelColors).map(([key, value]) => {
      return (
        <MenuItem
          key={key}
          sx={{ display: 'flex', alignItems: 'center' }}
          onClick={() => {
            handleLabelUpdate(store.selectedMails, key)
            handleLabelMenuClose()
            dispatch(handleSelectAllMail(false))
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
              handleFolderUpdate(store.selectedMails, folder.name)
              handleFolderMenuClose()
              dispatch(handleSelectAllMail(false))
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
              handleFolderUpdate(store.selectedMails, folder.name)
              handleFolderMenuClose()
              dispatch(handleSelectAllMail(false))
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
              handleFolderUpdate(store.selectedMails, folder.name)
              handleFolderMenuClose()
              dispatch(handleSelectAllMail(false))
            }}
          >
            {folder.icon}
            <Typography sx={{ textTransform: 'capitalize' }}>{folder.name}</Typography>
          </MenuItem>
        )
      })
    }
  }

  const renderMailLabels = arr => {
    return arr.map((label, index) => {
      return <Circle key={index} sx={{ mr: 3, fontSize: '0.625rem', color: `${labelColors[label]}.main` }} />
    })
  }

  const mailDetailsProps = {
    hidden,
    folders,
    dispatch,
    direction,
    foldersObj,
    updateMail,
    routeParams,
    labelColors,
    paginateMail,
    handleStarMail,
    mailDetailsOpen,
    handleLabelUpdate,
    handleFolderUpdate,
    setMailDetailsOpen,
    mail: store && store.currentMail ? store.currentMail : null
  }

  return (
    <Box sx={{ width: '100%', overflow: 'hidden', position: 'relative', '& .ps__rail-y': { zIndex: 5 } }}>
      <Box sx={{ height: '100%', backgroundColor: 'background.paper' }}>
        <Box sx={{ px: 5, py: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {lgAbove ? null : (
              <IconButton onClick={handleLeftSidebarToggle} sx={{ mr: 1, ml: -2 }}>
                <MenuIcon fontSize='small' />
              </IconButton>
            )}
            <Input
              value={query}
              placeholder='Search mail'
              onChange={e => setQuery(e.target.value)}
              sx={{ width: '100%', '&:before, &:after': { display: 'none' } }}
              startAdornment={
                <InputAdornment position='start' sx={{ color: 'text.disabled' }}>
                  <Magnify sx={{ fontSize: '1.375rem' }} />
                </InputAdornment>
              }
            />
          </Box>
        </Box>
        <Divider sx={{ m: 0 }} />
        <Box sx={{ py: 2, px: { xs: 2.5, sm: 5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {store && store.mails && store.selectedMails ? (
                <Checkbox
                  onChange={e => dispatch(handleSelectAllMail(e.target.checked))}
                  checked={(store.mails.length && store.mails.length === store.selectedMails.length) || false}
                  indeterminate={
                    !!(
                      store.mails.length &&
                      store.selectedMails.length &&
                      store.mails.length !== store.selectedMails.length
                    )
                  }
                />
              ) : null}

              {store && store.selectedMails.length && store.mails && store.mails.length ? (
                <Fragment>
                  {routeParams && routeParams.folder !== 'trash' ? (
                    <IconButton onClick={handleMoveToTrash}>
                      <DeleteOutline />
                    </IconButton>
                  ) : null}
                  <IconButton onClick={() => handleReadMail(store.selectedMails, false)}>
                    <EmailOutline />
                  </IconButton>
                  <IconButton onClick={handleFolderMenuClick}>
                    <FolderOutline />
                  </IconButton>
                  <IconButton onClick={handleLabelMenuClick}>
                    <LabelOutline />
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
                  <Menu
                    open={openFolderMenu}
                    anchorEl={folderAnchorEl}
                    onClose={handleFolderMenuClose}
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
                </Fragment>
              ) : null}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton size='small' onClick={handleRefreshMailsClick}>
                <Reload sx={{ fontSize: '1.375rem' }} />
              </IconButton>
              <IconButton size='small'>
                <DotsVertical sx={{ fontSize: '1.375rem' }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
        <Divider sx={{ m: 0 }} />
        <Box sx={{ p: 0, position: 'relative', overflowX: 'hidden', height: 'calc(100% - 7.25rem)' }}>
          <ScrollWrapper hidden={hidden}>
            {store && store.mails && store.mails.length ? (
              <List sx={{ p: 0 }}>
                {store.mails.map((mail, index) => {
                  const MailReadToggleIcon = mail.isRead ? EmailOutline : EmailOpenOutline

                  return (
                    <Box
                      key={mail.id}
                      sx={{
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': {
                          zIndex: 2,
                          boxShadow: '3',
                          transform: 'translateY(-2px)',
                          '& .mail-info-right': {
                            display: 'none'
                          },
                          '& .mail-actions': {
                            display: 'flex'
                          }
                        }
                      }}
                    >
                      <MailItem
                        sx={{ backgroundColor: mail.isRead ? 'action.hover' : 'background.paper' }}
                        onClick={() => {
                          setMailDetailsOpen(true)
                          dispatch(getCurrentMail(mail.id))
                          dispatch(updateMail({ emailIds: [mail.id], dataToUpdate: { isRead: true } }))
                          setTimeout(() => {
                            dispatch(handleSelectAllMail(false))
                          }, 600)
                        }}
                      >
                        <Box sx={{ mr: 4, display: 'flex', overflow: 'hidden', alignItems: 'center' }}>
                          <Checkbox
                            onClick={e => e.stopPropagation()}
                            onChange={() => dispatch(handleSelectMail(mail.id))}
                            checked={store.selectedMails.includes(mail.id) || false}
                          />
                          <IconButton
                            size='small'
                            onClick={e => handleStarMail(e, mail.id, !mail.isStarred)}
                            sx={{ mr: { xs: 0, sm: 3 }, color: mail.isStarred ? 'warning.main' : 'text.secondary' }}
                          >
                            <StarOutline sx={{ display: { xs: 'none', sm: 'block' } }} />
                          </IconButton>
                          <Avatar
                            alt={mail.from.name}
                            src={mail.from.avatar}
                            sx={{ mr: 3, width: '2rem', height: '2rem' }}
                          />
                          <Box
                            sx={{
                              display: 'flex',
                              overflow: 'hidden',
                              flexDirection: { xs: 'column', sm: 'row' },
                              alignItems: { xs: 'flex-start', sm: 'center' }
                            }}
                          >
                            <Typography
                              sx={{
                                mr: 4,
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                                width: ['100%', 'auto'],
                                overflow: ['hidden', 'unset'],
                                textOverflow: ['ellipsis', 'unset']
                              }}
                            >
                              {mail.from.name}
                            </Typography>
                            <Typography noWrap variant='body2' sx={{ width: '100%' }}>
                              {mail.subject}
                            </Typography>
                          </Box>
                        </Box>
                        <Box
                          className='mail-actions'
                          sx={{ display: 'none', alignItems: 'center', justifyContent: 'flex-end' }}
                        >
                          {routeParams && routeParams.folder !== 'trash' ? (
                            <Tooltip placement='top' title='Delete Mail'>
                              <IconButton
                                onClick={e => {
                                  e.stopPropagation()
                                  dispatch(updateMail({ emailIds: [mail.id], dataToUpdate: { folder: 'trash' } }))
                                }}
                              >
                                <DeleteOutline />
                              </IconButton>
                            </Tooltip>
                          ) : null}

                          <Tooltip placement='top' title={mail.isRead ? 'Unread Mail' : 'Read Mail'}>
                            <IconButton
                              onClick={e => {
                                e.stopPropagation()
                                handleReadMail([mail.id], !mail.isRead)
                              }}
                            >
                              <MailReadToggleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip placement='top' title='Move to Spam'>
                            <IconButton
                              onClick={e => {
                                e.stopPropagation()
                                handleFolderUpdate([mail.id], 'spam')
                              }}
                            >
                              <AlertOctagonOutline />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Box
                          className='mail-info-right'
                          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                        >
                          <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>{renderMailLabels(mail.labels)}</Box>
                          <Typography
                            variant='caption'
                            sx={{ minWidth: '50px', textAlign: 'right', whiteSpace: 'nowrap', color: 'text.disabled' }}
                          >
                            {new Date(mail.time).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </Typography>
                        </Box>
                      </MailItem>
                      {store.mails !== null && store.mails.length - 1 > index ? (
                        <Divider sx={{ my: 0, mx: -5 }} />
                      ) : null}
                    </Box>
                  )
                })}
              </List>
            ) : (
              <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <AlertCircleOutline fontSize='small' sx={{ mr: 2 }} />
                <Typography>No Mails Found</Typography>
              </Box>
            )}
          </ScrollWrapper>
          <Backdrop
            open={refresh}
            onClick={() => setRefresh(false)}
            sx={{
              zIndex: 5,
              position: 'absolute',
              color: theme => theme.palette.common.white,
              backgroundColor: 'action.disabledBackground'
            }}
          >
            <CircularProgress color='inherit' />
          </Backdrop>
        </Box>
      </Box>

      <MailDetails {...mailDetailsProps} />
    </Box>
  )
}

export default MailLog
