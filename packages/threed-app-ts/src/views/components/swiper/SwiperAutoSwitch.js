// ** MUI Imports
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
