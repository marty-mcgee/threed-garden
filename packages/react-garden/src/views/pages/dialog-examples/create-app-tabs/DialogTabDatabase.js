// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Radio from '@mui/material/Radio'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

// ** Icons Imports
import Aws from 'mdi-material-ui/Aws'
import Firebase from 'mdi-material-ui/Firebase'
import Database from 'mdi-material-ui/DatabaseOutline'

// ** Custom Avatar Component
import CustomAvatar from 'src/@core/components/mui/avatar'

const TabDatabase = () => {
  const [value, setValue] = useState('firebase')

  const handleChange = event => {
    setValue(event.target.value)
  }

  return (
    <Box>
      <TextField fullWidth sx={{ mb: 4 }} label='Database Name' placeholder='materio_database' />
      <Typography variant='h6' sx={{ mb: 4 }}>
        Select Database Engine
      </Typography>
      <Box sx={{ mb: 8 }}>
        <Box
          onClick={() => setValue('firebase')}
          sx={{ mb: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CustomAvatar skin='light' color='error' variant='rounded' sx={{ mr: 3, width: 48, height: 48 }}>
              <Firebase />
            </CustomAvatar>
            <Box>
              <Typography>Firebase</Typography>
              <Typography variant='caption'>Cloud Firestore</Typography>
            </Box>
          </Box>
          <Radio value='firebase' onChange={handleChange} checked={value === 'firebase'} />
        </Box>
        <Box
          onClick={() => setValue('aws')}
          sx={{ mb: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CustomAvatar skin='light' color='warning' variant='rounded' sx={{ mr: 3, width: 48, height: 48 }}>
              <Aws />
            </CustomAvatar>
            <Box>
              <Typography>AWS</Typography>
              <Typography variant='caption'>Amazon Fast NoSQL Database</Typography>
            </Box>
          </Box>
          <Radio value='aws' onChange={handleChange} checked={value === 'aws'} />
        </Box>
        <Box
          onClick={() => setValue('sql')}
          sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CustomAvatar skin='light' color='info' variant='rounded' sx={{ mr: 3, width: 48, height: 48 }}>
              <Database />
            </CustomAvatar>
            <Box>
              <Typography>MySQL</Typography>
              <Typography variant='caption'>Basic MySQL database</Typography>
            </Box>
          </Box>
          <Radio value='sql' onChange={handleChange} checked={value === 'sql'} />
        </Box>
      </Box>
    </Box>
  )
}

export default TabDatabase
