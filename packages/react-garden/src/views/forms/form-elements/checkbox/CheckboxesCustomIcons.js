// ** MUI Imports
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

// ** Icons Imports
import Star from 'mdi-material-ui/Star'
import Heart from 'mdi-material-ui/Heart'
import StarOutline from 'mdi-material-ui/StarOutline'
import HeartOutline from 'mdi-material-ui/HeartOutline'

const CheckboxesCustomIcons = () => {
  return (
    <FormGroup row>
      <FormControlLabel
        label='Heart'
        control={<Checkbox defaultChecked name='size-small' icon={<HeartOutline />} checkedIcon={<Heart />} />}
      />
      <FormControlLabel
        label='Star'
        control={<Checkbox defaultChecked name='size-small' icon={<StarOutline />} checkedIcon={<Star />} />}
      />
    </FormGroup>
  )
}

export default CheckboxesCustomIcons
