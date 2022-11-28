// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import PageHeader from '#/ui/~core/components/page-header'
import CardSnippet from '#/ui/~core/components/card-snippet'

// ** Demo Components Imports
import SwiperLoop from '#/ui/views/components/swiper/SwiperLoop'
import SwiperZoom from '#/ui/views/components/swiper/SwiperZoom'
import SwiperFader from '#/ui/views/components/swiper/SwiperFader'
import SwiperDefault from '#/ui/views/components/swiper/SwiperDefault'
import SwiperSpacing from '#/ui/views/components/swiper/SwiperSpacing'
import SwiperFreeMode from '#/ui/views/components/swiper/SwiperFreeMode'
import SwiperCentered from '#/ui/views/components/swiper/SwiperCentered'
import SwiperVertical from '#/ui/views/components/swiper/SwiperVertical'
import SwiperControls from '#/ui/views/components/swiper/SwiperControls'
import SwiperThumbnails from '#/ui/views/components/swiper/SwiperThumbnails'
import SwiperAutoSwitch from '#/ui/views/components/swiper/SwiperAutoSwitch'
import SwiperMultipleSlides from '#/ui/views/components/swiper/SwiperMultipleSlides'
import SwiperMutationObserver from '#/ui/views/components/swiper/SwiperMutationObserver'

// ** Styled Component Import
import KeenSliderWrapper from '#/ui/~core/styles/libs/keen-slider'

// ** Source code imports
import * as source from '#/ui/views/components/swiper/SwiperSourceCode'

// ** Hook Import
import { useSettings } from '#/ui/~core/hooks/useSettings'

const Swiper = () => {
  // ** Hook
  const {
    settings: { direction },
  } = useSettings()

  return (
    <KeenSliderWrapper>
      <Grid container spacing={6} className='match-height'>
        <PageHeader
          subtitle={<Typography variant='body2'>Swiper is the most modern free mobile touch slider.</Typography>}
          title={
            <Typography variant='h5'>
              <Link href='https://swiperjs.com/react' target='_blank'>
                Swiper
              </Link>
            </Typography>
          }
        />
        <Grid item xs={12}>
          <CardSnippet
            title='Default'
            code={{
              tsx: null,
              jsx: source.SwiperDefaultJSXCode,
            }}>
            <SwiperDefault direction={direction} />
          </CardSnippet>
        </Grid>
        <Grid item xs={12}>
          <CardSnippet
            title='Loop'
            code={{
              tsx: null,
              jsx: source.SwiperLoopJSXCode,
            }}>
            <SwiperLoop direction={direction} />
          </CardSnippet>
        </Grid>
        <Grid item xs={12}>
          <CardSnippet
            title='Multiple Slides'
            code={{
              tsx: null,
              jsx: source.SwiperMultipleSlidesJSXCode,
            }}>
            <SwiperMultipleSlides direction={direction} />
          </CardSnippet>
        </Grid>
        <Grid item xs={12}>
          <CardSnippet
            title='Spacing'
            code={{
              tsx: null,
              jsx: source.SwiperSpacingJSXCode,
            }}>
            <SwiperSpacing direction={direction} />
          </CardSnippet>
        </Grid>
        <Grid item xs={12}>
          <CardSnippet
            title='FreeMode'
            code={{
              tsx: null,
              jsx: source.SwiperFreeModeJSXCode,
            }}>
            <SwiperFreeMode direction={direction} />
          </CardSnippet>
        </Grid>
        <Grid item xs={12}>
          <CardSnippet
            title='Centered'
            code={{
              tsx: null,
              jsx: source.SwiperCenteredJSXCode,
            }}>
            <SwiperCentered direction={direction} />
          </CardSnippet>
        </Grid>
        <Grid item xs={12}>
          <CardSnippet
            title='Vertical'
            code={{
              tsx: null,
              jsx: source.SwiperVerticalJSXCode,
            }}>
            <SwiperVertical />
          </CardSnippet>
        </Grid>
        <Grid item xs={12}>
          <CardSnippet
            title='Controls'
            code={{
              tsx: null,
              jsx: source.SwiperControlsJSXCode,
            }}>
            <SwiperControls direction={direction} />
          </CardSnippet>
        </Grid>
        <Grid item xs={12}>
          <CardSnippet
            title='Thumbnails'
            code={{
              tsx: null,
              jsx: source.SwiperThumbnailsJSXCode,
            }}>
            <SwiperThumbnails direction={direction} />
          </CardSnippet>
        </Grid>
        <Grid item xs={12}>
          <CardSnippet
            title='Fader'
            code={{
              tsx: null,
              jsx: source.SwiperFaderJSXCode,
            }}>
            <SwiperFader direction={direction} />
          </CardSnippet>
        </Grid>
        <Grid item xs={12}>
          <CardSnippet
            title='Zoom'
            code={{
              tsx: null,
              jsx: source.SwiperZoomJSXCode,
            }}>
            <SwiperZoom direction={direction} />
          </CardSnippet>
        </Grid>
        <Grid item xs={12}>
          <CardSnippet
            title='Auto Switch'
            code={{
              tsx: null,
              jsx: source.SwiperAutoSwitchJSXCode,
            }}>
            <SwiperAutoSwitch direction={direction} />
          </CardSnippet>
        </Grid>
        <Grid item xs={12}>
          <CardSnippet
            title='Mutation Observer'
            code={{
              tsx: null,
              jsx: source.SwiperMutationObserverJSXCode,
            }}>
            <SwiperMutationObserver direction={direction} />
          </CardSnippet>
        </Grid>
      </Grid>
    </KeenSliderWrapper>
  )
}

export default Swiper
