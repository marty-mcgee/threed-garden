// ** MUI Imports
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
