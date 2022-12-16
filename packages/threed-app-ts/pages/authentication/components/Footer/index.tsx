// @mui material components
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Icon from '@mui/material/Icon'
import { Theme } from '@mui/material/styles'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// ThreeD Garden Base Styles
import typography from '#/ui/themes/theme-light/base/typography'

function Footer({ light }: { light?: boolean }): JSX.Element {
  const { size } = typography

  return (
    <MDBox
      position='absolute'
      width='100%'
      bottom={0}
      py={4}
    >
      <Container>
        <MDBox
          width='100%'
          display='flex'
          flexDirection={{ xs: 'column', lg: 'row' }}
          justifyContent='space-between'
          alignItems='center'
          px={1.5}
        >
          <MDBox
            display='flex'
            justifyContent='center'
            alignItems='center'
            flexWrap='wrap'
            color={light ? 'white' : 'text'}
            fontSize={size.sm}
          >
            &copy; {new Date().getFullYear()}
            <MDBox
              fontSize={size.md}
              color={light ? 'white' : 'dark'}
              mb={-0.5}
              mx={0.25}
            >
              <Icon
                color='inherit'
                fontSize='inherit'
              >
                favorite
              </Icon>
            </MDBox>
            <Link
              href='https://companyjuice.com/'
              target='_blank'
            >
              <MDTypography
                variant='button'
                fontWeight='medium'
                color={light ? 'white' : 'dark'}
              >
                &nbsp;Company Juice&nbsp;
              </MDTypography>
            </Link>
          </MDBox>
          <MDBox
            component='ul'
            sx={({ breakpoints }: Theme) => ({
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              listStyle: 'none',
              mt: 3,
              mb: 0,
              p: 0,

              [breakpoints.up('lg')]: {
                mt: 0,
              },
            })}
          >
            <MDBox
              component='li'
              pr={2}
              lineHeight={1}
            >
              <Link
                href='https://companyjuice.com/'
                target='_blank'
              >
                <MDTypography
                  variant='button'
                  fontWeight='regular'
                  color={light ? 'white' : 'dark'}
                >
                  Company Juice
                </MDTypography>
              </Link>
            </MDBox>
            <MDBox
              component='li'
              px={2}
              lineHeight={1}
            >
              <Link
                href='https://companyjuice.com/presentation'
                target='_blank'
              >
                <MDTypography
                  variant='button'
                  fontWeight='regular'
                  color={light ? 'white' : 'dark'}
                >
                  About Us
                </MDTypography>
              </Link>
            </MDBox>
            <MDBox
              component='li'
              px={2}
              lineHeight={1}
            >
              <Link
                href='https://companyjuice.com/blog'
                target='_blank'
              >
                <MDTypography
                  variant='button'
                  fontWeight='regular'
                  color={light ? 'white' : 'dark'}
                >
                  Blog
                </MDTypography>
              </Link>
            </MDBox>
            <MDBox
              component='li'
              pl={2}
              lineHeight={1}
            >
              <Link
                href='https://companyjuice.com/license'
                target='_blank'
              >
                <MDTypography
                  variant='button'
                  fontWeight='regular'
                  color={light ? 'white' : 'dark'}
                >
                  License
                </MDTypography>
              </Link>
            </MDBox>
          </MDBox>
        </MDBox>
      </Container>
    </MDBox>
  )
}

// Declaring default props for Footer
Footer.defaultProps = {
  light: false,
}

export default Footer
