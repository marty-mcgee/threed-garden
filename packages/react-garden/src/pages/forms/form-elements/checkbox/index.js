// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import CheckboxesBasic from 'src/views/forms/form-elements/checkbox/CheckboxesBasic'
import CheckboxesSizes from 'src/views/forms/form-elements/checkbox/CheckboxesSizes'
import CheckboxesColors from 'src/views/forms/form-elements/checkbox/CheckboxesColors'
import CheckboxesShowError from 'src/views/forms/form-elements/checkbox/CheckboxesShowError'
import CheckboxesCustomized from 'src/views/forms/form-elements/checkbox/CheckboxesCustomized'
import CheckboxesCustomIcons from 'src/views/forms/form-elements/checkbox/CheckboxesCustomIcons'
import CheckboxesLabelPlacement from 'src/views/forms/form-elements/checkbox/CheckboxesLabelPlacement'
import CheckboxesControlledUncontrolled from 'src/views/forms/form-elements/checkbox/CheckboxesControlledUncontrolled'

// ** Source code imports
import * as source from 'src/views/forms/form-elements/checkbox/CheckboxesSourceCode'

const Checkboxes = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12}>
        <CardSnippet
          title='Basic Checkboxes'
          code={{
            tsx: null,
            jsx: source.CheckboxesBasicJSXCode
          }}
        >
          <CheckboxesBasic />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Controlled and Uncontrolled'
          code={{
            tsx: null,
            jsx: source.CheckboxesControlledUncontrolledJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Manage <code>checked</code> prop with the help of a state for controlled <code>Checkbox</code> and{' '}
            <code>defaultChecked</code> prop with for uncontrolled <code>Checkbox</code>.
          </Typography>
          <CheckboxesControlledUncontrolled />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Colors'
          code={{
            tsx: null,
            jsx: source.CheckboxesColorsJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Use <code>color</code> prop for different colored checkbox.
          </Typography>
          <CheckboxesColors />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Customized'
          code={{
            tsx: null,
            jsx: source.CheckboxesCustomizedJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Use <code>styled</code> hook to customize your checkbox.
          </Typography>
          <CheckboxesCustomized />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Custom Icons'
          code={{
            tsx: null,
            jsx: source.CheckboxesCustomIconsJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Use <code>icon</code> and <code>checkedIcon</code> props with <code>Checkbox</code> component to change
            default checkbox icons.
          </Typography>
          <CheckboxesCustomIcons />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Label Placement'
          code={{
            tsx: null,
            jsx: source.CheckboxesLabelPlacementJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>labelPlacement</code> prop with <code>FormControlLabel</code> component to change the placement of
            the label.
          </Typography>
          <CheckboxesLabelPlacement />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Show Error'
          code={{
            tsx: null,
            jsx: source.CheckboxesShowErrorJSXCode
          }}
        >
          <Typography>
            You can display error by managing <code>error</code> prop with <code>FormControl</code> component with the
            help of a state.
          </Typography>
          <CheckboxesShowError />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <CardSnippet
          title='Sizes'
          code={{
            tsx: null,
            jsx: source.CheckboxesSizesJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Use <code>icon</code> and <code>checkedIcon</code> props with <code>Checkbox</code> component and use{' '}
            <code>fontSize='small'</code> prop with the former props for small checkbox.
          </Typography>
          <CheckboxesSizes />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default Checkboxes
