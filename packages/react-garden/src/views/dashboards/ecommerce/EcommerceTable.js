// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { DataGrid } from '@mui/x-data-grid'

// ** Icons Imports
import ChartPie from 'mdi-material-ui/ChartPie'
import TrendingUp from 'mdi-material-ui/TrendingUp'
import ContentSaveOutline from 'mdi-material-ui/ContentSaveOutline'
import AlertCircleOutline from 'mdi-material-ui/AlertCircleOutline'
import CloudDownloadOutline from 'mdi-material-ui/CloudDownloadOutline'

// ** Custom Components
import CustomChip from 'src/@core/components/mui/chip'
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials'

const rows = [
  {
    id: 2798,
    balance: 489,
    total: 277.39,
    status: 'Draft',
    name: 'Joseph Wheeler',
    email: 'nuroani@icpair.com',
    avatarSrc: '/images/avatars/1.png',
    dueDate: `2/10/${new Date().getFullYear()}`
  },
  {
    id: 1304,
    balance: 0,
    total: 117.58,
    name: 'May Lloyd',
    email: 'jeju@ma.co.uk',
    status: 'Partial Payment',
    avatarSrc: '/images/avatars/2.png',
    dueDate: `11/9/${new Date().getFullYear()}`
  },
  {
    id: 7900,
    total: 1792,
    balance: 'unpaid',
    name: 'William Mckinney',
    status: 'Partial Payment',
    email: 'cidagehe@nonalbo.com',
    dueDate: `5/17/${new Date().getFullYear()}`
  },
  {
    id: 63036,
    balance: 0,
    total: 632.82,
    status: 'Downloaded',
    name: 'Warren Clarke',
    email: 'hirasles@zozzetkuv.edu',
    avatarSrc: '/images/avatars/5.png',
    dueDate: `8/9/${new Date().getFullYear()}`
  },
  {
    id: 33052,
    balance: 899,
    total: 356.42,
    status: 'Past Due',
    name: 'Isabel Briggs',
    email: 'temiwiho@ohacma.gov',
    dueDate: `6/26/${new Date().getFullYear()}`
  },
  {
    id: 23579,
    total: 289.9,
    balance: 'unpaid',
    status: 'Downloaded',
    email: 'boz@peh.co.uk',
    name: 'Adeline Bennett',
    avatarSrc: '/images/avatars/4.png',
    dueDate: `4/22/${new Date().getFullYear()}`
  },
  {
    id: 81618,
    balance: 0,
    total: 2282,
    status: 'Past Due',
    email: 'la@omav.im',
    name: 'Lucy Rodgers',
    avatarSrc: '/images/avatars/8.png',
    dueDate: `11/9/${new Date().getFullYear()}`
  }
]

const statusObj = {
  'Partial Payment': { color: 'warning', icon: <ChartPie sx={{ fontSize: '1rem' }} /> },
  Draft: { color: 'primary', icon: <ContentSaveOutline sx={{ fontSize: '1rem' }} /> },
  'Past Due': { color: 'error', icon: <AlertCircleOutline sx={{ fontSize: '1rem' }} /> },
  Downloaded: { color: 'info', icon: <CloudDownloadOutline sx={{ fontSize: '1rem' }} /> }
}

const renderClientAvatar = row => {
  if (row.avatarSrc) {
    return <CustomAvatar src={row.avatarSrc} sx={{ mr: 3.5, width: 30, height: 30 }} />
  } else {
    return (
      <CustomAvatar skin='light' sx={{ mr: 3.5, width: 30, height: 30, fontSize: '.8rem' }}>
        {getInitials(row.name ? row.name : 'John Doe')}
      </CustomAvatar>
    )
  }
}

const renderBalance = row => {
  if (row.balance === 0) {
    return <CustomChip size='small' skin='light' color='success' label='Paid' />
  } else if (row.balance === 'unpaid') {
    return <CustomChip size='small' skin='light' color='error' label='Unpaid' />
  } else {
    return <Typography variant='body2'>{`$${row.balance}`}</Typography>
  }
}

const columns = [
  {
    flex: 0.15,
    field: 'id',
    minWidth: 100,
    headerName: 'ID',
    renderCell: ({ row }) => (
      <Typography variant='body2' sx={{ letterSpacing: '0.25px' }}>
        {`#${row.id}`}
      </Typography>
    )
  },
  {
    flex: 0.15,
    minWidth: 100,
    field: 'status',
    renderHeader: () => <TrendingUp fontSize='small' />,
    renderCell: ({ row }) => {
      const { dueDate, status } = row
      const color = statusObj[status] ? statusObj[status].color : 'primary'
      const Icon = statusObj[status] ? statusObj[status].icon : null

      return (
        <Tooltip
          title={
            <div>
              <Typography variant='caption' sx={{ color: 'common.white', fontWeight: 600 }}>
                {status}
              </Typography>
              <br />
              <Typography variant='caption' sx={{ color: 'common.white', fontWeight: 600 }}>
                Due Date:
              </Typography>{' '}
              {dueDate}
            </div>
          }
        >
          <CustomAvatar skin='light' color={color} sx={{ width: 30, height: 30 }}>
            {Icon}
          </CustomAvatar>
        </Tooltip>
      )
    }
  },
  {
    flex: 0.25,
    field: 'name',
    minWidth: 230,
    headerName: 'Client',
    renderCell: ({ row }) => {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {renderClientAvatar(row)}
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              sx={{
                mb: -0.5,
                fontWeight: 600,
                lineHeight: 1.72,
                fontSize: '0.875rem',
                letterSpacing: '0.22px'
              }}
            >
              {row.name}
            </Typography>
            <Typography variant='body2' sx={{ fontSize: '0.75rem', letterSpacing: '0.4px' }}>
              {row.email}
            </Typography>
          </Box>
        </Box>
      )
    }
  },
  {
    flex: 0.15,
    minWidth: 125,
    field: 'total',
    headerName: 'Total',
    renderCell: ({ row }) => (
      <Typography variant='body2' sx={{ letterSpacing: '0.25px' }}>
        {`$${row.total}`}
      </Typography>
    )
  },
  {
    flex: 0.15,
    minWidth: 150,
    field: 'balance',
    headerName: 'Balance',
    renderCell: ({ row }) => renderBalance(row)
  }
]

const EcommerceTable = () => {
  return (
    <Card>
      <DataGrid autoHeight hideFooter rows={rows} columns={columns} disableSelectionOnClick pagination={undefined} />
    </Card>
  )
}

export default EcommerceTable
