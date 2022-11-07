// ** MUI Imports
import Select from '@mui/material/Select'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'

const SelectNative = () => {
  return (
    <div className='demo-space-x'>
      <FormControl>
        <InputLabel htmlFor='outlined-age-native-simple'>Age</InputLabel>
        <Select
          native
          label='Age'
          defaultValue=''
          inputProps={{
            name: 'age',
            id: 'outlined-age-native-simple'
          }}
        >
          <option aria-label='None' value='' />
          <option value={10}>Ten</option>
          <option value={20}>Twenty</option>
          <option value={30}>Thirty</option>
        </Select>
      </FormControl>
      <FormControl variant='filled'>
        <InputLabel htmlFor='filled-age-native-simple'>Age</InputLabel>
        <Select
          native
          label='Age'
          defaultValue=''
          inputProps={{
            name: 'age',
            id: 'filled-age-native-simple'
          }}
        >
          <option aria-label='None' value='' />
          <option value={10}>Ten</option>
          <option value={20}>Twenty</option>
          <option value={30}>Thirty</option>
        </Select>
      </FormControl>
      <FormControl variant='standard'>
        <InputLabel htmlFor='age-native-simple'>Age</InputLabel>
        <Select
          native
          label='Age'
          defaultValue=''
          inputProps={{
            name: 'age',
            id: 'age-native-simple'
          }}
        >
          <option aria-label='None' value='' />
          <option value={10}>Ten</option>
          <option value={20}>Twenty</option>
          <option value={30}>Thirty</option>
        </Select>
      </FormControl>
    </div>
  )
}

export default SelectNative
