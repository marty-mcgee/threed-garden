// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Styled Component
import DatePickerWrapper from '~/@core/styles/libs/react-datepicker'

// ** Demo Components Imports
import FormLayoutsTabs from '~/views/forms/form-layouts/FormLayoutsTabs'
import FormLayoutsBasic from '~/views/forms/form-layouts/FormLayoutsBasic'
import FormLayoutsIcons from '~/views/forms/form-layouts/FormLayoutsIcons'
import FormLayoutsSeparator from '~/views/forms/form-layouts/FormLayoutsSeparator'
import FormLayoutsAlignment from '~/views/forms/form-layouts/FormLayoutsAlignment'
// import FormLayoutsCollapsible from '~/views/forms/form-layouts/FormLayoutsCollapsible'

// ** Third Party Styles Imports
// import 'react-datepicker/dist/react-datepicker.css'

const FormLayouts = () => {
  return (
    <DatePickerWrapper>
      <Grid container spacing={6}>
        <Grid item xs={12} md={6}>
          <FormLayoutsBasic />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormLayoutsIcons />
        </Grid>
        <Grid item xs={12}>
          <FormLayoutsSeparator />
        </Grid>
        <Grid item xs={12} sx={{ pt: theme => `${theme.spacing(8)} !important` }}>
          <Typography variant='h6'>Form with Tabs</Typography>
        </Grid>
        <Grid item xs={12} sx={{ pt: theme => `${theme.spacing(4)} !important` }}>
          <FormLayoutsTabs />
        </Grid>
        <Grid item xs={12} sx={{ pt: theme => `${theme.spacing(8)} !important` }}>
          <Typography variant='h6'>Collapsible Sections</Typography>
        </Grid>
        <Grid item xs={12} sx={{ pt: theme => `${theme.spacing(4)} !important` }}>
          {/* <FormLayoutsCollapsible /> */}
        </Grid>
        <Grid item xs={12}>
          <FormLayoutsAlignment />
        </Grid>
      </Grid>
    </DatePickerWrapper>
  )
}

export default FormLayouts
