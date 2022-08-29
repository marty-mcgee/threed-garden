// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Radio from '@mui/material/Radio'
import Typography from '@mui/material/Typography'

// ** Icons Imports
import React from 'mdi-material-ui/React'
import Vuejs from 'mdi-material-ui/Vuejs'
import Angular from 'mdi-material-ui/Angular'
import Laravel from 'mdi-material-ui/Laravel'

// ** Custom Avatar Component
import CustomAvatar from 'src/@core/components/mui/avatar'

const TabFramework = () => {
  const [value, setValue] = useState('react')

  const handleChange = event => {
    setValue(event.target.value)
  }

  return (
    <Box>
      <Typography variant='h6' sx={{ mb: 4 }}>
        Select Framework
      </Typography>
      <Box sx={{ mb: 8 }}>
        <Box
          onClick={() => setValue('react')}
          sx={{ mb: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CustomAvatar skin='light' color='info' variant='rounded' sx={{ mr: 3, width: 48, height: 48 }}>
              <React />
            </CustomAvatar>
            <Box>
              <Typography>React Native</Typography>
              <Typography variant='caption'>Create truly native apps</Typography>
            </Box>
          </Box>
          <Radio value='react' onChange={handleChange} checked={value === 'react'} />
        </Box>

        <Box
          onClick={() => setValue('angular')}
          sx={{ mb: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CustomAvatar skin='light' color='error' variant='rounded' sx={{ mr: 3, width: 48, height: 48 }}>
              <Angular />
            </CustomAvatar>
            <Box>
              <Typography>Angular</Typography>
              <Typography variant='caption'>Most suited for your application</Typography>
            </Box>
          </Box>
          <Radio value='angular' onChange={handleChange} checked={value === 'angular'} />
        </Box>
        <Box
          onClick={() => setValue('vuejs')}
          sx={{ mb: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CustomAvatar skin='light' color='success' variant='rounded' sx={{ mr: 3, width: 48, height: 48 }}>
              <Vuejs />
            </CustomAvatar>
            <Box>
              <Typography>Vue</Typography>
              <Typography variant='caption'>Progressive Framework</Typography>
            </Box>
          </Box>
          <Radio value='vuejs' onChange={handleChange} checked={value === 'vuejs'} />
        </Box>
        <Box
          onClick={() => setValue('laravel')}
          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CustomAvatar skin='light' color='warning' variant='rounded' sx={{ mr: 3, width: 48, height: 48 }}>
              <Laravel />
            </CustomAvatar>
            <Box>
              <Typography>Laravel</Typography>
              <Typography variant='caption'>PHP web frameworks</Typography>
            </Box>
          </Box>
          <Radio value='laravel' onChange={handleChange} checked={value === 'laravel'} />
        </Box>
      </Box>
    </Box>
  )
}

export default TabFramework
