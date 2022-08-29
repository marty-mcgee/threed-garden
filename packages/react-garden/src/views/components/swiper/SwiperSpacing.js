// ** MUI Imports
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
