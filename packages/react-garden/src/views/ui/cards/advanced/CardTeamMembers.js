// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import Avatar from '@mui/material/Avatar'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import TableHead from '@mui/material/TableHead'
import TableCell from '@mui/material/TableCell'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CardHeader from '@mui/material/CardHeader'
import TableContainer from '@mui/material/TableContainer'
import CircularProgress from '@mui/material/CircularProgress'

// ** Icons Imports
import DotsVertical from 'mdi-material-ui/DotsVertical'

// ** Custom Components
import CustomChip from 'src/@core/components/mui/chip'

const data = [
  {
    value: 60,
    tasks: 135,
    color: 'primary',
    project: 'Zipcar',
    name: 'Dean Hogan',
    completedTasks: 87,
    post: 'IOS developer',
    src: '/images/avatars/1.png'
  },
  {
    value: 80,
    tasks: 420,
    color: 'success',
    project: 'Brandi',
    name: 'Hilda Rice',
    completedTasks: 340,
    post: 'Laravel developer',
    src: '/images/avatars/8.png'
  },
  {
    value: 50,
    tasks: 82,
    color: 'warning',
    project: 'Payers',
    completedTasks: 50,
    name: "Andrew O'Brian",
    post: 'React developer',
    src: '/images/avatars/5.png'
  },
  {
    value: 70,
    tasks: 260,
    color: 'error',
    project: 'Bitbank',
    completedTasks: 98,
    name: 'Elanor Price',
    post: 'Angular developer',
    src: '/images/avatars/2.png'
  },
  {
    value: 60,
    tasks: 25,
    project: 'Aviato',
    color: 'secondary',
    completedTasks: 12,
    name: 'Carl Oliver',
    post: 'VueJs developer',
    src: '/images/avatars/3.png'
  }
]

const CardTeamMembers = () => {
  return (
    <Card>
      <CardHeader
        title='Team Members'
        titleTypographyProps={{ sx: { lineHeight: '2rem !important', letterSpacing: '0.15px !important' } }}
        action={
          <IconButton size='small' aria-label='settings' className='card-more-options' sx={{ color: 'text.secondary' }}>
            <DotsVertical />
          </IconButton>
        }
      />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ '& .MuiTableCell-root': { py: 0.75 } }}>
              <TableCell>Name</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Tasks</TableCell>
              <TableCell>Progress</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(row => {
              return (
                <TableRow
                  key={row.name}
                  sx={{
                    '&:last-child .MuiTableCell-root': { pb: theme => `${theme.spacing(4)} !important` },
                    '& .MuiTableCell-root': { border: 0, py: theme => `${theme.spacing(2.5)} !important` }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar src={row.src} alt={row.name} sx={{ width: '2.375rem', height: '2.375rem', mr: 3 }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography noWrap variant='body2' sx={{ mb: 0.5, fontWeight: 600, color: 'text.primary' }}>
                          {row.name}
                        </Typography>
                        <Typography noWrap variant='caption'>
                          {row.post}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <CustomChip
                      skin='light'
                      size='small'
                      color={row.color}
                      label={row.project}
                      sx={{ height: 20, fontSize: '0.75rem', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <Typography variant='body2' sx={{ fontWeight: 600, color: 'primary.main' }}>
                        {`${row.completedTasks}/`}
                      </Typography>
                      <Typography variant='body2' sx={{ fontWeight: 600 }}>
                        {row.tasks}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ display: 'flex', position: 'relative', justifyContent: 'center' }}>
                    <CircularProgress
                      size={32}
                      value={100}
                      thickness={5}
                      variant='determinate'
                      sx={{
                        position: 'absolute',
                        color: theme =>
                          theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.customColors.bodyBg
                      }}
                    />
                    <CircularProgress
                      size={32}
                      thickness={5}
                      value={row.value}
                      color={row.color}
                      variant='determinate'
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}

export default CardTeamMembers
