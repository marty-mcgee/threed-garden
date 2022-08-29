// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { DataGrid } from '@mui/x-data-grid'

// ** Icons Imports
import Cog from 'mdi-material-ui/Cog'
import Pencil from 'mdi-material-ui/Pencil'
import ChartPie from 'mdi-material-ui/ChartPie'
import AccountOutline from 'mdi-material-ui/AccountOutline'

// ** Custom Components
import CustomChip from 'src/@core/components/mui/chip'
import CustomAvatar from 'src/@core/components/mui/avatar'

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials'

const rows = [
  {
    id: 1,
    role: 'maintainer',
    status: 'inactive',
    username: '@gslixby0',
    name: 'Joseph Wheeler',
    email: 'nuroani@icpair.com',
    avatarSrc: '/images/avatars/1.png'
  },
  {
    id: 2,
    status: 'active',
    name: 'May Lloyd',
    role: 'subscriber',
    email: 'jeju@ma.co.uk',
    username: '@hredmore1',
    avatarSrc: '/images/avatars/2.png'
  },
  {
    id: 3,
    status: 'pending',
    role: 'subscriber',
    username: '@msicely2',
    name: 'William Mckinney',
    email: 'cidagehe@nonalbo.com'
  },
  {
    id: 4,
    role: 'editor',
    status: 'active',
    name: 'Warren Clarke',
    username: '@mhurran4',
    email: 'hirasles@zozzetkuv.edu',
    avatarSrc: '/images/avatars/5.png'
  },
  {
    id: 5,
    role: 'maintainer',
    status: 'inactive',
    username: '@crisby3',
    name: 'Isabel Briggs',
    email: 'temiwiho@ohacma.gov'
  },
  {
    id: 6,
    role: 'author',
    status: 'pending',
    email: 'boz@peh.co.uk',
    name: 'Adeline Bennett',
    username: '@shalstead5',
    avatarSrc: '/images/avatars/4.png'
  },
  {
    id: 7,
    role: 'editor',
    status: 'active',
    name: 'Lora Simpson',
    email: 'dude@oco.nl',
    username: '@bkildayr',
    avatarSrc: '/images/avatars/8.png'
  }
]

const roleObj = {
  author: {
    color: 'success',
    icon: <Cog sx={{ fontSize: '1rem' }} />
  },
  maintainer: {
    color: 'primary',
    icon: <ChartPie sx={{ fontSize: '1rem' }} />
  },
  editor: {
    color: 'info',
    icon: <Pencil sx={{ fontSize: '1rem' }} />
  },
  subscriber: {
    color: 'warning',
    icon: <AccountOutline sx={{ fontSize: '1rem' }} />
  }
}

const statusObj = {
  active: { color: 'success' },
  pending: { color: 'warning' },
  inactive: { color: 'secondary' }
}

const renderUserAvatar = row => {
  if (row.avatarSrc) {
    return <CustomAvatar src={row.avatarSrc} sx={{ mr: 3, width: 30, height: 30 }} />
  } else {
    return (
      <CustomAvatar skin='light' sx={{ mr: 3, width: 30, height: 30, fontSize: '.8rem' }}>
        {getInitials(row.name ? row.name : 'John Doe')}
      </CustomAvatar>
    )
  }
}

const columns = [
  {
    flex: 0.25,
    field: 'name',
    minWidth: 200,
    headerName: 'Name',
    renderCell: ({ row }) => {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {renderUserAvatar(row)}
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
              {row.username}
            </Typography>
          </Box>
        </Box>
      )
    }
  },
  {
    flex: 0.2,
    minWidth: 200,
    field: 'email',
    headerName: 'Email',
    renderCell: ({ row }) => (
      <Typography variant='body2' sx={{ letterSpacing: '0.25px' }}>
        {row.email}
      </Typography>
    )
  },
  {
    flex: 0.2,
    minWidth: 140,
    field: 'role',
    headerName: 'Role',
    renderCell: ({ row }) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CustomAvatar skin='light' color={roleObj[row.role].color} sx={{ mr: 2.5, width: 30, height: 30 }}>
          {roleObj[row.role].icon}
        </CustomAvatar>
        <Typography variant='body2' sx={{ textTransform: 'capitalize' }}>
          {row.role}
        </Typography>
      </Box>
    )
  },
  {
    flex: 0.2,
    minWidth: 120,
    field: 'status',
    headerName: 'Status',
    renderCell: ({ row }) => (
      <CustomChip
        skin='light'
        label={row.status}
        color={statusObj[row.status].color}
        sx={{
          height: 24,
          fontSize: '0.75rem',
          textTransform: 'capitalize',
          '& .MuiChip-label': { fontWeight: 600, lineHeight: 1.4 }
        }}
      />
    )
  }
]

const AnalyticsTable = () => {
  return (
    <Card>
      <DataGrid autoHeight hideFooter rows={rows} columns={columns} disableSelectionOnClick pagination={undefined} />
    </Card>
  )
}

export default AnalyticsTable
