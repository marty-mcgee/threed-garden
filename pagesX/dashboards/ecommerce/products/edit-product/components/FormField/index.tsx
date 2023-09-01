// ThreeD Garden components
import MDInput from '#/lib/mui/MDInput'
import MDBox from '#/lib/mui/MDBox'

// Declaring props types for FormField
interface Props {
  label: string
  [key: string]: any
}

function FormField({ label, ...rest }: Props): JSX.Element {
  return (
    <MDBox mb={2}>
      <MDInput
        {...rest}
        variant='standard'
        label={label}
        fullWidth
      />
    </MDBox>
  )
}

export default FormField
