// ** React Imports
import { useState } from 'react'

// ** Next Import
import Link from 'next/link'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Menu from '@mui/material/Menu'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import { DataGrid } from '@mui/x-data-grid'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

// ** Icons Imports
import Send from 'mdi-material-ui/Send'
import Check from 'mdi-material-ui/Check'
import ChartPie from 'mdi-material-ui/ChartPie'
import Download from 'mdi-material-ui/Download'
import ArrowDown from 'mdi-material-ui/ArrowDown'
import EyeOutline from 'mdi-material-ui/EyeOutline'
import TrendingUp from 'mdi-material-ui/TrendingUp'
import ChevronDown from 'mdi-material-ui/ChevronDown'
import ContentCopy from 'mdi-material-ui/ContentCopy'
import DotsVertical from 'mdi-material-ui/DotsVertical'
import DeleteOutline from 'mdi-material-ui/DeleteOutline'
import PencilOutline from 'mdi-material-ui/PencilOutline'
import ContentSaveOutline from 'mdi-material-ui/ContentSaveOutline'
import InformationOutline from 'mdi-material-ui/InformationOutline'

// ** Custom Component Imports
import CustomAvatar from 'src/@core/components/mui/avatar'

const StyledLink = styled('a')(({ theme }) => ({
  textDecoration: 'none',
  color: theme.palette.primary.main
}))

// ** Vars
const invoiceStatusObj = {
  Sent: { color: 'secondary', icon: <Send sx={{ fontSize: '1rem' }} /> },
  Paid: { color: 'success', icon: <Check sx={{ fontSize: '1rem' }} /> },
  Draft: { color: 'primary', icon: <ContentSaveOutline sx={{ fontSize: '1rem' }} /> },
  'Partial Payment': { color: 'warning', icon: <ChartPie sx={{ fontSize: '1rem' }} /> },
  'Past Due': { color: 'error', icon: <InformationOutline sx={{ fontSize: '1rem' }} /> },
  Downloaded: { color: 'info', icon: <ArrowDown sx={{ fontSize: '1rem' }} /> }
}

const RowOptions = ({ id }) => {
  // ** State
  const [anchorEl, setAnchorEl] = useState(null)
  const rowOptionsOpen = Boolean(anchorEl)

  const handleRowOptionsClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleRowOptionsClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <IconButton size='small' onClick={handleRowOptionsClick}>
        <DotsVertical fontSize='small' />
      </IconButton>
      <Menu
        keepMounted
        anchorEl={anchorEl}
        open={rowOptionsOpen}
        onClose={handleRowOptionsClose}
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
          <Download fontSize='small' sx={{ mr: 2 }} />
          Download
        </MenuItem>
        <Link href={`/apps/invoice/edit/${id}`} passHref>
          <MenuItem>
            <PencilOutline fontSize='small' sx={{ mr: 2 }} />
            Edit
          </MenuItem>
        </Link>
        <MenuItem>
          <ContentCopy fontSize='small' sx={{ mr: 2 }} />
          Duplicate
        </MenuItem>
      </Menu>
    </>
  )
}

const columns = [
  {
    flex: 0.2,
    field: 'id',
    minWidth: 90,
    headerName: '# ID',
    renderCell: ({ row }) => (
      <Link href={`/apps/invoice/preview/${row.id}`} passHref>
        <StyledLink>{`#${row.id}`}</StyledLink>
      </Link>
    )
  },
  {
    flex: 0.15,
    minWidth: 80,
    field: 'invoiceStatus',
    renderHeader: () => <TrendingUp fontSize='small' />,
    renderCell: ({ row }) => {
      const { dueDate, balance, invoiceStatus } = row
      const color = invoiceStatusObj[invoiceStatus] ? invoiceStatusObj[invoiceStatus].color : 'primary'
      const Icon = invoiceStatusObj[invoiceStatus] ? invoiceStatusObj[invoiceStatus].icon : null

      return (
        <Tooltip
          title={
            <>
              <Typography variant='caption' sx={{ color: 'common.white', fontWeight: 600 }}>
                {invoiceStatus}
              </Typography>
              <br />
              <Typography variant='caption' sx={{ color: 'common.white', fontWeight: 600 }}>
                Balance:
              </Typography>{' '}
              {balance}
              <br />
              <Typography variant='caption' sx={{ color: 'common.white', fontWeight: 600 }}>
                Due Date:
              </Typography>{' '}
              {dueDate}
            </>
          }
        >
          <CustomAvatar skin='light' color={color} sx={{ width: '1.875rem', height: '1.875rem' }}>
            {Icon}
          </CustomAvatar>
        </Tooltip>
      )
    }
  },
  {
    flex: 0.25,
    minWidth: 90,
    field: 'total',
    headerName: 'Total',
    renderCell: ({ row }) => <Typography variant='body2'>${row.total || 0}</Typography>
  },
  {
    flex: 0.3,
    minWidth: 125,
    field: 'issuedDate',
    headerName: 'Issued Date',
    renderCell: ({ row }) => <Typography variant='body2'>{row.issuedDate}</Typography>
  },
  {
    flex: 0.1,
    minWidth: 130,
    sortable: false,
    field: 'actions',
    headerName: 'Actions',
    renderCell: ({ row }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title='Delete Invoice'>
          <IconButton size='small'>
            <DeleteOutline fontSize='small' />
          </IconButton>
        </Tooltip>
        <Tooltip title='View'>
          <Box>
            <Link href={`/apps/invoice/preview/${row.id}`} passHref>
              <IconButton size='small' component='a' sx={{ textDecoration: 'none' }}>
                <EyeOutline fontSize='small' />
              </IconButton>
            </Link>
          </Box>
        </Tooltip>
        <RowOptions id={row.id} />
      </Box>
    )
  }
]

const InvoiceListTable = ({ invoiceData }) => {
  // ** State
  const [pageSize, setPageSize] = useState(7)
  const [anchorEl, setAnchorEl] = useState(null)

  // ** Var
  const open = Boolean(anchorEl)

  const handleClick = event => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <Card>
      <CardHeader
        title='Invoice List'
        sx={{ '& .MuiCardHeader-action': { m: 0 } }}
        titleTypographyProps={{
          variant: 'h6',
          sx: { lineHeight: '32px !important', letterSpacing: '0.15px !important' }
        }}
        action={
          <>
            <Button
              variant='contained'
              aria-haspopup='true'
              onClick={handleClick}
              endIcon={<ChevronDown />}
              aria-expanded={open ? 'true' : undefined}
              aria-controls={open ? 'user-view-overview-export' : undefined}
            >
              Export
            </Button>
            <Menu open={open} anchorEl={anchorEl} onClose={handleClose} id='user-view-overview-export'>
              <MenuItem onClick={handleClose}>PDF</MenuItem>
              <MenuItem onClick={handleClose}>XLSX</MenuItem>
              <MenuItem onClick={handleClose}>CSV</MenuItem>
            </Menu>
          </>
        }
      />
      <DataGrid
        autoHeight
        columns={columns}
        rows={invoiceData}
        pageSize={pageSize}
        disableSelectionOnClick
        rowsPerPageOptions={[7, 10, 25, 50]}
        onPageSizeChange={newPageSize => setPageSize(newPageSize)}
      />
    </Card>
  )
}

export default InvoiceListTable
