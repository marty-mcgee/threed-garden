import { useState } from 'react'

// @mui material components
import Card from '@mui/material/Card'
import Switch from '@mui/material/Switch'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

function PlatformSettings(): JSX.Element {
  const [followsMe, setFollowsMe] = useState<boolean>(true)
  const [answersPost, setAnswersPost] = useState<boolean>(false)
  const [mentionsMe, setMentionsMe] = useState<boolean>(true)
  const [newLaunches, setNewLaunches] = useState<boolean>(false)
  const [productUpdate, setProductUpdate] = useState<boolean>(true)
  const [newsletter, setNewsletter] = useState<boolean>(false)

  return (
    <Card sx={{ boxShadow: 'none' }}>
      <MDBox p={2}>
        <MDTypography
          variant='h6'
          fontWeight='medium'
          textTransform='capitalize'
        >
          platform settings
        </MDTypography>
      </MDBox>
      <MDBox
        pt={0}
        pb={2}
        px={2}
        lineHeight={1.25}
      >
        <MDTypography
          variant='caption'
          fontWeight='bold'
          color='text'
          textTransform='uppercase'
        >
          account
        </MDTypography>
        <MDBox
          display='flex'
          alignItems='center'
          mb={0.5}
          ml={-1.5}
        >
          <MDBox mt={0.5}>
            <Switch
              checked={followsMe}
              onChange={() => setFollowsMe(!followsMe)}
            />
          </MDBox>
          <MDBox
            width='80%'
            ml={0.5}
          >
            <MDTypography
              variant='button'
              fontWeight='regular'
              color='text'
            >
              Email me when someone follows me
            </MDTypography>
          </MDBox>
        </MDBox>
        <MDBox
          display='flex'
          alignItems='center'
          mb={0.5}
          ml={-1.5}
        >
          <MDBox mt={0.5}>
            <Switch
              checked={answersPost}
              onChange={() => setAnswersPost(!answersPost)}
            />
          </MDBox>
          <MDBox
            width='80%'
            ml={0.5}
          >
            <MDTypography
              variant='button'
              fontWeight='regular'
              color='text'
            >
              Email me when someone answers on my post
            </MDTypography>
          </MDBox>
        </MDBox>
        <MDBox
          display='flex'
          alignItems='center'
          mb={0.5}
          ml={-1.5}
        >
          <MDBox mt={0.5}>
            <Switch
              checked={mentionsMe}
              onChange={() => setMentionsMe(!mentionsMe)}
            />
          </MDBox>
          <MDBox
            width='80%'
            ml={0.5}
          >
            <MDTypography
              variant='button'
              fontWeight='regular'
              color='text'
            >
              Email me when someone mentions me
            </MDTypography>
          </MDBox>
        </MDBox>
        <MDBox mt={2}>
          <MDTypography
            variant='caption'
            fontWeight='bold'
            color='text'
            textTransform='uppercase'
          >
            application
          </MDTypography>
        </MDBox>
        <MDBox
          display='flex'
          alignItems='center'
          mb={0.5}
          ml={-1.5}
        >
          <MDBox mt={0.5}>
            <Switch
              checked={newLaunches}
              onChange={() => setNewLaunches(!newLaunches)}
            />
          </MDBox>
          <MDBox
            width='80%'
            ml={0.5}
          >
            <MDTypography
              variant='button'
              fontWeight='regular'
              color='text'
            >
              New launches and projects
            </MDTypography>
          </MDBox>
        </MDBox>
        <MDBox
          display='flex'
          alignItems='center'
          mb={0.5}
          ml={-1.5}
        >
          <MDBox mt={0.5}>
            <Switch
              checked={productUpdate}
              onChange={() => setProductUpdate(!productUpdate)}
            />
          </MDBox>
          <MDBox
            width='80%'
            ml={0.5}
          >
            <MDTypography
              variant='button'
              fontWeight='regular'
              color='text'
            >
              Monthly product updates
            </MDTypography>
          </MDBox>
        </MDBox>
        <MDBox
          display='flex'
          alignItems='center'
          mb={0.5}
          ml={-1.5}
        >
          <MDBox mt={0.5}>
            <Switch
              checked={newsletter}
              onChange={() => setNewsletter(!newsletter)}
            />
          </MDBox>
          <MDBox
            width='80%'
            ml={0.5}
          >
            <MDTypography
              variant='button'
              fontWeight='regular'
              color='text'
            >
              Subscribe to newsletter
            </MDTypography>
          </MDBox>
        </MDBox>
      </MDBox>
    </Card>
  )
}

export default PlatformSettings
