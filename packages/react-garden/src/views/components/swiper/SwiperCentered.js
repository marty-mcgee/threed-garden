// ** MUI Imports
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
