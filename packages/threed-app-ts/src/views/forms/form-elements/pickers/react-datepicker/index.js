// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import PageHeader from '~/@core/components/page-header'
import CardSnippet from '~/@core/components/card-snippet'

// ** Styled Component
import DatePickerWrapper from '~/@core/styles/libs/react-datepicker'

// ** Demo Components Imports
import PickersTime from '~/views/forms/form-elements/pickers/react-datepicker/PickersTime'
import PickersBasic from '~/views/forms/form-elements/pickers/react-datepicker/PickersBasic'
import PickersRange from '~/views/forms/form-elements/pickers/react-datepicker/PickersRange'
import PickersMinMax from '~/views/forms/form-elements/pickers/react-datepicker/PickersMinMax'
import PickersLocale from '~/views/forms/form-elements/pickers/react-datepicker/PickersLocale'
import PickersOptions from '~/views/forms/form-elements/pickers/react-datepicker/PickersOptions'
import PickersCallbacks from '~/views/forms/form-elements/pickers/react-datepicker/PickersCallbacks'
import PickersSpecificRange from '~/views/forms/form-elements/pickers/react-datepicker/PickersSpecificRange'
import PickersCustomization from '~/views/forms/form-elements/pickers/react-datepicker/PickersCustomization'
import PickersIncludeExclude from '~/views/forms/form-elements/pickers/react-datepicker/PickersIncludeExclude'
import PickersMonthYearQuarter from '~/views/forms/form-elements/pickers/react-datepicker/PickersMonthYearQuarter'
import PickersMonthYearDropdowns from '~/views/forms/form-elements/pickers/react-datepicker/PickersMonthYearDropdowns'

// ** Source code imports
import * as source from '~/views/forms/form-elements/pickers/react-datepicker/PickersSourceCode'

const ReactDatePicker = () => {
  return (
    <DatePickerWrapper>
      <Grid
        container
        spacing={6}
      >
        <PageHeader
          subtitle={<Typography variant='body2'>A simple and reusable datepicker component for React</Typography>}
          title={
            <Typography variant='h5'>
              <Link
                href='https://github.com/Hacker0x01/react-datepicker/'
                target='_blank'
              >
                React DatePicker
              </Link>
            </Typography>
          }
        />
        <Grid
          item
          xs={12}
        >
          <CardSnippet
            title='Date Pickers'
            code={{
              tsx: source.PickersBasicTSXCode,
              jsx: source.PickersBasicJSXCode,
            }}
          >
            <PickersBasic />
          </CardSnippet>
        </Grid>
        <Grid
          item
          xs={12}
        >
          <CardSnippet
            title='Time Pickers'
            code={{
              tsx: source.PickersTimeTSXCode,
              jsx: source.PickersTimeJSXCode,
            }}
          >
            <PickersTime />
          </CardSnippet>
        </Grid>
        <Grid
          item
          xs={12}
        >
          <CardSnippet
            title='Min & Max Pickers'
            code={{
              tsx: source.PickersMinMaxTSXCode,
              jsx: source.PickersMinMaxJSXCode,
            }}
          >
            <PickersMinMax />
          </CardSnippet>
        </Grid>
        <Grid
          item
          xs={12}
        >
          <CardSnippet
            title='Date Range Pickers'
            code={{
              tsx: source.PickersRangeTSXCode,
              jsx: source.PickersRangeJSXCode,
            }}
          >
            <PickersRange />
          </CardSnippet>
        </Grid>
        <Grid
          item
          xs={12}
        >
          <CardSnippet
            title='Specific Range'
            code={{
              tsx: source.PickersSpecificRangeTSXCode,
              jsx: source.PickersSpecificRangeJSXCode,
            }}
          >
            <PickersSpecificRange />
          </CardSnippet>
        </Grid>
        <Grid
          item
          xs={12}
        >
          <CardSnippet
            title='Callbacks'
            code={{
              tsx: source.PickersCallbacksTSXCode,
              jsx: source.PickersCallbacksJSXCode,
            }}
          >
            <PickersCallbacks />
          </CardSnippet>
        </Grid>
        <Grid
          item
          xs={12}
        >
          <CardSnippet
            title='Customization'
            code={{
              tsx: source.PickersCustomizationTSXCode,
              jsx: source.PickersCustomizationJSXCode,
            }}
          >
            <PickersCustomization />
          </CardSnippet>
        </Grid>
        <Grid
          item
          xs={12}
        >
          <CardSnippet
            title='Include Exclude'
            code={{
              tsx: source.PickersIncludeExcludeTSXCode,
              jsx: source.PickersIncludeExcludeJSXCode,
            }}
          >
            <PickersIncludeExclude />
          </CardSnippet>
        </Grid>
        <Grid
          item
          xs={12}
        >
          <CardSnippet
            title='Locale'
            code={{
              tsx: source.PickersLocaleTSXCode,
              jsx: source.PickersLocaleJSXCode,
            }}
          >
            <PickersLocale />
          </CardSnippet>
        </Grid>
        <Grid
          item
          xs={12}
        >
          <CardSnippet
            title='Month & Year Dropdowns'
            code={{
              tsx: source.PickersMonthYearDropdownsTSXCode,
              jsx: source.PickersMonthYearDropdownsJSXCode,
            }}
          >
            <PickersMonthYearDropdowns />
          </CardSnippet>
        </Grid>
        <Grid
          item
          xs={12}
        >
          <CardSnippet
            title='Month, Year & Quarter'
            code={{
              tsx: source.PickersMonthYearQuarterTSXCode,
              jsx: source.PickersMonthYearQuarterJSXCode,
            }}
          >
            <PickersMonthYearQuarter />
          </CardSnippet>
        </Grid>
        <Grid
          item
          xs={12}
        >
          <CardSnippet
            title='Options'
            code={{
              tsx: source.PickersOptionsTSXCode,
              jsx: source.PickersOptionsJSXCode,
            }}
          >
            <PickersOptions />
          </CardSnippet>
        </Grid>
      </Grid>
    </DatePickerWrapper>
  )
}

export default ReactDatePicker
