// Company Juice Dashboard components
import MDInput from "components/MDInput"

// Declaring props types for FormField
interface Props {
  label?: string
  [key: string]: any
}

function FormField({ label, ...rest }: Props): JSX.Element {
  return (
    <MDInput
      variant="standard"
      label={label}
      fullWidth
      InputLabelProps={{ shrink: true }}
      {...rest}
    />
  )
}

// Declaring default props for FormField
FormField.defaultProps = {
  label: " ",
}

export default FormField
