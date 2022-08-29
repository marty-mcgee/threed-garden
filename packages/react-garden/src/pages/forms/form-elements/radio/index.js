// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import RadioGroup from 'src/views/forms/form-elements/radio/RadioGroup'
import RadioColor from 'src/views/forms/form-elements/radio/RadioColor'
import RadioSizes from 'src/views/forms/form-elements/radio/RadioSizes'
import RadioShowError from 'src/views/forms/form-elements/radio/RadioShowError'
import RadioStandalone from 'src/views/forms/form-elements/radio/RadioStandalone'
import RadioCustomized from 'src/views/forms/form-elements/radio/RadioCustomized'
import RadioLabelPlacement from 'src/views/forms/form-elements/radio/RadioLabelPlacement'
import RadioControlledUncontrolled from 'src/views/forms/form-elements/radio/RadioControlledUncontrolled'

// ** Source code imports
import * as source from 'src/views/forms/form-elements/radio/RadioSourceCode'

const Radios = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12}>
        <CardSnippet
          title='RadioGroup'
          code={{
            tsx: null,
            jsx: source.RadioGroupJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            <code>RadioGroup</code> is a helpful wrapper used to group <code>Radio</code> components that provides an
            easier API, and proper keyboard accessibility to the group.
          </Typography>
          <RadioGroup />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <CardSnippet
          title='Controlled and Uncontrolled'
          code={{
            tsx: null,
            jsx: source.RadioControlledUncontrolledJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Manage <code>value</code> prop with <code>RadioGroup</code> component with the help of a state for
            controlled radio and <code>defaultValue</code> prop with <code>RadioGroup</code> component for uncontrolled
            radio.
          </Typography>
          <RadioControlledUncontrolled />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Standalone Radio Buttons'
          code={{
            tsx: null,
            jsx: source.RadioStandaloneJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            <code>Radio</code> can also be used standalone, without the RadioGroup wrapper.
          </Typography>
          <RadioStandalone />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Colors'
          code={{
            tsx: null,
            jsx: source.RadioColorJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Use <code>color</code> prop with <code>Radio</code> component for different colored radio button.
          </Typography>
          <RadioColor />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Sizes'
          code={{
            tsx: null,
            jsx: source.RadioSizesJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Use <code>color</code> prop with <code>Radio</code> component for different colored radio button.
          </Typography>
          <RadioSizes />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Customized Radio'
          code={{
            tsx: null,
            jsx: source.RadioCustomizedJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Use <code>styled</code> hook to customize your radio button.
          </Typography>
          <RadioCustomized />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Label Placement'
          code={{
            tsx: null,
            jsx: source.RadioLabelPlacementJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            You can change the placement of the label with <code>FormControlLabel</code> component's{' '}
            <code>labelPlacement</code> prop.
          </Typography>
          <RadioLabelPlacement />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Show Error'
          code={{
            tsx: null,
            jsx: source.RadioShowErrorJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            In general, radio buttons should have a value selected by default. If this is not the case, you can display
            an error if no value is selected when the form is submitted.
          </Typography>
          <RadioShowError />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default Radios
