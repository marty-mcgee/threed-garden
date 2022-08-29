// ** React Imports
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
      transform: `scale(${scale})`,
      WebkitTransform: `scale(${scale})`
    }
  }

  return (
    <Box ref={sliderRef} className='keen-slider zoom-out' sx={{ height: [200, 250, 395] }}>
      {images.map((src, idx) => (
        <Box key={idx} className='keen-slider__slide zoom-out__slide'>
          <Box className='slider-content-wrapper' sx={{ ...scaleStyle(idx) }}>
            <img src={src} alt={`slider ${idx}`} />
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default SwiperZoom
