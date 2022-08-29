// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import SliderBasic from 'src/views/forms/form-elements/slider/SliderBasic'
import SliderRange from 'src/views/forms/form-elements/slider/SliderRange'
import SliderSizes from 'src/views/forms/form-elements/slider/SliderSizes'
import SliderColors from 'src/views/forms/form-elements/slider/SliderColors'
import SliderDiscrete from 'src/views/forms/form-elements/slider/SliderDiscrete'
import SliderVertical from 'src/views/forms/form-elements/slider/SliderVertical'
import SliderSmallSteps from 'src/views/forms/form-elements/slider/SliderSmallSteps'
import SliderCustomized from 'src/views/forms/form-elements/slider/SliderCustomized'
import SliderCustomMarks from 'src/views/forms/form-elements/slider/SliderCustomMarks'
import SliderCustomColors from 'src/views/forms/form-elements/slider/SliderCustomColors'
import SliderRemovedTrack from 'src/views/forms/form-elements/slider/SliderRemovedTrack'
import SliderInvertedTrack from 'src/views/forms/form-elements/slider/SliderInvertedTrack'
import SliderMinimumDistance from 'src/views/forms/form-elements/slider/SliderMinimumDistance'
import SliderRestrictedValues from 'src/views/forms/form-elements/slider/SliderRestrictedValues'
import SliderLabelAlwaysVisible from 'src/views/forms/form-elements/slider/SliderLabelAlwaysVisible'
import SliderControlledUncontrolled from 'src/views/forms/form-elements/slider/SliderControlledUncontrolled'

// ** Source code imports
import * as source from 'src/views/forms/form-elements/slider/SliderSourceCode'

const Sliders = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Basic Slider'
          code={{
            tsx: null,
            jsx: source.SliderBasicJSXCode
          }}
          sx={{ px: 2 }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>defaultValue</code> prop for default slider value and <code>disabled</code> prop for disabled
            slider.
          </Typography>
          <SliderBasic />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          sx={{ px: 2 }}
          title='Controlled and Uncontrolled'
          code={{
            tsx: null,
            jsx: source.SliderControlledUncontrolledJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Manage <code>value</code> prop with the help of a state for controlled slider and use{' '}
            <code>defaultValue</code> prop for uncontrolled slider.
          </Typography>
          <SliderControlledUncontrolled />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Discrete Slider'
          code={{
            tsx: null,
            jsx: source.SliderDiscreteJSXCode
          }}
          sx={{ px: 2 }}
        >
          <Typography sx={{ mb: 4 }}>
            You can generate a mark for each step with <code>marks</code> prop.
          </Typography>
          <SliderDiscrete />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Small Steps'
          code={{
            tsx: null,
            jsx: source.SliderSmallStepsJSXCode
          }}
          sx={{ px: 2 }}
        >
          <Typography sx={{ mb: 4 }}>
            You can change the default step increment with <code>step</code> prop.
          </Typography>
          <SliderSmallSteps />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Custom Marks'
          code={{
            tsx: null,
            jsx: source.SliderCustomMarksJSXCode
          }}
          sx={{ px: 2 }}
        >
          <Typography sx={{ mb: 4 }}>
            You can have custom marks by providing a rich array to the <code>marks</code> prop.
          </Typography>
          <SliderCustomMarks />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Restricted Values'
          code={{
            tsx: null,
            jsx: source.SliderRestrictedValuesJSXCode
          }}
          sx={{ px: 2 }}
        >
          <Typography sx={{ mb: 4 }}>
            You can restrict the selectable values to those provided with the <code>marks</code> prop with{' '}
            <code>step={null}</code>.
          </Typography>
          <SliderRestrictedValues />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Label Always Visible'
          sx={{ px: 2 }}
          code={{
            tsx: null,
            jsx: source.SliderLabelAlwaysVisibleJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            You can force the thumb label to be always visible with <code>valueLabelDisplay='on'</code>.
          </Typography>
          <SliderLabelAlwaysVisible />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Range Slider'
          code={{
            tsx: null,
            jsx: source.SliderRangeJSXCode
          }}
          sx={{ px: 2 }}
        >
          <Typography sx={{ mb: 4 }}>
            The slider can be used to set the start and end of a range by supplying an array of values to the{' '}
            <code>value</code> or <code>defaultValue</code> prop.
          </Typography>
          <SliderRange />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Colors'
          code={{
            tsx: null,
            jsx: source.SliderColorsJSXCode
          }}
          sx={{ px: 2 }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>color</code> prop for different colored slider.
          </Typography>
          <SliderColors />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Customized Slider'
          code={{
            tsx: null,
            jsx: source.SliderCustomizedJSXCode
          }}
          sx={{ px: 2 }}
        >
          <Typography sx={{ mb: 8 }}>
            Use <code>styled</code> hook to customize your slider.
          </Typography>
          <SliderCustomized />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Custom Colors'
          code={{
            tsx: null,
            jsx: source.SliderCustomColorsJSXCode
          }}
          sx={{ px: 2 }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>styled</code> hook to customize your slider.
          </Typography>
          <SliderCustomColors />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Vertical Sliders'
          code={{
            tsx: null,
            jsx: source.SliderVerticalJSXCode
          }}
          sx={{ px: 2 }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>orientation='vertical'</code> prop for vertical slider.
          </Typography>
          <SliderVertical />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Removed Track'
          code={{
            tsx: null,
            jsx: source.SliderRemovedTrackJSXCode
          }}
          sx={{ px: 2 }}
        >
          <Typography sx={{ mb: 4 }}>
            The track can be turned off with <code>track={`{false}`}</code> prop.
          </Typography>
          <SliderRemovedTrack />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Inverted Track'
          code={{
            tsx: null,
            jsx: source.SliderInvertedTrackJSXCode
          }}
          sx={{ px: 2 }}
        >
          <Typography sx={{ mb: 4 }}>
            The track can be inverted with <code>track='inverted'</code> prop.
          </Typography>
          <SliderInvertedTrack />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Sizes'
          code={{
            tsx: null,
            jsx: source.SliderSizesJSXCode
          }}
          sx={{ px: 2 }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>size</code> prop for different sizes of slider.
          </Typography>
          <SliderSizes />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Minimum Distance'
          code={{
            tsx: null,
            jsx: source.SliderMinimumDistanceJSXCode
          }}
          sx={{ px: 2 }}
        >
          <Typography sx={{ mb: 4 }}>
            You can enforce a minimum distance between values in the <code>onChange</code> event handler.
          </Typography>
          <SliderMinimumDistance />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default Sliders
