// ** MUI Imports
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
