// @mui material components
import Divider from '@mui/material/Divider'
import Icon from '@mui/material/Icon'
import type { Theme } from '@mui/material/styles'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'
import MDAvatar from '#/lib/mui/MDAvatar'
import MDButton from '#/lib/mui/MDButton'

// Image
import team1 from '#/lib/assets/images/people/team-1.jpg'
import team2 from '#/lib/assets/images/people/team-2.jpg'
import team3 from '#/lib/assets/images/people/team-3.jpg'
import team4 from '#/lib/assets/images/people/team-4.jpg'
import team5 from '#/lib/assets/images/people/team-5.jpg'

function Header(): JSX.Element {
  const avatarStyles: { [key: string]: any } = {
    border: ({ borders: { borderWidth }, palette: { white } }: Theme) => `${borderWidth[2]} solid ${white.main}`,
    cursor: 'pointer',
    position: 'relative',
    ml: -1.5,

    '&:hover, &:focus': {
      zIndex: '10',
    },
  }

  return (
    <MDBox
      display='flex'
      alignItems='center'
    >
      <MDBox
        mt={0.5}
        pr={1}
      >
        <MDBox
          mb={1}
          ml={-1.25}
          lineHeight={0}
        >
          <MDTypography
            variant='caption'
            color='secondary'
          >
            Team members:
          </MDTypography>
        </MDBox>
        <MDBox display='flex'>
          <MDAvatar
            src={team1.src}
            alt='team-1'
            size='sm'
            sx={avatarStyles}
          />
          <MDAvatar
            src={team2.src}
            alt='team-1'
            size='sm'
            sx={avatarStyles}
          />
          <MDAvatar
            src={team3.src}
            alt='team-1'
            size='sm'
            sx={avatarStyles}
          />
          <MDAvatar
            src={team4.src}
            alt='team-1'
            size='sm'
            sx={avatarStyles}
          />
          <MDAvatar
            src={team5.src}
            alt='team-1'
            size='sm'
            sx={avatarStyles}
          />
        </MDBox>
      </MDBox>
      <MDBox
        height='75%'
        alignSelf='flex-end'
      >
        <Divider orientation='vertical' />
      </MDBox>
      <MDBox pl={1}>
        <MDButton
          variant='gradient'
          color='info'
          iconOnly
        >
          <Icon sx={{ fontWeight: 'bold' }}>add</Icon>
        </MDButton>
      </MDBox>
    </MDBox>
  )
}

export default Header
