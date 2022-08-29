// ** React Imports
import { forwardRef } from 'react'

// ** MUI Imports
import TextField from '@mui/material/TextField'

const PickersComponent = forwardRef(({ ...props }, ref) => {
  // ** Props
  const { label, readOnly } = props

  return (
    <TextField inputRef={ref} {...props} label={label || ''} {...(readOnly && { inputProps: { readOnly: true } })} />
  )
})

export default PickersComponent
