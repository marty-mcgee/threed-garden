// @mui material components
import Divider from '@mui/material/Divider'
import Icon from '@mui/material/Icon'
import Tooltip from '@mui/material/Tooltip'
import { Theme } from '@mui/material/styles'

// ThreeD Garden components
import MDBox from '~/components/mui/MDBox'
import MDTypography from '~/components/mui/MDTypography'
import MDAvatar from '~/components/mui/MDAvatar'
import MDButton from '~/components/mui/MDButton'

// Image
import team0 from '~/assets/images/people/team-0.png'
import team1 from '~/assets/images/people/team-1.jpg'
import team2 from '~/assets/images/people/team-2.jpg'
import team3 from '~/assets/images/people/team-3.jpg'
import team4 from '~/assets/images/people/team-4.jpg'
import team5 from '~/assets/images/people/team-5.jpg'

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
            variant='button'
            color='secondary'
          >
            Team members:
          </MDTypography>
        </MDBox>
        <MDBox display='flex'>
          <Tooltip
            title='Garden Master'
            placement='top'
          >
            <MDAvatar
              src={team0.src}
              alt='team-0'
              size='sm'
              sx={avatarStyles}
            />
          </Tooltip>
          <Tooltip
            title='Jessica Rowland'
            placement='top'
          >
            <MDAvatar
              src={team1.src}
              alt='team-1'
              size='sm'
              sx={avatarStyles}
            />
          </Tooltip>
          <Tooltip
            title='Michael Lewis'
            placement='top'
          >
            <MDAvatar
              src={team2.src}
              alt='team-2'
              size='sm'
              sx={avatarStyles}
            />
          </Tooltip>
          <Tooltip
            title='Audrey Loveland'
            placement='top'
          >
            <MDAvatar
              src={team3.src}
              alt='team-3'
              size='sm'
              sx={avatarStyles}
            />
          </Tooltip>
          <Tooltip
            title='Ronald Miller'
            placement='top'
          >
            <MDAvatar
              src={team4.src}
              alt='team-4'
              size='sm'
              sx={avatarStyles}
            />
          </Tooltip>
          <Tooltip
            title='Lucia Linda'
            placement='top'
          >
            <MDAvatar
              src={team5.src}
              alt='team-5'
              size='sm'
              sx={avatarStyles}
            />
          </Tooltip>
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
          variant='outlined'
          color='dark'
          iconOnly
        >
          <Icon sx={{ fontWeight: 'bold' }}>add</Icon>
        </MDButton>
      </MDBox>
    </MDBox>
  )
}

export default Header
