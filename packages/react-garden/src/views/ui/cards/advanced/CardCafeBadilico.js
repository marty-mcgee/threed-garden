// ** MUI Import
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Rating from '@mui/material/Rating'
import Divider from '@mui/material/Divider'
import CardMedia from '@mui/material/CardMedia'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'

// ** Icons Imports
import DotsVertical from 'mdi-material-ui/DotsVertical'

const CardCafe = () => {
  return (
    <Card>
      <CardMedia sx={{ height: 168 }} image='/images/cards/cafe-badilico.png' />
      <CardContent>
        <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='h6'>Cafe Badilico</Typography>
          <IconButton size='small' aria-label='settings' className='card-more-options' sx={{ color: 'text.secondary' }}>
            <DotsVertical />
          </IconButton>
        </Box>

        <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
          <Rating readOnly sx={{ mr: 2.5 }} value={4.6} precision={0.1} name='cafe-ratings' />
          <Typography>4.6 Star (12.4k)</Typography>
        </Box>

        <Typography variant='body2' sx={{ mb: 4 }}>
          Italian Cafe
        </Typography>

        <Typography variant='body2'>
          The refrigerated dairy aisle of your local grocery store can be a great source tasty, convenient selections
          for your.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography sx={{ mb: 4 }}>Tonight’s availability</Typography>

        <Chip
          size='small'
          label='5:30PM'
          sx={{ mr: 4, height: 32, fontSize: '0.875rem', color: 'text.secondary', '& .MuiChip-label': { px: 2.5 } }}
        />
        <Chip
          size='small'
          label='7:00AM'
          sx={{ mr: 4, height: 32, fontSize: '0.875rem', color: 'text.secondary', '& .MuiChip-label': { px: 2.5 } }}
        />
        <Chip
          size='small'
          label='7:15PM'
          sx={{ height: 32, fontSize: '0.875rem', color: 'text.secondary', '& .MuiChip-label': { px: 2.5 } }}
        />
      </CardContent>

      <CardActions className='card-action-dense'>
        <Button>Book Now</Button>
      </CardActions>
    </Card>
  )
}

export default CardCafe
