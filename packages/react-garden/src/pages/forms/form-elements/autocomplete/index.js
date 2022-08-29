// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import AutocompleteProps from 'src/views/forms/form-elements/autocomplete/AutocompleteProps'
import AutocompleteCountry from 'src/views/forms/form-elements/autocomplete/AutocompleteCountry'
import AutocompleteGrouped from 'src/views/forms/form-elements/autocomplete/AutocompleteGrouped'
import AutocompleteVariants from 'src/views/forms/form-elements/autocomplete/AutocompleteVariants'
import AutocompleteFreeSolo from 'src/views/forms/form-elements/autocomplete/AutocompleteFreeSolo'
import AutocompleteCreatable from 'src/views/forms/form-elements/autocomplete/AutocompleteCreatable'
import AutocompleteLimitTags from 'src/views/forms/form-elements/autocomplete/AutocompleteLimitTags'
import AutocompleteSmallSize from 'src/views/forms/form-elements/autocomplete/AutocompleteSmallSize'
import AutocompleteCheckboxes from 'src/views/forms/form-elements/autocomplete/AutocompleteCheckboxes'
import AutocompleteCustomInput from 'src/views/forms/form-elements/autocomplete/AutocompleteCustomInput'
import AutocompleteFixedOptions from 'src/views/forms/form-elements/autocomplete/AutocompleteFixedOptions'
import AutocompleteCustomFilter from 'src/views/forms/form-elements/autocomplete/AutocompleteCustomFilter'
import AutocompleteMultipleValues from 'src/views/forms/form-elements/autocomplete/AutocompleteMultipleValues'
import AutocompleteDisabledOptions from 'src/views/forms/form-elements/autocomplete/AutocompleteDisabledOptions'
import AutocompleteAsynchronousRequest from 'src/views/forms/form-elements/autocomplete/AutocompleteAsynchronousRequest'
import AutocompleteControlledUncontrolled from 'src/views/forms/form-elements/autocomplete/AutocompleteControlledUncontrolled'

// ** Source code imports
import * as source from 'src/views/forms/form-elements/autocomplete/AutocompleteSourceCode'

const Autocomplete = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12}>
        <CardSnippet
          title='Variants'
          code={{
            tsx: null,
            jsx: source.AutocompleteVariantsJSXCode
          }}
        >
          <Typography>
            Use <code>variant={`{'filled' | 'standard'}`}</code> prop with <code>TextField</code> component in{' '}
            <code>renderInput</code> prop with <code>Autocomplete</code> component for different variants of input. Use{' '}
            <code>disabled</code> prop with <code>Autocomplete</code> component for disabled autocomplete.
          </Typography>
          <AutocompleteVariants />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <CardSnippet
          title='Controlled and Uncontrolled'
          code={{
            tsx: null,
            jsx: source.AutocompleteControlledUncontrolledJSXCode
          }}
        >
          <Typography>
            Use <code>value</code> prop with <code>Autocomplete</code> component for controlled autocomplete input.
          </Typography>
          <AutocompleteControlledUncontrolled />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <CardSnippet
          title='Autocomplete Props'
          code={{
            tsx: null,
            jsx: source.AutocompletePropsJSXCode
          }}
        >
          <Typography>
            Each of the following examples demonstrate one feature of <code>Autocomplete</code> component.
          </Typography>
          <AutocompleteProps />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Country Select'
          code={{
            tsx: null,
            jsx: source.AutocompleteCountryJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>Choose one of the countries.</Typography>
          <AutocompleteCountry />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Free Solo'
          code={{
            tsx: null,
            jsx: source.AutocompleteFreeSoloJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>freeSolo</code> prop so the textbox can contain any arbitrary value.
          </Typography>
          <AutocompleteFreeSolo />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Creatable'
          code={{
            tsx: null,
            jsx: source.AutocompleteCreatableJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>You can create an option other than from the list.</Typography>
          <AutocompleteCreatable />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Grouped'
          code={{
            tsx: null,
            jsx: source.AutocompleteGroupedJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>groupBy</code> prop to group the list according to your needs.
          </Typography>
          <AutocompleteGrouped />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Disabled Options'
          code={{
            tsx: null,
            jsx: source.AutocompleteDisabledOptionsJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>getOptionDisabled</code> prop to disable some options from the list.
          </Typography>
          <AutocompleteDisabledOptions />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Asynchronous Request'
          code={{
            tsx: null,
            jsx: source.AutocompleteAsynchronousRequestJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>You can fetch the data with the help of APIs for the options.</Typography>
          <AutocompleteAsynchronousRequest />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <CardSnippet
          title='Multiple Values'
          code={{
            tsx: null,
            jsx: source.AutocompleteMultipleValuesJSXCode
          }}
        >
          <Typography>
            Use <code>multiple</code> prop to select multiple options from the list.
          </Typography>
          <AutocompleteMultipleValues />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Fixed Options'
          code={{
            tsx: null,
            jsx: source.AutocompleteFixedOptionsJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>You can fix an option in the input and add any other option as well.</Typography>
          <AutocompleteFixedOptions />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Checkboxes'
          code={{
            tsx: null,
            jsx: source.AutocompleteCheckboxesJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>Checkbox</code> component in <code>renderOption</code> prop to render checkbox in options.
          </Typography>
          <AutocompleteCheckboxes />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Limit Tags'
          code={{
            tsx: null,
            jsx: source.AutocompleteLimitTagsJSXCode
          }}
        >
          <Typography sx={{ mb: 6 }}>
            Use <code>limitTags</code> prop to limit tags in the input.
          </Typography>
          <AutocompleteLimitTags />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Small Size'
          code={{
            tsx: null,
            jsx: source.AutocompleteSmallSizeJSXCode
          }}
        >
          <Typography sx={{ mb: 5 }}>
            Use <code>size='small'</code> prop for small sized input.
          </Typography>
          <AutocompleteSmallSize />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Custom Input'
          code={{
            tsx: null,
            jsx: source.AutocompleteCustomInputJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>renderInput</code> prop to customize the rendered input.
          </Typography>
          <AutocompleteCustomInput />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Custom Filter'
          code={{
            tsx: null,
            jsx: source.AutocompleteCustomFilterJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>filterOptions</code> prop to filter the search according to your needs.
          </Typography>
          <AutocompleteCustomFilter />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default Autocomplete
