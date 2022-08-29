// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'

const ChipsCustomized = () => {
  return (
    <div className='demo-space-x'>
      <CustomChip label='Primary' skin='light' color='primary' />
      <CustomChip label='Secondary' skin='light' color='secondary' />
      <CustomChip label='Success' skin='light' color='success' />
      <CustomChip label='Error' skin='light' color='error' />
      <CustomChip label='Warning' skin='light' color='warning' />
      <CustomChip label='Info' skin='light' color='info' />
    </div>
  )
}

export default ChipsCustomized
