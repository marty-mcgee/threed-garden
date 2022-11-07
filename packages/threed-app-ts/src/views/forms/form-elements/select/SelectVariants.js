// ** MUI Imports
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'

const SelectVariants = () => {
  return (
    <div className='demo-space-x'>
      <FormControl>
        <InputLabel id='demo-simple-select-outlined-label'>Age</InputLabel>
        <Select
          label='Age'
          defaultValue=''
          id='demo-simple-select-outlined'
          labelId='demo-simple-select-outlined-label'
        >
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
      </FormControl>
      <FormControl variant='filled'>
        <InputLabel id='demo-simple-select-filled-label'>Age</InputLabel>
        <Select label='Age' labelId='demo-simple-select-filled-label' id='demo-simple-select-filled' defaultValue=''>
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
      </FormControl>
      <FormControl variant='standard'>
        <InputLabel id='demo-simple-select-label'>Age</InputLabel>
        <Select label='Age' labelId='demo-simple-select-label' id='demo-simple-select' defaultValue=''>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
      </FormControl>
    </div>
  )
}

export default SelectVariants
