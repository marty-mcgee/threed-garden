// ** MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Rating from '@mui/material/Rating'

// ** Icons Imports
import Star from 'mdi-material-ui/Star'
import Heart from 'mdi-material-ui/Heart'
import EmoticonOutline from 'mdi-material-ui/EmoticonOutline'
import EmoticonSadOutline from 'mdi-material-ui/EmoticonSadOutline'
import EmoticonHappyOutline from 'mdi-material-ui/EmoticonHappyOutline'
import EmoticonNeutralOutline from 'mdi-material-ui/EmoticonNeutralOutline'

const customIcons = {
  1: {
    label: 'Very Dissatisfied',
    icon: <EmoticonSadOutline />
  },
  2: {
    label: 'Neutral',
    icon: <EmoticonNeutralOutline />
  },
  3: {
    label: 'Satisfied',
    icon: <EmoticonHappyOutline />
  },
  4: {
    label: 'Very Satisfied',
    icon: <EmoticonOutline />
  }
}

const IconContainer = props => {
  const { value } = props

  return <span {...props}>{customIcons[value].icon}</span>
}

const RatingsCustomized = () => {
  return (
    <div>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 500 }}>Custom empty icon</Typography>
        <Rating name='customized-empty' defaultValue={2} precision={0.5} emptyIcon={<Star />} />
      </Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 500 }}>Custom icon and color</Typography>
        <Rating
          precision={0.5}
          icon={<Heart />}
          emptyIcon={null}
          defaultValue={3}
          name='customized-color'
          sx={{ color: 'error.main' }}
        />
      </Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontWeight: 500 }}>10 stars</Typography>
        <Rating name='customized-10' defaultValue={7} max={10} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 500 }}>Custom icon set</Typography>
        <Rating name='customized-icons' defaultValue={2} max={4} IconContainerComponent={IconContainer} />
      </Box>
    </div>
  )
}

export default RatingsCustomized
