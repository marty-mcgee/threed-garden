// ThreeD Garden components
import MDInput from "~/components/MDInput"

function FormField({
  label,
  ...rest
}: {
  label: string
  [key: string]: any
}): JSX.Element {
  return <MDInput variant="standard" label={label} fullWidth {...rest} />
}

export default FormField
