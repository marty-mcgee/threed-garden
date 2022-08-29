// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import SelectProps from 'src/views/forms/form-elements/select/SelectProps'
import SelectNative from 'src/views/forms/form-elements/select/SelectNative'
import SelectVariants from 'src/views/forms/form-elements/select/SelectVariants'
import SelectMultiple from 'src/views/forms/form-elements/select/SelectMultiple'
import SelectGrouping from 'src/views/forms/form-elements/select/SelectGrouping'
import SelectCustomized from 'src/views/forms/form-elements/select/SelectCustomized'
import SelectWithDialog from 'src/views/forms/form-elements/select/SelectWithDialog'
import SelectControlledUncontrolled from 'src/views/forms/form-elements/select/SelectControlledUncontrolled'

// ** Source code imports
import * as source from 'src/views/forms/form-elements/select/SelectSourceCode'

const Selects = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Variants'
          code={{
            tsx: null,
            jsx: source.SelectVariantsJSXCode
          }}
        >
          <Typography>
            Use <code>variant={`{'filled' | 'standard'}`}</code> prop with <code>FormControl</code> component for
            different variants of select and use <code>MenuItem</code> component as children of <code>Select</code>{' '}
            component.
          </Typography>
          <SelectVariants />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Native Select'
          code={{
            tsx: null,
            jsx: source.SelectNativeJSXCode
          }}
        >
          <Typography>
            Use <code>native</code> prop with <code>Select</code> component and <code>&lt;option&gt;</code> element
            inside <code>Select</code> component for native select.
          </Typography>
          <SelectNative />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <CardSnippet
          title='Select Props'
          code={{
            tsx: null,
            jsx: source.SelectPropsJSXCode
          }}
        >
          <Typography>
            Use <code>displayEmpty</code>, <code>disabled</code>, <code>error</code>, <code>renderValue</code>,{' '}
            <code>autoWidth</code>, <code>required</code> & <code>inputProps</code> props and{' '}
            <code>FormHelperText</code> component for different types of selects.
          </Typography>
          <SelectProps />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Controlled and Uncontrolled'
          code={{
            tsx: null,
            jsx: source.SelectControlledUncontrolledJSXCode
          }}
        >
          <Typography>
            Manage <code>value</code> prop with the help of a state for controlled <code>Select</code> and use{' '}
            <code>defaultValue</code> prop for uncontrolled <code>Select</code>.
          </Typography>
          <SelectControlledUncontrolled />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Customized Select'
          code={{
            tsx: null,
            jsx: source.SelectCustomizedJSXCode
          }}
        >
          <Typography>
            Use <code>styled</code> hook to customize your select.
          </Typography>
          <SelectCustomized />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Multiple Select'
          code={{
            tsx: null,
            jsx: source.SelectMultipleJSXCode
          }}
        >
          <Typography>
            Use <code>multiple</code> prop for multiple selections.
          </Typography>
          <SelectMultiple />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <CardSnippet
              title='Select with Dialog'
              code={{
                tsx: null,
                jsx: source.SelectWithDialogJSXCode
              }}
            >
              <SelectWithDialog />
            </CardSnippet>
          </Grid>
          <Grid item xs={12}>
            <CardSnippet
              title='Grouping'
              code={{
                tsx: null,
                jsx: source.SelectGroupingJSXCode
              }}
            >
              <Typography>
                Display categories with the <code>ListSubheader</code> component or the native{' '}
                <code>&lt;optgroup&gt;</code> element.
              </Typography>
              <SelectGrouping />
            </CardSnippet>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default Selects
