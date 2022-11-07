export const SwiperCenteredJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Components
import { useKeenSlider } from 'keen-slider/react'

const SwiperCentered = ({ direction }) => {
  // ** Hook
  const [ref] = useKeenSlider({
    rtl: direction === 'rtl',
    slides: {
      perView: 2,
      spacing: 16,
      origin: 'center'
    }
  })

  return (
    <Box ref={ref} className='keen-slider'>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-26.jpg' alt='swiper 26' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-27.jpg' alt='swiper 27' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-28.jpg' alt='swiper 28' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-29.jpg' alt='swiper 29' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-30.jpg' alt='swiper 30' />
      </Box>
    </Box>
  )
}

export default SwiperCentered
`}</code>
  </pre>
)

export const SwiperAutoSwitchJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Components
import { useKeenSlider } from 'keen-slider/react'

const SwiperAutoSwitch = ({ direction }) => {
  // ** Hook
  const [ref] = useKeenSlider(
    {
      loop: true,
      rtl: direction === 'rtl'
    },
    [
      slider => {
        let mouseOver = false
        let timeout

        const clearNextTimeout = () => {
          clearTimeout(timeout)
        }

        const nextTimeout = () => {
          clearTimeout(timeout)
          if (mouseOver) return
          timeout = setTimeout(() => {
            slider.next()
          }, 2000)
        }
        slider.on('created', () => {
          slider.container.addEventListener('mouseover', () => {
            mouseOver = true
            clearNextTimeout()
          })
          slider.container.addEventListener('mouseout', () => {
            mouseOver = false
            nextTimeout()
          })
          nextTimeout()
        })
        slider.on('dragStarted', clearNextTimeout)
        slider.on('animationEnded', nextTimeout)
        slider.on('updated', nextTimeout)
      }
    ]
  )

  return (
    <Box ref={ref} className='keen-slider'>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-1.jpg' alt='swiper 1' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-2.jpg' alt='swiper 2' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-3.jpg' alt='swiper 3' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-4.jpg' alt='swiper 4' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-5.jpg' alt='swiper 5' />
      </Box>
    </Box>
  )
}

export default SwiperAutoSwitch
`}</code>
  </pre>
)

export const SwiperControlsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Badge from '@mui/material/Badge'

// ** Icons Imports
import ChevronLeft from 'mdi-material-ui/ChevronLeft'
import ChevronRight from 'mdi-material-ui/ChevronRight'

// ** Third Party Components
import clsx from 'clsx'
import { useKeenSlider } from 'keen-slider/react'

const SwiperControls = ({ direction }) => {
  // ** States
  const [loaded, setLoaded] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  // ** Hook
  const [sliderRef, instanceRef] = useKeenSlider({
    rtl: direction === 'rtl',
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel)
    },
    created() {
      setLoaded(true)
    }
  })

  return (
    <>
      <Box className='navigation-wrapper'>
        <Box ref={sliderRef} className='keen-slider'>
          <Box className='keen-slider__slide'>
            <img src='/images/banners/banner-1.jpg' alt='swiper 1' />
          </Box>
          <Box className='keen-slider__slide'>
            <img src='/images/banners/banner-2.jpg' alt='swiper 2' />
          </Box>
          <Box className='keen-slider__slide'>
            <img src='/images/banners/banner-3.jpg' alt='swiper 3' />
          </Box>
          <Box className='keen-slider__slide'>
            <img src='/images/banners/banner-4.jpg' alt='swiper 4' />
          </Box>
          <Box className='keen-slider__slide'>
            <img src='/images/banners/banner-5.jpg' alt='swiper 5' />
          </Box>
        </Box>
        {loaded && instanceRef.current && (
          <>
            <ChevronLeft
              className={clsx('arrow arrow-left', {
                'arrow-disabled': currentSlide === 0
              })}
              onClick={e => e.stopPropagation() || instanceRef.current?.prev()}
            />

            <ChevronRight
              className={clsx('arrow arrow-right', {
                'arrow-disabled': currentSlide === instanceRef.current.track.details.slides.length - 1
              })}
              onClick={e => e.stopPropagation() || instanceRef.current?.next()}
            />
          </>
        )}
      </Box>
      {loaded && instanceRef.current && (
        <Box className='swiper-dots'>
          {[...Array(instanceRef.current.track.details.slides.length).keys()].map(idx => {
            return (
              <Badge
                key={idx}
                variant='dot'
                component='div'
                className={clsx({
                  active: currentSlide === idx
                })}
                onClick={() => {
                  instanceRef.current?.moveToIdx(idx)
                }}
              ></Badge>
            )
          })}
        </Box>
      )}
    </>
  )
}

export default SwiperControls
`}</code>
  </pre>
)

export const SwiperDefaultJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Components
import { useKeenSlider } from 'keen-slider/react'

const SwiperDefault = ({ direction }) => {
  // ** Hook
  const [ref] = useKeenSlider({
    rtl: direction === 'rtl'
  })

  return (
    <Box ref={ref} className='keen-slider'>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-1.jpg' alt='swiper 1' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-2.jpg' alt='swiper 2' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-3.jpg' alt='swiper 3' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-4.jpg' alt='swiper 4' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-5.jpg' alt='swiper 5' />
      </Box>
    </Box>
  )
}

export default SwiperDefault
`}</code>
  </pre>
)

export const SwiperFreeModeJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Components
import { useKeenSlider } from 'keen-slider/react'

const SwiperFreeMode = ({ direction }) => {
  // ** Hook
  const [ref] = useKeenSlider({
    loop: true,
    mode: 'free',
    rtl: direction === 'rtl',
    slides: {
      perView: 2,
      spacing: 16
    }
  })

  return (
    <Box ref={ref} className='keen-slider'>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-21.jpg' alt='swiper 21' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-22.jpg' alt='swiper 22' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-23.jpg' alt='swiper 23' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-24.jpg' alt='swiper 24' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-25.jpg' alt='swiper 25' />
      </Box>
    </Box>
  )
}

export default SwiperFreeMode
`}</code>
  </pre>
)

export const SwiperFaderJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Components
import { useKeenSlider } from 'keen-slider/react'

const images = [
  '/images/banners/banner-9.jpg',
  '/images/banners/banner-7.jpg',
  '/images/banners/banner-6.jpg',
  '/images/banners/banner-10.jpg',
  '/images/banners/banner-8.jpg'
]

const SwiperFader = ({ direction }) => {
  const [opacities, setOpacities] = useState([])

  // ** Hook
  const [sliderRef] = useKeenSlider({
    slides: images.length,
    rtl: direction === 'rtl',
    detailsChanged(s) {
      const new_opacities = s.track.details.slides.map(slide => slide.portion)
      setOpacities(new_opacities)
    }
  })

  return (
    <Box ref={sliderRef} className='fader' sx={{ height: [200, 250, 395] }}>
      {images.map((src, idx) => (
        <Box key={idx} className='fader__slide' sx={{ opacity: opacities[idx] }}>
          <img src={src} alt={slider {idx}} />
        </Box>
      ))}
    </Box>
  )
}

export default SwiperFader
`}</code>
  </pre>
)

export const SwiperMutationObserverJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'

// ** Third Party Components
import { useKeenSlider } from 'keen-slider/react'

const MutationPlugin = slider => {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(() => {
      slider.update()
    })
  })
  const config = { childList: true }
  slider.on('created', () => {
    observer.observe(slider.container, config)
  })
  slider.on('destroyed', () => {
    observer.disconnect()
  })
}

const SwiperMutationObserver = ({ direction }) => {
  // ** States
  const [slides, setSlides] = useState([1])

  // ** Hooks
  const theme = useTheme()

  const [ref] = useKeenSlider(
    {
      rtl: direction === 'rtl',
      slides: {
        perView: 3,
        spacing: 16
      },
      breakpoints: {
        [(max-width: {theme.breakpoints.values.sm}px)]: {
          slides: { perView: 1, spacing: 16 }
        }
      }
    },
    [MutationPlugin]
  )

  return (
    <>
      <Box ref={ref} className='keen-slider'>
        {slides.map(slide => {
          return (
            <Box key={slide} className='keen-slider__slide default-slide'>
              <Typography variant='h1'>{slide}</Typography>
            </Box>
          )
        })}
      </Box>
      <Box sx={{ mt: 4 }} className='demo-space-x'>
        <Button variant='contained' onClick={() => setSlides([...slides, slides.length + 1])}>
          Add
        </Button>
        <Button variant='contained' color='error' onClick={() => setSlides(slides.slice(0, -1))}>
          Remove
        </Button>
      </Box>
    </>
  )
}

export default SwiperMutationObserver
`}</code>
  </pre>
)

export const SwiperLoopJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Components
import { useKeenSlider } from 'keen-slider/react'

const SwiperLoop = ({ direction }) => {
  // ** Hook
  const [ref] = useKeenSlider({
    loop: true,
    rtl: direction === 'rtl'
  })

  return (
    <Box ref={ref} className='keen-slider'>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-7.jpg' alt='swiper 7' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-8.jpg' alt='swiper 8' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-9.jpg' alt='swiper 9' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-10.jpg' alt='swiper 10' />
      </Box>
    </Box>
  )
}

export default SwiperLoop
`}</code>
  </pre>
)

export const SwiperMultipleSlidesJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Components
import { useKeenSlider } from 'keen-slider/react'

const SwiperMultipleSlides = ({ direction }) => {
  // ** Hook
  const [ref] = useKeenSlider({
    rtl: direction === 'rtl',
    slides: {
      perView: 2
    }
  })

  return (
    <Box ref={ref} className='keen-slider'>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-11.jpg' alt='swiper 11' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-12.jpg' alt='swiper 12' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-13.jpg' alt='swiper 13' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-14.jpg' alt='swiper 14' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-15.jpg' alt='swiper 15' />
      </Box>
    </Box>
  )
}

export default SwiperMultipleSlides
`}</code>
  </pre>
)

export const SwiperThumbnailsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material/styles'

// ** Third Party Components
import { useKeenSlider } from 'keen-slider/react'

const ThumbnailPlugin = mainRef => {
  return slider => {
    function removeActive() {
      slider.slides.forEach(slide => {
        slide.classList.remove('active')
      })
    }
    function addActive(idx) {
      slider.slides[idx].classList.add('active')
    }
    function addClickEvents() {
      slider.slides.forEach((slide, idx) => {
        slide.addEventListener('click', () => {
          if (mainRef.current) mainRef.current.moveToIdx(idx)
        })
      })
    }
    slider.on('created', () => {
      if (!mainRef.current) return
      addActive(slider.track.details.rel)
      addClickEvents()
      mainRef.current.on('animationStarted', main => {
        removeActive()
        const next = main.animator.targetIdx || 0
        addActive(main.track.absToRel(next))
        slider.moveToIdx(next)
      })
    })
  }
}

const SwiperThumbnails = ({ direction }) => {
  // ** Hooks
  const theme = useTheme()

  const [sliderRef, instanceRef] = useKeenSlider({
    rtl: direction === 'rtl'
  })

  const [thumbnailRef] = useKeenSlider(
    {
      rtl: direction === 'rtl',
      slides: {
        perView: 4,
        spacing: 8
      },
      breakpoints: {
        [(max-width: {theme.breakpoints.values.sm}px)]: {
          slides: {
            perView: 3,
            spacing: 8
          }
        }
      }
    },
    [ThumbnailPlugin(instanceRef)]
  )

  return (
    <>
      <Box ref={sliderRef} className='keen-slider'>
        <Box className='keen-slider__slide'>
          <img src='/images/banners/banner-1.jpg' alt='swiper 1' />
        </Box>
        <Box className='keen-slider__slide'>
          <img src='/images/banners/banner-2.jpg' alt='swiper 2' />
        </Box>
        <Box className='keen-slider__slide'>
          <img src='/images/banners/banner-3.jpg' alt='swiper 3' />
        </Box>
        <Box className='keen-slider__slide'>
          <img src='/images/banners/banner-4.jpg' alt='swiper 4' />
        </Box>
        <Box className='keen-slider__slide'>
          <img src='/images/banners/banner-5.jpg' alt='swiper 5' />
        </Box>
      </Box>

      <Box sx={{ mt: 2 }} ref={thumbnailRef} className='keen-slider thumbnail'>
        <Box className='keen-slider__slide'>
          <img src='/images/banners/banner-1.jpg' alt='swiper 1' />
        </Box>
        <Box className='keen-slider__slide'>
          <img src='/images/banners/banner-2.jpg' alt='swiper 2' />
        </Box>
        <Box className='keen-slider__slide'>
          <img src='/images/banners/banner-3.jpg' alt='swiper 3' />
        </Box>
        <Box className='keen-slider__slide'>
          <img src='/images/banners/banner-4.jpg' alt='swiper 4' />
        </Box>
        <Box className='keen-slider__slide'>
          <img src='/images/banners/banner-5.jpg' alt='swiper 5' />
        </Box>
      </Box>
    </>
  )
}

export default SwiperThumbnails
`}</code>
  </pre>
)

export const SwiperSpacingJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Components
import { useKeenSlider } from 'keen-slider/react'

const SwiperSpacing = ({ direction }) => {
  // ** Hook
  const [ref] = useKeenSlider({
    rtl: direction === 'rtl',
    slides: {
      perView: 2,
      spacing: 16
    }
  })

  return (
    <Box ref={ref} className='keen-slider'>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-16.jpg' alt='swiper 16' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-17.jpg' alt='swiper 17' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-18.jpg' alt='swiper 18' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-19.jpg' alt='swiper 19' />
      </Box>
      <Box className='keen-slider__slide'>
        <img src='/images/banners/banner-20.jpg' alt='swiper 20' />
      </Box>
    </Box>
  )
}

export default SwiperSpacing
`}</code>
  </pre>
)

export const SwiperZoomJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Components
import { useKeenSlider } from 'keen-slider/react'

const images = [
  '/images/banners/banner-6.jpg',
  '/images/banners/banner-7.jpg',
  '/images/banners/banner-8.jpg',
  '/images/banners/banner-9.jpg',
  '/images/banners/banner-10.jpg'
]

const SwiperZoom = ({ direction }) => {
  // ** State
  const [details, setDetails] = useState(null)

  // ** Hook
  const [sliderRef] = useKeenSlider({
    initial: 2,
    rtl: direction === 'rtl',
    detailsChanged(s) {
      setDetails(s.track.details)
    }
  })

  const scaleStyle = idx => {
    if (!details) return {}
    const slide = details.slides[idx]
    const scale_size = 1
    const scale = 1 - (scale_size - scale_size * slide.portion)

    return {
      transform: scale({scale}),
      WebkitTransform: scale({scale})
    }
  }

  return (
    <Box ref={sliderRef} className='keen-slider zoom-out' sx={{ height: [200, 250, 395] }}>
      {images.map((src, idx) => (
        <Box key={idx} className='keen-slider__slide zoom-out__slide'>
          <Box className='slider-content-wrapper' sx={{ ...scaleStyle(idx) }}>
            <img src={src} alt={slider {idx}} />
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default SwiperZoom
`}</code>
  </pre>
)

export const SwiperVerticalJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Box from '@mui/material/Box'

// ** Third Party Components
import { useKeenSlider } from 'keen-slider/react'

const SwiperVertical = () => {
  // ** Hook
  const [ref] = useKeenSlider({
    vertical: true,
    slides: {
      perView: 2,
      spacing: 8
    }
  })

  return (
    <Box ref={ref} className='keen-slider vertical' sx={{ maxHeight: 300 }}>
      {[...Array(10).keys()].map(num => (
        <Box key={num} className='keen-slider__slide default-slide'>
          {num + 1}
        </Box>
      ))}
    </Box>
  )
}

export default SwiperVertical
`}</code>
  </pre>
)
