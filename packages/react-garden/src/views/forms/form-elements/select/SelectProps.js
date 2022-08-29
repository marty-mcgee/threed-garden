// ** MUI Imports
import Box from '@mui/material/Box'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'

const SelectProps = () => {
  return (
    <Box sx={{ '& > *': { mt: 6, mr: 6 } }}>
      <FormControl>
        <InputLabel id='demo-simple-select-helper-label'>Age</InputLabel>
        <Select label='Age' defaultValue='' id='demo-simple-select-helper' labelId='demo-simple-select-helper-label'>
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
        <FormHelperText>With label + helper text</FormHelperText>
      </FormControl>
      <FormControl>
        <Select defaultValue='' displayEmpty inputProps={{ 'aria-label': 'Without label' }}>
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
        <FormHelperText>Without label</FormHelperText>
      </FormControl>
      <FormControl>
        <InputLabel id='demo-simple-select-autoWidth-label'>Age</InputLabel>
        <Select
          autoWidth
          label='Age'
          defaultValue=''
          id='demo-simple-select-autoWidth'
          labelId='demo-simple-select-autoWidth-label'
        >
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
        <FormHelperText>Auto width</FormHelperText>
      </FormControl>
      <FormControl disabled>
        <InputLabel id='demo-simple-select-disabled-label'>Age</InputLabel>
        <Select
          label='Age'
          defaultValue=''
          id='demo-simple-select-disabled'
          labelId='demo-simple-select-disabled-label'
        >
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
        <FormHelperText>Disabled</FormHelperText>
      </FormControl>
      <FormControl error>
        <InputLabel id='demo-simple-select-error-label'>Age</InputLabel>
        <Select
          label='Age'
          defaultValue=''
          id='demo-simple-select-error'
          renderValue={value => `⚠️  - ${value}`}
          labelId='demo-simple-select-error-label'
        >
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
        <FormHelperText>Error</FormHelperText>
      </FormControl>
      <FormControl>
        <InputLabel id='demo-simple-select-readonly-label'>Age</InputLabel>
        <Select
          label='Age'
          defaultValue=''
          inputProps={{ readOnly: true }}
          id='demo-simple-select-readonly'
          labelId='demo-simple-select-readonly-label'
        >
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
        <FormHelperText>Read only</FormHelperText>
      </FormControl>
      <FormControl required>
        <InputLabel id='demo-simple-select-required-label'>Age</InputLabel>
        <Select
          label='Age *'
          defaultValue=''
          id='demo-simple-select-required'
          labelId='demo-simple-select-required-label'
        >
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
        <FormHelperText>Required</FormHelperText>
      </FormControl>
    </Box>
  )
}

export default SelectProps
