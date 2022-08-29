// ** MUI Imports
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'

// ** Icons Imports
import CheckboxMarked from 'mdi-material-ui/CheckboxMarked'
import CheckboxBlankOutline from 'mdi-material-ui/CheckboxBlankOutline'

const CheckboxesSizes = () => {
  return (
    <FormGroup row>
      <FormControlLabel
        label='Small'
        control={
          <Checkbox
            defaultChecked
            name='size-small'
            icon={<CheckboxBlankOutline fontSize='small' />}
            checkedIcon={<CheckboxMarked fontSize='small' />}
          />
        }
      />
      <FormControlLabel label='Default' control={<Checkbox defaultChecked name='size-default' />} />
    </FormGroup>
  )
}

export default CheckboxesSizes
