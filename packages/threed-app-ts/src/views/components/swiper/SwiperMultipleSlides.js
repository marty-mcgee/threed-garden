// ** MUI Imports
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
