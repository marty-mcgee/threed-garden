export const TabsColorJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Typography from '@mui/material/Typography'

const TabsColor = () => {
  // ** State
  const [value, setValue] = useState('1')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  return (
    <TabContext value={value}>
      <TabList
        textColor='secondary'
        onChange={handleChange}
        indicatorColor='secondary'
        aria-label='secondary tabs example'
      >
        <Tab value='1' label='Tab 1' />
        <Tab value='2' label='Tab 2' />
        <Tab disabled value='3' label='Disabled' />
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
    </TabContext>
  )
}

export default TabsColor
`}</code>
  </pre>
)

export const TabsCenteredJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Typography from '@mui/material/Typography'

const TabsCentered = () => {
  // ** State
  const [value, setValue] = useState('1')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  return (
    <TabContext value={value}>
      <TabList centered onChange={handleChange} aria-label='centered tabs example'>
        <Tab value='1' label='Tab 1' />
        <Tab value='2' label='Tab 2' />
        <Tab value='3' label='Tab 3' />
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
    </TabContext>
  )
}

export default TabsCentered
`}</code>
  </pre>
)

export const TabsCustomizedVerticalJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import MuiTabList from '@mui/lab/TabList'

// Styled TabList component
const TabList = styled(MuiTabList)(({ theme }) => ({
  border: 0,
  '& .MuiTabs-indicator': {
    backgroundColor: 'transparent'
  },
  '& .Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: {theme.palette.common.white} !important
  },
  '& .MuiTab-root': {
    minHeight: 38,
    minWidth: 130,
    margin: theme.spacing(1, 0),
    borderRadius: theme.shape.borderRadius
  }
}))

const TabsCustomizedVertical = () => {
  // ** State
  const [value, setValue] = useState('1')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  return (
    <TabContext value={value}>
      <Box sx={{ display: 'flex' }}>
        <TabList orientation='vertical' onChange={handleChange} aria-label='customized vertical tabs example'>
          <Tab value='1' label='Tab 1' />
          <Tab value='2' label='Tab 2' />
          <Tab value='3' label='Tab 3' />
        </TabList>
        <TabPanel value='1'>
          <Typography>
            Cake apple pie chupa chups biscuit liquorice tootsie roll liquorice sugar plum. Cotton candy wafer wafer
            jelly cake caramels brownie gummies.
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
      </Box>
    </TabContext>
  )
}

export default TabsCustomizedVertical
`}</code>
  </pre>
)

export const TabsCustomizedJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import MuiTabList from '@mui/lab/TabList'

// Styled TabList component
const TabList = styled(MuiTabList)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: 'transparent'
  },
  '& .Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: {theme.palette.common.white} !important
  },
  '& .MuiTab-root': {
    minHeight: 38,
    minWidth: 130,
    borderRadius: theme.shape.borderRadius
  }
}))

const TabsCustomized = () => {
  // ** State
  const [value, setValue] = useState('1')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  return (
    <TabContext value={value}>
      <TabList onChange={handleChange} aria-label='customized tabs example'>
        <Tab value='1' label='Tab 1' />
        <Tab value='2' label='Tab 2' />
        <Tab value='3' label='Tab 3' />
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
    </TabContext>
  )
}

export default TabsCustomized
`}</code>
  </pre>
)

export const TabsFullWidthJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Typography from '@mui/material/Typography'

const TabsFullWidth = () => {
  // ** State
  const [value, setValue] = useState('1')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  return (
    <TabContext value={value}>
      <TabList variant='fullWidth' onChange={handleChange} aria-label='full width tabs example'>
        <Tab value='1' label='Tab 1' />
        <Tab value='2' label='Tab 2' />
        <Tab value='3' label='Tab 3' />
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
    </TabContext>
  )
}

export default TabsFullWidth
`}</code>
  </pre>
)

export const TabsForcedScrollJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
`}</code>
  </pre>
)

export const TabsNavJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Typography from '@mui/material/Typography'

const TabsNav = () => {
  // ** State
  const [value, setValue] = useState('1')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  return (
    <TabContext value={value}>
      <TabList onChange={handleChange} aria-label='nav tabs example'>
        <Tab value='1' component='a' label='Tab 1' href='/drafts' onClick={e => e.preventDefault()} />
        <Tab value='2' component='a' label='Tab 2' href='/trash' onClick={e => e.preventDefault()} />
        <Tab value='3' component='a' label='Tab 3' href='/spam' onClick={e => e.preventDefault()} />
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
    </TabContext>
  )
}

export default TabsNav
`}</code>
  </pre>
)

export const TabsIconJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
import AccountOutline from 'mdi-material-ui/AccountOutline'

const TabsIcon = () => {
  // ** State
  const [value, setValue] = useState('1')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  return (
    <TabContext value={value}>
      <TabList onChange={handleChange} aria-label='icon tabs example'>
        <Tab value='1' label='Recent' icon={<Phone />} />
        <Tab value='2' label='Favorites' icon={<HeartOutline />} />
        <Tab value='3' label='Contacts' icon={<AccountOutline />} />
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
    </TabContext>
  )
}

export default TabsIcon
`}</code>
  </pre>
)

export const TabsVerticalJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Typography from '@mui/material/Typography'

const TabsVertical = () => {
  // ** State
  const [value, setValue] = useState('1')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  return (
    <TabContext value={value}>
      <Box sx={{ display: 'flex' }}>
        <TabList orientation='vertical' onChange={handleChange} aria-label='vertical tabs example'>
          <Tab value='1' label='Tab 1' />
          <Tab value='2' label='Tab 2' />
          <Tab value='3' label='Tab 3' />
        </TabList>
        <TabPanel value='1'>
          <Typography>
            Cake apple pie chupa chups biscuit liquorice tootsie roll liquorice sugar plum. Cotton candy wafer wafer
            jelly cake caramels brownie gummies.
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
      </Box>
    </TabContext>
  )
}

export default TabsVertical
`}</code>
  </pre>
)

export const TabsSimpleJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Tab from '@mui/material/Tab'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import TabContext from '@mui/lab/TabContext'
import Typography from '@mui/material/Typography'

const TabsSimple = () => {
  // ** State
  const [value, setValue] = useState('1')

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  return (
    <TabContext value={value}>
      <TabList onChange={handleChange} aria-label='simple tabs example'>
        <Tab value='1' label='Tab 1' />
        <Tab value='2' label='Tab 2' />
        <Tab disabled value='3' label='Disabled' />
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
    </TabContext>
  )
}

export default TabsSimple
`}</code>
  </pre>
)
