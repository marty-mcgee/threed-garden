// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import AvatarsIcon from 'src/views/components/avatars/AvatarsIcon'
import AvatarsImage from 'src/views/components/avatars/AvatarsImage'
import AvatarsSizes from 'src/views/components/avatars/AvatarsSizes'
import AvatarsLetter from 'src/views/components/avatars/AvatarsLetter'
import AvatarsGrouped from 'src/views/components/avatars/AvatarsGrouped'
import AvatarsVariants from 'src/views/components/avatars/AvatarsVariants'
import AvatarsWithBadge from 'src/views/components/avatars/AvatarsWithBadge'

// ** Source code imports
import * as source from 'src/views/components/avatars/AvatarsSourceCode'

const Avatars = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12} sm={6}>
        <CardSnippet
          title='Image Avatars'
          code={{
            tsx: null,
            jsx: source.AvatarsImageJSXCode
          }}
        >
          <Typography>
            Use <code>src</code> and <code>alt</code> props with <code>Avatar</code> component for basic image avatar.
          </Typography>
          <AvatarsImage />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} sm={6}>
        <CardSnippet
          title='Letter Avatars'
          code={{
            tsx: null,
            jsx: source.AvatarsLetterJSXCode
          }}
        >
          <Typography>
            Write some letters inside <code>Avatar</code> component to have letter avatar. Use our custom component for
            colored avatar and use <code>skin='light'</code> prop for light variant with opacity and{' '}
            <code>skin='light-static'</code> prop for light variant without opacity.
          </Typography>
          <AvatarsLetter />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} sm={6}>
        <CardSnippet
          title='Sizes'
          code={{
            tsx: null,
            jsx: source.AvatarsSizesJSXCode
          }}
        >
          <Typography>
            You can set any size of an avatar using <code>styled</code> hook.
          </Typography>
          <AvatarsSizes />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} sm={6}>
        <CardSnippet
          title='Icon Avatars'
          code={{
            tsx: null,
            jsx: source.AvatarsIconJSXCode
          }}
        >
          <Typography>
            Pass an icon as a child of <code>Avatar</code> component to make an icon avatar.
          </Typography>
          <AvatarsIcon />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} sm={6}>
        <CardSnippet
          title='Variants'
          code={{
            tsx: null,
            jsx: source.AvatarsVariantsJSXCode
          }}
        >
          <Typography>
            Use <code>variant={`{'square' | 'rounded'}`}</code> prop with <code>Avatar</code> component for different
            variants.
          </Typography>
          <AvatarsVariants />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} sm={6}>
        <CardSnippet
          title='Avatars With Badge'
          code={{
            tsx: null,
            jsx: source.AvatarsWithBadgeJSXCode
          }}
        >
          <Typography>
            Use <code>Avatar</code> component as a child of <code>Badge</code> component.
          </Typography>
          <AvatarsWithBadge />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <CardSnippet
          title='Grouped Avatars'
          code={{
            tsx: null,
            jsx: source.AvatarsGroupedJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Wrap all your avatars with <code>AvatarGroup</code> component to have grouped avatars. Use <code>max</code>{' '}
            prop with <code>AvatarGroup</code> component to restrict maximum number of avatars shown.
          </Typography>
          <AvatarsGrouped />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default Avatars
