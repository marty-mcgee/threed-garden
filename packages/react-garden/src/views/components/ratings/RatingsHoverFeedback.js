// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Rating from '@mui/material/Rating'
import Typography from '@mui/material/Typography'

const labels = {
  0.5: 'Useless',
  1: 'Useless+',
  1.5: 'Poor',
  2: 'Poor+',
  2.5: 'Ok',
  3: 'Ok+',
  3.5: 'Good',
  4: 'Good+',
  4.5: 'Excellent',
  5: 'Excellent+'
}

const RatingsHoverFeedback = () => {
  // ** States
  const [hover, setHover] = useState(-1)
  const [value, setValue] = useState(2)

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Rating
        value={value}
        sx={{ mr: 4 }}
        precision={0.5}
        name='hover-feedback'
        onChange={(event, newValue) => setValue(newValue)}
        onChangeActive={(event, newHover) => setHover(newHover)}
      />
      {value !== null && <Typography>{labels[hover !== -1 ? hover : value]}</Typography>}
    </Box>
  )
}

export default RatingsHoverFeedback
