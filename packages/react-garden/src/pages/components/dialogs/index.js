// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import DialogForm from 'src/views/components/dialogs/DialogForm'
import DialogAlert from 'src/views/components/dialogs/DialogAlert'
import DialogSizes from 'src/views/components/dialogs/DialogSizes'
import DialogSimple from 'src/views/components/dialogs/DialogSimple'
import DialogsScroll from 'src/views/components/dialogs/DialogsScroll'
import DialogTransition from 'src/views/components/dialogs/DialogTransition'
import DialogCustomized from 'src/views/components/dialogs/DialogCustomized'
import DialogFullScreen from 'src/views/components/dialogs/DialogFullScreen'
import DialogConfirmation from 'src/views/components/dialogs/DialogConfirmation'
import DialogRespoFullScreen from 'src/views/components/dialogs/DialogRespoFullScreen'

// ** Source code imports
import * as source from 'src/views/components/dialogs/DialogSourceCode'

const Dialog = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Simple Dialog'
          code={{
            tsx: null,
            jsx: source.DialogSimpleJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Manage <code>open</code> prop with the help of a state.
          </Typography>
          <DialogSimple />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Alerts'
          code={{
            tsx: null,
            jsx: source.DialogAlertJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Show an alert to the user to convey something or make the user choose from the given options.
          </Typography>
          <DialogAlert />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Transitions'
          code={{
            tsx: null,
            jsx: source.DialogTransitionJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            You can also use any of the transitions that you like. Use <code>TransitionComponent</code> prop for the
            transition.
          </Typography>
          <DialogTransition />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Form Dialog'
          code={{
            tsx: null,
            jsx: source.DialogFormJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>Form dialogs allow users to fill out form fields within a dialog.</Typography>
          <DialogForm />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Customized Dialog'
          code={{
            tsx: null,
            jsx: source.DialogCustomizedJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            You can customize the component the way you want using <code>styled</code> hook.
          </Typography>
          <DialogCustomized />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Full Screen Dialog'
          code={{
            tsx: null,
            jsx: source.DialogFullScreenJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Add <code>fullScreen</code> prop with <code>Dialog</code> component for a full screen dialog.
          </Typography>
          <DialogFullScreen />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Optional Sizes'
          code={{
            tsx: null,
            jsx: source.DialogSizesJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            You can set a dialog maximum width by using the <code>maxWidth</code> enumerable in combination with the{' '}
            <code>fullWidth</code> boolean. When the <code>fullWidth</code> property is true, the dialog will adapt
            based on the <code>maxWidth</code> value.
          </Typography>
          <DialogSizes />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Responsive full-screen'
          code={{
            tsx: null,
            jsx: source.DialogRespoFullScreenJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Make a full screen dialog at particular screen sizes only by using <code>useMediaQuery</code> hook.
          </Typography>
          <DialogRespoFullScreen />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Confirmation Dialog'
          code={{
            tsx: null,
            jsx: source.DialogConfirmationJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>disableEscapeKeyDown</code> prop to disable 'Escape' key and use <code>onClose</code> prop to
            disable the backdrop.
          </Typography>
          <DialogConfirmation />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Scrolling Long Content'
          code={{
            tsx: null,
            jsx: source.DialogsScrollJSXCode
          }}
        >
          <Typography>
            <code>scroll=paper</code> scrolls within the paper element and <code>scroll=body</code> scrolls within the
            body element.
          </Typography>
          <DialogsScroll />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default Dialog
