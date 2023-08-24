// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'

// ** Custom Components Imports
import PageHeader from '#/ui/components/page-header'

// ** Demo Components Imports
import TableBasic from '#/ui/table/mui/TableBasic'
import TableDense from '#/ui/table/mui/TableDense'
import TableSpanning from '#/ui/table/mui/TableSpanning'
import TableCustomized from '#/ui/table/mui/TableCustomized'
import TableSortSelect from '#/ui/table/mui/TableSortSelect'
import TableCollapsible from '#/ui/table/mui/TableCollapsible'
import TableStickyHeader from '#/ui/table/mui/TableStickyHeader'

const MUITable = () => {
  return (
    <Grid container spacing={6}>
      <PageHeader
        title={
          <Typography variant='h5'>
            <Link href='https://mui.com/material-ui/react-table/' target='_blank'>
              MUI Tables
            </Link>
          </Typography>
        }
        subtitle={<Typography variant='body2'>Tables display sets of data. They can be fully customized</Typography>}
      />
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Basic Table' titleTypographyProps={{ variant: 'h6' }} />
          <TableBasic />
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Dense Table' titleTypographyProps={{ variant: 'h6' }} />
          <TableDense />
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Sticky Header' titleTypographyProps={{ variant: 'h6' }} />
          <TableStickyHeader />
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Collapsible Table' titleTypographyProps={{ variant: 'h6' }} />
          <TableCollapsible />
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Spanning Table' titleTypographyProps={{ variant: 'h6' }} />
          <TableSpanning />
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardHeader title='Customized Table' titleTypographyProps={{ variant: 'h6' }} />
          <TableCustomized />
        </Card>
      </Grid>
      <Grid item xs={12}>
        <Card>
          <TableSortSelect />
        </Card>
      </Grid>
    </Grid>
  )
}

export default MUITable
