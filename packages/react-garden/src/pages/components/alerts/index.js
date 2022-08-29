// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import AlertsBasic from 'src/views/components/alerts/AlertsBasic'
import AlertsFilled from 'src/views/components/alerts/AlertsFilled'
import AlertsActions from 'src/views/components/alerts/AlertsActions'
import AlertsOutlined from 'src/views/components/alerts/AlertsOutlined'
import AlertsDescription from 'src/views/components/alerts/AlertsDescription'
import AlertsDismissible from 'src/views/components/alerts/AlertsDismissible'

// ** Source code imports
import * as source from 'src/views/components/alerts/AlertsSourceCode'

const Alerts = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Basic'
          code={{
            tsx: null,
            jsx: source.AlertsBasicJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>severity={`{'error' | 'warning' | 'info' | 'success'}`}</code> prop with{' '}
            <code>&lt;Alert&gt;</code> component for different colored alerts.
          </Typography>
          <AlertsBasic />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Outlined'
          code={{
            tsx: null,
            jsx: source.AlertsOutlinedJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>variant='outlined'</code> prop with <code>&lt;Alert&gt;</code> component for outlined alerts.
          </Typography>
          <AlertsOutlined />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Filled'
          code={{
            tsx: null,
            jsx: source.AlertsFilledJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>variant='filled'</code> prop with <code>&lt;Alert&gt;</code> component for filled alerts.
          </Typography>
          <AlertsFilled />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Action'
          code={{
            tsx: null,
            jsx: source.AlertsActionsJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            To add a button, you need to use <code>action</code> prop with <code>&lt;Alert&gt;</code> component and pass
            a button inside this prop. To add a close button, you need to use <code>onClose</code> prop with{' '}
            <code>&lt;Alert&gt;</code> component.
          </Typography>
          <AlertsActions />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Description'
          code={{
            tsx: null,
            jsx: source.AlertsDescriptionJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            You can use the <code>AlertTitle</code> component to display a formatted title above the content.
          </Typography>
          <AlertsDescription />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Dismissible'
          code={{
            tsx: null,
            jsx: source.AlertsDismissibleJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            You need to use one of the transition components (viz. Collapse, Fade, Grow and Slide) to make a dismissible
            alert.
          </Typography>
          <AlertsDismissible />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default Alerts
