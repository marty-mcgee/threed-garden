export const SelectControlledUncontrolledJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'

const SelectControlledUncontrolled = () => {
  // ** State
  const [value, setValue] = useState('')

  const handleChange = event => {
    setValue(event.target.value)
  }

  return (
    <div className='demo-space-x'>
      <FormControl>
        <InputLabel id='controlled-select-label'>Controlled</InputLabel>
        <Select
          value={value}
          label='Controlled'
          id='controlled-select'
          onChange={handleChange}
          labelId='controlled-select-label'
        >
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
      </FormControl>
      <FormControl>
        <InputLabel id='uncontrolled-select-label'>Uncontrolled</InputLabel>
        <Select defaultValue='' label='Uncontrolled' id='uncontrolled-select' labelId='uncontrolled-select-label'>
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
      </FormControl>
    </div>
  )
}

export default SelectControlledUncontrolled
`}</code>
  </pre>
)

export const SelectCustomizedJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import InputBase from '@mui/material/InputBase'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MuiFormControl from '@mui/material/FormControl'

// Styled FormControl component
const FormControl = styled(MuiFormControl)(({ theme }) => ({
  '& .MuiFormLabel-root.Mui-focused': {
    color: theme.palette.info.main
  },
  '& .MuiInputLabel-root': {
    left: -14,
    zIndex: 0
  },
  '& > .MuiInputBase-root': {
    marginTop: theme.spacing(4),
    '&.MuiInput-root:before, &.MuiInput-root:after': {
      border: 0
    }
  },
  '& .MuiInputBase-input': {
    fontSize: 16,
    borderRadius: 4,
    position: 'relative',
    padding: '10px 26px 10px 12px',
    backgroundColor: theme.palette.background.paper,
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    border: theme.palette.mode === 'light' ? '1px solid #ced4da' : 1px solid {theme.palette.divider},
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(','),
    '&:focus': {
      borderRadius: 4,
      borderColor: '#80bdff',
      boxShadow: '0 0 0 0.2rem rgba(0,123,255,0.25)'
    }
  }
}))

const SelectCustomized = () => {
  // ** State
  const [value, setValue] = useState('')

  const handleChange = event => {
    setValue(event.target.value)
  }

  return (
    <div className='demo-space-x'>
      <FormControl>
        <InputLabel id='demo-customized-select-label'>Age</InputLabel>
        <Select
          value={value}
          input={<InputBase />}
          onChange={handleChange}
          id='demo-customized-select'
          labelId='demo-customized-select-label'
        >
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          <MenuItem value={10}>Ten</MenuItem>
          <MenuItem value={20}>Twenty</MenuItem>
          <MenuItem value={30}>Thirty</MenuItem>
        </Select>
      </FormControl>
      <FormControl>
        <InputLabel htmlFor='demo-customized-select-native'>Age</InputLabel>
        <Select native input={<InputBase />} id='demo-customized-select-native' value={value} onChange={handleChange}>
          <option aria-label='None' value='' />
          <option value={10}>Ten</option>
          <option value={20}>Twenty</option>
          <option value={30}>Thirty</option>
        </Select>
      </FormControl>
    </div>
  )
}

export default SelectCustomized
`}</code>
  </pre>
)

export const SelectGroupingJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)

export const SelectMultipleJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import Typography from '@mui/material/Typography'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import ListItemText from '@mui/material/ListItemText'
import Select from '@mui/material/Select'

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8

const MenuProps = {
  PaperProps: {
    style: {
      width: 250,
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP
    }
  }
}

const names = [
  'Oliver Hansen',
  'Van Henry',
  'April Tucker',
  'Ralph Hubbard',
  'Omar Alexander',
  'Carlos Abbott',
  'Miriam Wagner',
  'Bradley Wilkerson',
  'Virginia Andrews',
  'Kelly Snyder'
]

const SelectMultiple = () => {
  // ** State
  const [personName, setPersonName] = useState([])
  const [personNameNative, setPersonNameNative] = useState([])

  const handleChange = event => {
    setPersonName(event.target.value)
  }

  const handleChangeMultipleNative = event => {
    const { options } = event.target
    const value = []
    for (let i = 0, l = options.length; i < l; i += 1) {
      if (options[i].selected) {
        value.push(options[i].value)
      }
    }
    setPersonNameNative(value)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', '& > *': { mt: 4, maxWidth: 500 } }}>
      <div>
        <Typography sx={{ mb: 2, fontWeight: 500 }}>Default</Typography>
        <FormControl fullWidth>
          <InputLabel id='demo-multiple-name-label'>Name</InputLabel>
          <Select
            multiple
            label='Name'
            value={personName}
            MenuProps={MenuProps}
            id='demo-multiple-name'
            onChange={handleChange}
            labelId='demo-multiple-name-label'
          >
            {names.map(name => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      <div>
        <Typography sx={{ mb: 2, fontWeight: 500 }}>Checkmarks</Typography>
        <FormControl fullWidth>
          <InputLabel id='demo-multiple-checkbox-label'>Tag</InputLabel>
          <Select
            multiple
            label='Tag'
            value={personName}
            MenuProps={MenuProps}
            onChange={handleChange}
            id='demo-multiple-checkbox'
            labelId='demo-multiple-checkbox-label'
            renderValue={selected => selected.join(', ')}
          >
            {names.map(name => (
              <MenuItem key={name} value={name}>
                <Checkbox checked={personName.indexOf(name) > -1} />
                <ListItemText primary={name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      <div>
        <Typography sx={{ mb: 2, fontWeight: 500 }}>Chip</Typography>
        <FormControl fullWidth>
          <InputLabel id='demo-multiple-chip-label'>Chip</InputLabel>
          <Select
            multiple
            label='Chip'
            value={personName}
            MenuProps={MenuProps}
            id='demo-multiple-chip'
            onChange={handleChange}
            labelId='demo-multiple-chip-label'
            renderValue={selected => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {selected.map(value => (
                  <Chip key={value} label={value} sx={{ m: 0.75 }} />
                ))}
              </Box>
            )}
          >
            {names.map(name => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      <div>
        <Typography sx={{ mb: 2, fontWeight: 500 }}>Placeholder</Typography>
        <FormControl fullWidth>
          <Select
            multiple
            displayEmpty
            value={personName}
            MenuProps={MenuProps}
            onChange={handleChange}
            inputProps={{ 'aria-label': 'Without label' }}
            renderValue={selected => {
              if (selected.length === 0) {
                return <em>Placeholder</em>
              }

              return selected.join(', ')
            }}
          >
            <MenuItem disabled value=''>
              <em>Placeholder</em>
            </MenuItem>
            {names.map(name => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      <div>
        <Typography sx={{ mb: 2, fontWeight: 500 }}>Native</Typography>
        <FormControl fullWidth>
          <InputLabel shrink htmlFor='select-multiple-native'>
            Native
          </InputLabel>
          <Select
            native
            multiple
            label='Native'
            value={personNameNative} // @ts-ignore
            onChange={handleChangeMultipleNative}
            inputProps={{ id: 'select-multiple-native' }}
          >
            {names.map(name => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </FormControl>
      </div>
    </Box>
  )
}

export default SelectMultiple
`}</code>
  </pre>
)

export const SelectPropsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
          renderValue={value => ⚠️  - {value}}
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
`}</code>
  </pre>
)

export const SelectNativeJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)

export const SelectVariantsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
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
`}</code>
  </pre>
)

export const SelectWithDialogJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

const SelectWithDialog = () => {
  // ** State
  const [open, setOpen] = useState(false)

  const handleClickOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <div>
      <Button variant='outlined' onClick={handleClickOpen}>
        Open select dialog
      </Button>
      <Dialog maxWidth='xs' fullWidth open={open} onClose={handleClose}>
        <DialogTitle>Fill the form</DialogTitle>
        <DialogContent sx={{ pt: theme => {theme.spacing(2)} !important }}>
          <form>
            <FormControl sx={{ mr: 4 }}>
              <InputLabel id='demo-dialog-select-label'>Age</InputLabel>
              <Select label='Age' labelId='demo-dialog-select-label' id='demo-dialog-select' defaultValue=''>
                <MenuItem value=''>
                  <em>None</em>
                </MenuItem>
                <MenuItem value={10}>Ten</MenuItem>
                <MenuItem value={20}>Twenty</MenuItem>
                <MenuItem value={30}>Thirty</MenuItem>
              </Select>
            </FormControl>
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
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant='outlined'>
            Cancel
          </Button>
          <Button onClick={handleClose} variant='outlined'>
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default SelectWithDialog
`}</code>
  </pre>
)
