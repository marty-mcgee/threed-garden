// ** MUI Imports
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import ListSubheader from '@mui/material/ListSubheader'

const SelectGrouping = () => {
  return (
    <div className='demo-space-x'>
      <FormControl>
        <InputLabel htmlFor='grouped-select'>Grouping</InputLabel>
        <Select label='Grouping' defaultValue='' id='grouped-select'>
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          <ListSubheader>Category 1</ListSubheader>
          <MenuItem value={1}>Option 1</MenuItem>
          <MenuItem value={2}>Option 2</MenuItem>
          <ListSubheader>Category 2</ListSubheader>
          <MenuItem value={3}>Option 3</MenuItem>
          <MenuItem value={4}>Option 4</MenuItem>
        </Select>
      </FormControl>
      <FormControl>
        <InputLabel htmlFor='grouped-native-select'>Grouping</InputLabel>
        <Select native label='Grouping' defaultValue='' id='grouped-native-select'>
          <option aria-label='None' value='' />
          <optgroup label='Category 1'>
            <option value={1}>Option 1</option>
            <option value={2}>Option 2</option>
          </optgroup>
          <optgroup label='Category 2'>
            <option value={3}>Option 3</option>
            <option value={4}>Option 4</option>
          </optgroup>
        </Select>
      </FormControl>
    </div>
  )
}

export default SelectGrouping
