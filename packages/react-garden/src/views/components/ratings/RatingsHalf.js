// ** MUI Imports
import Box from '@mui/material/Box'
import Rating from '@mui/material/Rating'
import Typography from '@mui/material/Typography'

const RatingsHalf = () => {
  return (
    <div>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 500 }}>Half Ratings</Typography>
        <Rating defaultValue={2.5} precision={0.5} name='half-rating' />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 500 }}>Read only</Typography>
        <Rating readOnly defaultValue={2.5} precision={0.5} name='read-only' />
      </Box>
    </div>
  )
}

export default RatingsHalf
