// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import SwitchesBasic from 'src/views/forms/form-elements/switch/SwitchesBasic'
import SwitchesSizes from 'src/views/forms/form-elements/switch/SwitchesSizes'
import SwitchesColors from 'src/views/forms/form-elements/switch/SwitchesColors'
import SwitchesCustomized from 'src/views/forms/form-elements/switch/SwitchesCustomized'
import SwitchesStandalone from 'src/views/forms/form-elements/switch/SwitchesStandalone'
import SwitchesLabelPlacement from 'src/views/forms/form-elements/switch/SwitchesLabelPlacement'
import SwitchesControlledUncontrolled from 'src/views/forms/form-elements/switch/SwitchesControlledUncontrolled'

// ** Source code imports
import * as source from 'src/views/forms/form-elements/switch/SwitchesSourceCode'

const Switches = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12}>
        <CardSnippet
          title='Basic Switches'
          code={{
            tsx: null,
            jsx: source.SwitchesBasicJSXCode
          }}
        >
          <SwitchesBasic />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Controlled and Uncontrolled'
          code={{
            tsx: null,
            jsx: source.SwitchesControlledUncontrolledJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Manage <code>checked</code> prop with the help of a state for controlled <code>Switch</code> and use
            <code>defaultChecked</code> prop for uncontrolled <code>Switch</code>.
          </Typography>
          <SwitchesControlledUncontrolled />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Label Placement'
          code={{
            tsx: null,
            jsx: source.SwitchesLabelPlacementJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Use <code>labelPlacement</code> prop with <code>FormControlLabel</code> component to change the placement of
            the label.
          </Typography>
          <SwitchesLabelPlacement />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Colors'
          code={{
            tsx: null,
            jsx: source.SwitchesColorsJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Use <code>color</code> prop with <code>Switch</code> component for different colored switch.
          </Typography>
          <SwitchesColors />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Customized Switches'
          code={{
            tsx: null,
            jsx: source.SwitchesCustomizedJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>styled</code> hook to customize your switch.
          </Typography>
          <SwitchesCustomized />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Sizes'
          code={{
            tsx: null,
            jsx: source.SwitchesSizesJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Use <code>size='small'</code> prop with <code>Switch</code> component for small switch.
          </Typography>
          <SwitchesSizes />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Standalone Switches'
          code={{
            tsx: null,
            jsx: source.SwitchesStandaloneJSXCode
          }}
        >
          <SwitchesStandalone />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default Switches
