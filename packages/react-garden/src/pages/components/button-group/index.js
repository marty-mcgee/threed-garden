// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import ButtonGroupBasic from 'src/views/components/button-group/ButtonGroupBasic'
import ButtonGroupSizes from 'src/views/components/button-group/ButtonGroupSizes'
import ButtonGroupSplit from 'src/views/components/button-group/ButtonGroupSplit'
import ButtonGroupColors from 'src/views/components/button-group/ButtonGroupColors'
import ButtonToggleSizes from 'src/views/components/button-group/ButtonToggleSizes'
import ButtonToggleSimple from 'src/views/components/button-group/ButtonToggleSimple'
import ButtonToggleColors from 'src/views/components/button-group/ButtonToggleColors'
import ButtonGroupVertical from 'src/views/components/button-group/ButtonGroupVertical'
import ButtonToggleMultiple from 'src/views/components/button-group/ButtonToggleMultiple'
import ButtonToggleVertical from 'src/views/components/button-group/ButtonToggleVertical'
import ButtonToggleCustomized from 'src/views/components/button-group/ButtonToggleCustomized'
import ButtonToggleEnforceValue from 'src/views/components/button-group/ButtonToggleEnforceValue'

// ** Source code imports
import * as source from 'src/views/components/button-group/ButtonGroupSourceCode'

const ButtonGroup = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12}>
        <Typography variant='h6'>Button Group</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Basic Button Group'
          code={{
            tsx: null,
            jsx: source.ButtonGroupBasicJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>variant={`{'outlined' | 'contained' | 'text'}`}</code> prop with <code>&lt;ButtonGroup&gt;</code>{' '}
            component for button groups.
          </Typography>
          <ButtonGroupBasic />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Button Group Sizes'
          code={{
            tsx: null,
            jsx: source.ButtonGroupSizesJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>size={`{'small' | 'medium' | 'large'}`}</code> prop with <code>&lt;ButtonGroup&gt;</code>{' '}
            component for different sizes of button groups.
          </Typography>
          <ButtonGroupSizes />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Vertical Button Group'
          code={{
            tsx: null,
            jsx: source.ButtonGroupVerticalJSXCode
          }}
        >
          <Typography>
            Use <code>orientation='vertical'</code> prop with <code>&lt;ButtonGroup&gt;</code> component for vertical
            button groups.
          </Typography>
          <ButtonGroupVertical />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Split Button'
          code={{
            tsx: null,
            jsx: source.ButtonGroupSplitJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            <code>ButtonGroup</code> can also be used to create a split button. The dropdown can change the button
            action (as in this example), or be used to immediately trigger a related action.
          </Typography>
          <ButtonGroupSplit />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Button Group Colors'
          code={{
            tsx: null,
            jsx: source.ButtonGroupColorsJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>color</code> prop for different colored button-groups.
          </Typography>
          <ButtonGroupColors />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <Typography variant='h6'>Toggle Button</Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Simple Toggle Button'
          code={{
            tsx: null,
            jsx: source.ButtonToggleSimpleJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Manage <code>value</code> prop with <code>&lt;ToggleButtonGroup&gt;</code> component with the help of a
            state and use <code>exclusive</code> prop with <code>&lt;ToggleButtonGroup&gt;</code> component.
          </Typography>
          <ButtonToggleSimple />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Multiple Toggle Button'
          code={{
            tsx: null,
            jsx: source.ButtonToggleMultipleJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Manage <code>value</code> prop with the help of a state with array.
          </Typography>
          <ButtonToggleMultiple />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Toggle Button Sizes'
          code={{
            tsx: null,
            jsx: source.ButtonToggleSizesJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>size={`{'size' | 'large'}`}</code> prop for different sizes.
          </Typography>
          <ButtonToggleSizes />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Vertical Toggle Button'
          code={{
            tsx: null,
            jsx: source.ButtonToggleVerticalJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>orientation='vertical'</code> prop for vertical toggle button.
          </Typography>
          <ButtonToggleVertical />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <CardSnippet
          title='Enforce Value Set'
          code={{
            tsx: null,
            jsx: source.ButtonToggleEnforceValueJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>if</code> statement in handle function in <code>onChange</code> prop.
          </Typography>
          <ButtonToggleEnforceValue />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <CardSnippet
          title='Customized Toggle Button'
          code={{
            tsx: null,
            jsx: source.ButtonToggleCustomizedJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>styled</code> hook to customize your toggle button.
          </Typography>
          <ButtonToggleCustomized />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Toggle Button Colors'
          code={{
            tsx: null,
            jsx: source.ButtonToggleColorsJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>color</code> prop for different colored toggle-buttons.
          </Typography>
          <ButtonToggleColors />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default ButtonGroup
