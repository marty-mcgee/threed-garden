// ThreeD Garden components
import MDInput from '#/lib/mui/MDInput'

// Declaring props types for FormField
interface Props {
  label: string
  [key: string]: any
}

function FormField({ label, ...rest }: Props): JSX.Element {
  return (
    <MDInput
      {...rest}
      label={label}
      variant='standard'
      fullWidth
    />
  )
}

export default FormField
