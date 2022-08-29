// ** MUI Imports
import Grid from '@mui/material/Grid'

const PageHeader = props => {
  // ** Props
  const { title, subtitle } = props

  return (
    <Grid item xs={12}>
      {title}
      {subtitle || null}
    </Grid>
  )
}

export default PageHeader
