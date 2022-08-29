// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import TableRow from '@mui/material/TableRow'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import TableContainer from '@mui/material/TableContainer'

// ** Icon Imports
import Close from 'mdi-material-ui/Close'
import Refresh from 'mdi-material-ui/Refresh'
import ChevronUp from 'mdi-material-ui/ChevronUp'

// Component Imports
import CardActionAll from 'src/views/ui/cards/actions/CardActionAll'
import CardActionClose from 'src/views/ui/cards/actions/CardActionClose'
import CardActionRefresh from 'src/views/ui/cards/actions/CardActionRefresh'
import CardActionCollapse from 'src/views/ui/cards/actions/CardActionCollapse'

const CardActions = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Card Actions' />
          <CardContent>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label='Card Actions'>
                <TableHead>
                  <TableRow>
                    <TableCell>Action</TableCell>
                    <TableCell align='center'>Icon</TableCell>
                    <TableCell align='left'>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell component='th' scope='row'>
                      Collapse
                    </TableCell>
                    <TableCell align='center'>
                      <ChevronUp />
                    </TableCell>
                    <TableCell>Collapse card content using collapse action.</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component='th' scope='row'>
                      Refresh Content
                    </TableCell>
                    <TableCell align='center'>
                      <Refresh />
                    </TableCell>
                    <TableCell>Refresh your card content using refresh action.</TableCell>
                  </TableRow>
                  <TableRow sx={{ '&:last-of-type td, &:last-of-type th': { border: 0 } }}>
                    <TableCell component='th' scope='row'>
                      Remove Card
                    </TableCell>
                    <TableCell align='center'>
                      <Close />
                    </TableCell>
                    <TableCell>Remove card from page using remove card action</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <CardActionCollapse />
      </Grid>
      <Grid item xs={12} md={6}>
        <CardActionRefresh />
      </Grid>
      <Grid item xs={12} md={6}>
        <CardActionClose />
      </Grid>
      <Grid item xs={12} md={6}>
        <CardActionAll />
      </Grid>
    </Grid>
  )
}

export default CardActions
