// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Radio from '@mui/material/Radio'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

// ** Icons Imports
import LicenseIcon from 'mdi-material-ui/LicenseIcon'
import CartOutline from 'mdi-material-ui/CartOutline'
import BriefcaseOutline from 'mdi-material-ui/BriefcaseOutline'

// ** Custom Avatar Component
import CustomAvatar from 'src/@core/components/mui/avatar'

const TabDetails = () => {
  const [value, setValue] = useState('ecommerce')

  const handleChange = event => {
    setValue(event.target.value)
  }

  return (
    <Box>
      <TextField fullWidth sx={{ mb: 4 }} label='Application Name' placeholder='Materio Admin' />
      <Typography variant='h6' sx={{ mb: 4 }}>
        Category
      </Typography>
      <Box sx={{ mb: 8 }}>
        <Box
          onClick={() => setValue('crm')}
          sx={{ mb: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CustomAvatar skin='light' color='info' variant='rounded' sx={{ mr: 3, width: 48, height: 48 }}>
              <BriefcaseOutline />
            </CustomAvatar>
            <Box>
              <Typography>CRM Application</Typography>
              <Typography variant='caption'>Scales with any business</Typography>
            </Box>
          </Box>
          <Radio value='crm' onChange={handleChange} checked={value === 'crm'} />
        </Box>
        <Box
          onClick={() => setValue('ecommerce')}
          sx={{ mb: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CustomAvatar skin='light' color='success' variant='rounded' sx={{ mr: 3, width: 48, height: 48 }}>
              <CartOutline />
            </CustomAvatar>
            <Box>
              <Typography>Ecommerce Platforms</Typography>
              <Typography variant='caption'>Grow Your Business With App</Typography>
            </Box>
          </Box>
          <Radio value='ecommerce' onChange={handleChange} checked={value === 'ecommerce'} />
        </Box>
        <Box
          onClick={() => setValue('learning')}
          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CustomAvatar skin='light' color='error' variant='rounded' sx={{ mr: 3, width: 48, height: 48 }}>
              <LicenseIcon />
            </CustomAvatar>
            <Box>
              <Typography>Online Learning platform</Typography>
              <Typography variant='caption'>Start learning today</Typography>
            </Box>
          </Box>
          <Radio value='learning' onChange={handleChange} checked={value === 'learning'} />
        </Box>
      </Box>
    </Box>
  )
}

export default TabDetails
