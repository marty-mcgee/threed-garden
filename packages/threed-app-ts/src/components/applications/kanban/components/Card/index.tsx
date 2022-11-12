import { ReactNode } from 'react'

// @mui material components
import Icon from '@mui/material/Icon'
import { Theme } from '@mui/material/styles'

// ThreeD Garden components
import MDBox from '~/components/mui/MDBox'
import MDBadge from '~/components/mui/MDBadge'
import MDTypography from '~/components/mui/MDTypography'
import MDAvatar from '~/components/mui/MDAvatar'
import MDProgress from '~/components/mui/MDProgress'

// Declaring props types for Card
interface Props {
  image?: string
  badge: {
    color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'dark' | 'light'
    label: string
  }
  content: ReactNode
  progress?: number
  attachedFiles?: string | number
  members: string[]
}

function Card({ image, badge, content, progress, attachedFiles, members }: Props): JSX.Element {
  const renderMembers = members.map((member, key) => {
    const imageAlt = `image-${key}`

    return (
      <MDAvatar
        key={imageAlt}
        src={member}
        alt={imageAlt}
        size='xs'
        sx={{
          border: ({ borders: { borderWidth }, palette: { white } }: Theme) => `${borderWidth[2]} solid ${white.main}`,
          cursor: 'pointer',
          position: 'relative',
          ml: -1,
          mr: 0,

          '&:hover, &:focus': {
            zIndex: '10',
          },
        }}
      />
    )
  })

  return (
    <>
      {image && (
        <MDBox
          component='img'
          src={image}
          width='100%'
          borderRadius='lg'
          mb={1}
        />
      )}
      <MDBadge
        size='xs'
        color={badge.color}
        badgeContent={badge.label}
        container
      />
      <MDBox
        mt={1}
        mb={2}
      >
        <MDTypography
          variant='body2'
          color='text'
        >
          {content}
        </MDTypography>
        {progress > 0 && (
          <MDBox mt={0.25}>
            <MDProgress
              variant='gradient'
              value={progress}
              color={badge.color}
            />
          </MDBox>
        )}
      </MDBox>
      <MDBox
        display='flex'
        justifyContent='space-between'
        alignItems='center'
      >
        <MDBox
          display='flex'
          alignItems='center'
          color='text'
        >
          {attachedFiles && (
            <>
              <MDTypography
                variant='body2'
                color='text'
                sx={{ lineHeight: 0 }}
              >
                <Icon sx={{ fontWeight: 'bold' }}>attach_file</Icon>
              </MDTypography>
              <MDTypography
                variant='button'
                fontWeight='regular'
                color='text'
              >
                &nbsp;{attachedFiles}
              </MDTypography>
            </>
          )}
        </MDBox>
        <MDBox display='flex'>{renderMembers}</MDBox>
      </MDBox>
    </>
  )
}

// Declaring default props for Card
Card.defaultProps = {
  image: '',
  progress: 0,
  attachedFiles: '',
}

export default Card
