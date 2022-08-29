// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Rating from '@mui/material/Rating'
import Typography from '@mui/material/Typography'

const RatingsBasic = () => {
  // ** State
  const [value, setValue] = useState(2)

  return (
    <div>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 500 }}>Controlled</Typography>
        <Rating value={value} name='simple-controlled' onChange={(event, newValue) => setValue(newValue)} />
      </Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 500 }}>Read only</Typography>
        <Rating readOnly value={value} name='read-only' />
      </Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 500 }}>Disabled</Typography>
        <Rating disabled value={value} name='disabled' />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 500 }}>No rating given</Typography>
        <Rating value={null} name='no-value' />
      </Box>
    </div>
  )
}

export default RatingsBasic
