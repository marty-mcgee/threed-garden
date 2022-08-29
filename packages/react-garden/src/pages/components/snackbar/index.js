// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import SnackbarAlert from 'src/views/components/snackbar/SnackbarAlert'
import SnackbarSimple from 'src/views/components/snackbar/SnackbarSimple'
import SnackbarPositioned from 'src/views/components/snackbar/SnackbarPositioned'
import SnackbarTransition from 'src/views/components/snackbar/SnackbarTransition'
import SnackbarConsecutive from 'src/views/components/snackbar/SnackbarConsecutive'
import SnackbarControlSlideDirection from 'src/views/components/snackbar/SnackbarControlSlideDirection'

// ** Source code imports
import * as source from 'src/views/components/snackbar/SnackbarSourceCode'

const Snackbar = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Simple Snackbar'
          code={{
            tsx: null,
            jsx: source.SnackbarSimpleJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Manage <code>open</code> prop with <code>Snackbar</code> component with the help of a state.
          </Typography>
          <SnackbarSimple />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Alert Snackbar'
          code={{
            tsx: null,
            jsx: source.SnackbarAlertJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Add <code>Alert</code> component as a children of <code>Snackbar</code> component.
          </Typography>
          <SnackbarAlert />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Positioned Snackbar'
          code={{
            tsx: null,
            jsx: source.SnackbarPositionedJSXCode
          }}
        >
          <Typography>
            Use <code>anchorOrigin</code> prop to change the position of the snackbar.
          </Typography>
          <SnackbarPositioned />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Consecutive Snackbars'
          code={{
            tsx: null,
            jsx: source.SnackbarConsecutiveJSXCode
          }}
        >
          <Typography>When multiple snackbar updates are necessary, they should appear one at a time.</Typography>
          <SnackbarConsecutive />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Change Transition'
          code={{
            tsx: null,
            jsx: source.SnackbarTransitionJSXCode
          }}
        >
          <Typography>When multiple snackbar updates are necessary, they should appear one at a time.</Typography>
          <SnackbarTransition />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Control Slide Direction'
          code={{
            tsx: null,
            jsx: source.SnackbarControlSlideDirectionJSXCode
          }}
        >
          <Typography>
            You can change the direction of the <code>Slide</code> transition.
          </Typography>
          <SnackbarControlSlideDirection />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default Snackbar
