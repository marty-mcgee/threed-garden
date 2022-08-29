// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import BadgesDot from 'src/views/components/badges/BadgesDot'
import BadgesBasic from 'src/views/components/badges/BadgesBasic'
import BadgesLight from 'src/views/components/badges/BadgesLight'
import BadgesOverlap from 'src/views/components/badges/BadgesOverlap'
import BadgesMaxValue from 'src/views/components/badges/BadgesMaxValue'
import BadgesAlignment from 'src/views/components/badges/BadgesAlignment'
import BadgesVisibility from 'src/views/components/badges/BadgesVisibility'

// ** Source code imports
import * as source from 'src/views/components/badges/BadgesSourceCode'

const Pagination = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Simple Badges'
          code={{
            tsx: null,
            jsx: source.BadgesBasicJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Use <code>badgeContent</code> prop for the text inside the badge and <code>color</code> prop for different
            colors of a badge.
          </Typography>
          <BadgesBasic />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Dot Badges'
          code={{
            tsx: null,
            jsx: source.BadgesDotJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Use <code>variant='dot'</code> prop for dot badges.
          </Typography>
          <BadgesDot />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Badge Alignment'
          code={{
            tsx: null,
            jsx: source.BadgesAlignmentJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Use <code>anchorOrigin</code> prop to move the badge to any corner of the wrapped element.
          </Typography>
          <BadgesAlignment />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Maximum Value'
          code={{
            tsx: null,
            jsx: source.BadgesMaxValueJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Use <code>max</code> prop to cap the value of the badge content.
          </Typography>
          <BadgesMaxValue />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Badge Overlap'
          code={{
            tsx: null,
            jsx: source.BadgesOverlapJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            Use <code>overlap</code> prop to place the badge relative to the corner of the wrapped element.
          </Typography>
          <BadgesOverlap />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Badge visibility'
          code={{
            tsx: null,
            jsx: source.BadgesVisibilityJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            The visibility of badges can be controlled using <code>invisible</code> prop.
          </Typography>
          <BadgesVisibility />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <CardSnippet
          title='Custom Light Badges'
          code={{
            tsx: null,
            jsx: source.BadgesLightJSXCode
          }}
        >
          <Typography sx={{ mb: 2 }}>
            If you want to use light variant of the badges, you need to use our custom component with{' '}
            <code>skin='light'</code> prop.
          </Typography>
          <BadgesLight />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default Pagination
