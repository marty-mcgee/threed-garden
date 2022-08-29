// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import AccordionSimple from 'src/views/components/accordion/AccordionSimple'
import AccordionActions from 'src/views/components/accordion/AccordionActions'
import AccordionControlled from 'src/views/components/accordion/AccordionControlled'
import AccordionCustomized from 'src/views/components/accordion/AccordionCustomized'

// ** Source code imports
import * as source from 'src/views/components/accordion/AccordionSourceCode'

const Accordion = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Simple Accordion'
          code={{
            tsx: null,
            jsx: source.AccordionSimpleJSXCode
          }}
          sx={{
            boxShadow: 'none',
            backgroundColor: 'transparent',
            border: theme => `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>Accordion</code>, <code>AccordionSummary</code> and <code>AccordionDetails</code> components to
            make a simple accordion.
          </Typography>
          <AccordionSimple />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Controlled Accordion'
          code={{
            tsx: null,
            jsx: source.AccordionControlledJSXCode
          }}
          sx={{
            boxShadow: 'none',
            backgroundColor: 'transparent',
            border: theme => `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Manage <code>expanded</code> prop with the help of a state.
          </Typography>
          <AccordionControlled />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Customized Accordion'
          code={{
            tsx: null,
            jsx: source.AccordionCustomizedJSXCode
          }}
          sx={{
            boxShadow: 'none',
            backgroundColor: 'transparent',
            border: theme => `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>styled</code> hook to customize the component the way you want it.
          </Typography>
          <AccordionCustomized />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Additional Actions'
          code={{
            tsx: null,
            jsx: source.AccordionActionsJSXCode
          }}
          sx={{
            boxShadow: 'none',
            backgroundColor: 'transparent',
            border: theme => `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography sx={{ mb: 4 }}>
            In order to put an action such as a Checkbox or a button inside <code>AccordionSummary</code>, you need to
            stop the propagation of the focus and click events to prevent the accordion from expanding/collapsing when
            using the action.
          </Typography>
          <AccordionActions />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default Accordion
