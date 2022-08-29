// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import PageHeader from 'src/@core/components/page-header'
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import DatePickers from 'src/views/forms/form-elements/pickers/mui-pickers/DatePickers'
import TimePickers from 'src/views/forms/form-elements/pickers/mui-pickers/TimePickers'
import DateTimePickers from 'src/views/forms/form-elements/pickers/mui-pickers/DateTimePickers'

// ** Source code imports
import * as source from 'src/views/forms/form-elements/pickers/mui-pickers/MuiPickersSourceCode'

const MUIPickers = () => {
  return (
    <Grid container spacing={6}>
      <PageHeader
        title={
          <Typography variant='h5'>
            <Link href='https://mui.com/material-ui/lab-date-and-time-pickers/' target='_blank'>
              MUI Pickers
            </Link>
          </Typography>
        }
        subtitle={
          <Typography variant='body2'>
            Date and Time pickers allow selecting a single value from a pre-determined set
          </Typography>
        }
      />
      <Grid item xs={12}>
        <CardSnippet
          title='MUI Date Pickers'
          code={{
            tsx: source.DatePickersTSXCode,
            jsx: source.DatePickersJSXCode
          }}
        >
          <DatePickers />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <CardSnippet
          title='MUI Time Pickers'
          code={{
            tsx: source.TimePickersTSXCode,
            jsx: source.TimePickersJSXCode
          }}
        >
          <TimePickers />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <CardSnippet
          title='MUI DateTime Pickers'
          code={{
            tsx: source.DateTimePickersTSXCode,
            jsx: source.DateTimePickersJSXCode
          }}
        >
          <DateTimePickers />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default MUIPickers
