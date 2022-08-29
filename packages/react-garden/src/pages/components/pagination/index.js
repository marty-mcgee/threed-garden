// ** MUI Imports
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import PaginationSizes from 'src/views/components/pagination/PaginationSizes'
import PaginationSimple from 'src/views/components/pagination/PaginationSimple'
import PaginationRanges from 'src/views/components/pagination/PaginationRanges'
import PaginationRounded from 'src/views/components/pagination/PaginationRounded'
import PaginationButtons from 'src/views/components/pagination/PaginationButtons'
import PaginationOutlined from 'src/views/components/pagination/PaginationOutlined'
import PaginationDisabled from 'src/views/components/pagination/PaginationDisabled'
import PaginationControlled from 'src/views/components/pagination/PaginationControlled'

// ** Source code imports
import * as source from 'src/views/components/pagination/PaginationSourceCode'

// Styled component for Grid container
const GridContainer = styled(Grid)(({ theme }) => ({
  '& .demo-space-y > *': {
    marginBottom: theme.spacing(5.2),
    '&:last-of-type': {
      marginBottom: 0
    }
  }
}))

const Pagination = () => {
  return (
    <GridContainer container spacing={6} className='match-height'>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Simple Pagination'
          code={{
            tsx: null,
            jsx: source.PaginationSimpleJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use the following props with <code>Pagination</code> component: <code>count</code> prop for number of page
            items and <code>color</code> prop for different colored pagination.
          </Typography>
          <PaginationSimple />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Outlined Pagination'
          code={{
            tsx: null,
            jsx: source.PaginationOutlinedJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>variant='outlined'</code> prop for outlined pagination.
          </Typography>
          <PaginationOutlined />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Disabled Pagination'
          code={{
            tsx: null,
            jsx: source.PaginationDisabledJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>disabled</code> prop with <code>Pagination</code> component to disable the whole pagination.
          </Typography>
          <PaginationDisabled />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Rounded Pagination'
          code={{
            tsx: null,
            jsx: source.PaginationRoundedJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>shape='rounded'</code> prop for rounded pagination.
          </Typography>
          <PaginationRounded />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Sizes'
          code={{
            tsx: null,
            jsx: source.PaginationSizesJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>size={`{'small' | 'large'}`}</code> prop for different sizes of pagination.
          </Typography>
          <PaginationSizes />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Buttons'
          code={{
            tsx: null,
            jsx: source.PaginationButtonsJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>showFirstButton</code> & <code>showLastButton</code> props to show first-page and last-page
            buttons and <code>hidePrevButton</code> & <code>hideNextButton</code> props to hide previous-page and
            next-page buttons.
          </Typography>
          <PaginationButtons />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <CardSnippet
          title='Controlled Pagination'
          code={{
            tsx: null,
            jsx: source.PaginationControlledJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Manage <code>page</code> and <code>onChange</code> props with the help of a state.
          </Typography>
          <PaginationControlled />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <CardSnippet
          title='Pagination Ranges'
          code={{
            tsx: null,
            jsx: source.PaginationRangesJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            You can specify how many digits to display either side of current page with the <code>siblingRange</code>{' '}
            prop, and adjacent to the start and end page number with the <code>boundaryRange</code> prop.
          </Typography>
          <PaginationRanges />
        </CardSnippet>
      </Grid>
    </GridContainer>
  )
}

export default Pagination
