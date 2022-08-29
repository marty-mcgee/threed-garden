// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import TimelineFilled from 'src/views/components/timeline/TimelineFilled'
import TimelineCenter from 'src/views/components/timeline/TimelineCenter'
import TimelineOutlined from 'src/views/components/timeline/TimelineOutlined'

// ** Source code imports
import * as source from 'src/views/components/timeline/TimelineSourceCode'

const TreeView = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Timeline Filled'
          code={{
            tsx: null,
            jsx: source.TimelineFilledJSXCode
          }}
        >
          <TimelineFilled />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Timeline Outlined'
          code={{
            tsx: null,
            jsx: source.TimelineOutlinedJSXCode
          }}
        >
          <TimelineOutlined />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <CardSnippet
          title='Timeline Center With Icons'
          code={{
            tsx: null,
            jsx: source.TimelineCenterJSXCode
          }}
        >
          <TimelineCenter />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default TreeView
