// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Typography from '@mui/material/Typography'

// ** Icons Imports
import Phone from 'mdi-material-ui/Phone'
import HeartOutline from 'mdi-material-ui/HeartOutline'
import ThumbUpOutline from 'mdi-material-ui/ThumbUpOutline'
import ThumbDownOutline from 'mdi-material-ui/ThumbDownOutline'
import AccountCircleOutline from 'mdi-material-ui/AccountCircleOutline'

const TabsForcedScroll = () => {
  // ** State
  const [value, setValue] = useState('1')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  return (
    <TabContext value={value}>
      <TabList scrollButtons variant='scrollable' onChange={handleChange} aria-label='forced scroll tabs example'>
        <Tab value='1' label='Tab 1' icon={<Phone />} />
        <Tab value='2' label='Tab 2' icon={<HeartOutline />} />
        <Tab value='3' label='Tab 3' icon={<ThumbUpOutline />} />
        <Tab value='4' label='Tab 4' icon={<AccountCircleOutline />} />
        <Tab value='5' label='Tab 5' icon={<ThumbDownOutline />} />
      </TabList>
      <TabPanel value='1'>
        <Typography>
          Cake apple pie chupa chups biscuit liquorice tootsie roll liquorice sugar plum. Cotton candy wafer wafer jelly
          cake caramels brownie gummies.
        </Typography>
      </TabPanel>
      <TabPanel value='2'>
        <Typography>
          Chocolate bar carrot cake candy canes sesame snaps. Cupcake pie gummi bears jujubes candy canes. Chupa chups
          sesame snaps halvah.
        </Typography>
      </TabPanel>
      <TabPanel value='3'>
        <Typography>
          Danish tiramisu jujubes cupcake chocolate bar cake cheesecake chupa chups. Macaroon ice cream tootsie roll
          carrot cake gummi bears.
        </Typography>
      </TabPanel>
      <TabPanel value='4'>
        <Typography>
          Cake apple pie chupa chups biscuit liquorice tootsie roll liquorice sugar plum. Cotton candy wafer wafer jelly
          cake caramels brownie gummies.
        </Typography>
      </TabPanel>
      <TabPanel value='5'>
        <Typography>
          Chocolate bar carrot cake candy canes sesame snaps. Cupcake pie gummi bears jujubes candy canes. Chupa chups
          sesame snaps halvah.
        </Typography>
      </TabPanel>
    </TabContext>
  )
}

export default TabsForcedScroll
