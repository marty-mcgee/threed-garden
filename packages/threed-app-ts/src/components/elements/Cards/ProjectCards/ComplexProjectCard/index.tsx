import { ReactNode } from 'react'

// @mui material components
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import Icon from '@mui/material/Icon'

// ThreeD Garden components
import MDBox from '~/components/mui/MDBox'
import MDTypography from '~/components/mui/MDTypography'
import MDAvatar from '~/components/mui/MDAvatar'

// Declaring prop types for the ComplexProjectCard
interface Props {
  color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'dark' | 'light'
  image: string
  title: string
  dateTime?: string
  description: ReactNode
  members?: string[]
  dropdown?: {
    action?: (...arg: any) => void
    menu?: ReactNode
  }
  [key: string]: any
}

// Custom styles for ComplexProjectCard
function ComplexProjectCard({ color, image, title, dateTime, description, members, dropdown }: Props): JSX.Element {
  const renderMembers = members.map((member, key) => {
    const memberKey = `member-${key}`

    return (
      <MDAvatar
        key={memberKey}
        src={member}
        alt='member profile'
        size='xs'
        sx={({ borders: { borderWidth }, palette: { white } }) => ({
          border: `${borderWidth[2]} solid ${white.main}`,
          cursor: 'pointer',
          position: 'relative',

          '&:not(:first-of-type)': {
            ml: -1.25,
          },

          '&:hover, &:focus': {
            zIndex: '10',
          },
        })}
      />
    )
  })

  return (
    <Card>
      <MDBox p={2}>
        <MDBox
          display='flex'
          alignItems='center'
        >
          <MDAvatar
            src={image}
            alt={title}
            size='xl'
            variant='rounded'
            bgColor={color}
            sx={{
              p: 1,
              mt: -6,
              borderRadius: ({ borders: { borderRadius } }) => borderRadius.xl,
            }}
          />
          <MDBox
            ml={2}
            mt={-2}
            lineHeight={0}
          >
            <MDTypography
              variant='h6'
              textTransform='capitalize'
              fontWeight='medium'
            >
              {title}
            </MDTypography>
            {members.length > -1 ? <MDBox display='flex'>{renderMembers}</MDBox> : null}
          </MDBox>
          {dropdown && (
            <MDTypography
              color='secondary'
              onClick={dropdown.action}
              sx={{
                ml: 'auto',
                mt: -1,
                alignSelf: 'flex-start',
                py: 1.25,
              }}
            >
              <Icon sx={{ cursor: 'pointer', fontWeight: 'bold' }}>more_vert</Icon>
            </MDTypography>
          )}
          {dropdown.menu}
        </MDBox>
        <MDBox
          my={2}
          lineHeight={1}
        >
          <MDTypography
            variant='button'
            fontWeight='light'
            color='text'
          >
            {description}
          </MDTypography>
        </MDBox>
        <Divider />
        <MDBox
          display='flex'
          justifyContent='space-between'
          alignItems='center'
        >
          {members.length > -1 ? (
            <MDBox
              display='flex'
              flexDirection='column'
              lineHeight={0}
            >
              <MDTypography
                variant='button'
                fontWeight='medium'
              >
                {members.length}
              </MDTypography>
              <MDTypography
                variant='button'
                fontWeight='regular'
                color='secondary'
              >
                Participants
              </MDTypography>
            </MDBox>
          ) : null}
          {dateTime ? (
            <MDBox
              display='flex'
              flexDirection='column'
              lineHeight={0}
            >
              <MDTypography
                variant='button'
                fontWeight='medium'
              >
                {dateTime}
              </MDTypography>
              <MDTypography
                variant='button'
                fontWeight='regular'
                color='secondary'
              >
                Due date
              </MDTypography>
            </MDBox>
          ) : null}
        </MDBox>
      </MDBox>
    </Card>
  )
}

// Declaring default props for ComplexProjectCard
ComplexProjectCard.defaultProps = {
  color: 'dark',
  dateTime: '',
  members: [],
  dropdown: false,
}

export default ComplexProjectCard
