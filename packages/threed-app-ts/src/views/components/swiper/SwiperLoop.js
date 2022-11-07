// ** MUI Imports
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
