// ** MUI Imports
import Switch from '@mui/material/Switch'

const SwitchesStandalone = () => {
  return (
    <div>
      <Switch defaultChecked />
      <Switch />
      <Switch disabled defaultChecked />
      <Switch disabled />
    </div>
  )
}

export default SwitchesStandalone
