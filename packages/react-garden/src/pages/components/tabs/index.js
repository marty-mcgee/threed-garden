// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import TabsNav from 'src/views/components/tabs/TabsNav'
import TabsIcon from 'src/views/components/tabs/TabsIcon'
import TabsColor from 'src/views/components/tabs/TabsColor'
import TabsSimple from 'src/views/components/tabs/TabsSimple'
import TabsCentered from 'src/views/components/tabs/TabsCentered'
import TabsVertical from 'src/views/components/tabs/TabsVertical'
import TabsFullWidth from 'src/views/components/tabs/TabsFullWidth'
import TabsCustomized from 'src/views/components/tabs/TabsCustomized'
import TabsForcedScroll from 'src/views/components/tabs/TabsForcedScroll'
import TabsCustomizedVertical from 'src/views/components/tabs/TabsCustomizedVertical'

// ** Source code imports
import * as source from 'src/views/components/tabs/TabsSourceCode'

const Tabs = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Default Tabs'
          code={{
            tsx: null,
            jsx: source.TabsSimpleJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>Tabs are managed with the help of a state.</Typography>
          <TabsSimple />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Color'
          code={{
            tsx: null,
            jsx: source.TabsColorJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>textColor='secondary'</code> and <code>indicatorColor='secondary'</code> props with{' '}
            <code>TabList</code> component for secondary tabs.
          </Typography>
          <TabsColor />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Full Width Tabs'
          code={{
            tsx: null,
            jsx: source.TabsFullWidthJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>variant='fullWidth'</code> prop with <code>TabList</code> component to have full width tabs.
          </Typography>
          <TabsFullWidth />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Centered Tabs'
          code={{
            tsx: null,
            jsx: source.TabsCenteredJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>centered</code> prop with <code>TabList</code> component to have tabs on center.
          </Typography>
          <TabsCentered />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Icon Tabs'
          code={{
            tsx: null,
            jsx: source.TabsIconJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>icon</code> prop with <code>Tab</code> component for icons in the tab.
          </Typography>
          <TabsIcon />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Customized Tabs'
          code={{
            tsx: null,
            jsx: source.TabsCustomizedJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>styled</code> hook to customize your tabs.
          </Typography>
          <TabsCustomized />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Vertical Tabs'
          code={{
            tsx: null,
            jsx: source.TabsVerticalJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>orientation='vertical'</code> prop with <code>TabList</code> component to have vertical tabs.
          </Typography>
          <TabsVertical />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Customized Vertical Tabs'
          code={{
            tsx: null,
            jsx: source.TabsCustomizedVerticalJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>styled</code> hook to customize your tabs.
          </Typography>
          <TabsCustomizedVertical />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Nav Tabs'
          code={{
            tsx: null,
            jsx: source.TabsNavJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>component</code> prop to change the <code>Tab</code> component to the component of your choice.
          </Typography>
          <TabsNav />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Forced Scroll Buttons'
          code={{
            tsx: null,
            jsx: source.TabsForcedScrollJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>scrollButtons</code> and <code>variant='scrollable'</code> props with <code>TabList</code>{' '}
            component to have forced scrollable tabs.
          </Typography>
          <TabsForcedScroll />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default Tabs
