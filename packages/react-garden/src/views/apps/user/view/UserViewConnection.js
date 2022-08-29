// ** React Imports
import { Fragment } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Switch from '@mui/material/Switch'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import Close from 'mdi-material-ui/Close'
import LinkVariant from 'mdi-material-ui/LinkVariant'

// ** Styled component for the Facebook image
const Img = styled('img')(({ theme }) => ({
  marginLeft: theme.spacing(1.75),
  marginRight: theme.spacing(1.75)
}))

const UserViewConnection = () => {
  return (
    <Fragment>
      <Card sx={{ mb: 6 }}>
        <CardHeader
          title='Connected Accounts'
          titleTypographyProps={{ variant: 'h6', sx: { mb: 1 } }}
          subheader='Display content from your connected accounts on your site'
        />
        <CardContent>
          <Box
            sx={{
              mb: 7,
              mt: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img width='35' height='35' alt='Google' src='/images/logos/google.png' />
              <Box sx={{ ml: 3 }}>
                <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>Google</Typography>
                <Typography variant='body2' sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                  Calendar and contacts
                </Typography>
              </Box>
            </Box>
            <Switch defaultChecked />
          </Box>

          <Box sx={{ display: 'flex', mb: 7, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img width='35' height='35' alt='Slack' src='/images/logos/slack.png' />
              <Box sx={{ ml: 3 }}>
                <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>Slack</Typography>
                <Typography variant='body2' sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                  Communication
                </Typography>
              </Box>
            </Box>
            <Switch />
          </Box>

          <Box sx={{ display: 'flex', mb: 7, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img width='35' height='35' alt='Github' src='/images/logos/github.png' />
              <Box sx={{ ml: 3 }}>
                <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>Github</Typography>
                <Typography variant='body2' sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                  Manage your Git repositories
                </Typography>
              </Box>
            </Box>
            <Switch defaultChecked />
          </Box>

          <Box sx={{ display: 'flex', mb: 7, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img width='35' height='35' alt='Mailchimp' src='/images/logos/mail-chimp.png' />
              <Box sx={{ ml: 3 }}>
                <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>Mailchimp</Typography>
                <Typography variant='body2' sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                  Email marketing service
                </Typography>
              </Box>
            </Box>
            <Switch />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img width='35' height='35' alt='Asana' src='/images/logos/asana.png' />
              <Box sx={{ ml: 3 }}>
                <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>Asana</Typography>
                <Typography variant='body2' sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                  Communication
                </Typography>
              </Box>
            </Box>
            <Switch />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title='Social Accounts'
          subheader='Display content from social accounts on your site'
          titleTypographyProps={{ variant: 'h6', sx: { mb: 1 } }}
        />
        <CardContent>
          <Box
            sx={{
              mb: 6,
              mt: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Img height='35' alt='Facebook' src='/images/logos/facebook.png' />
              <Box sx={{ ml: 3 }}>
                <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>Facebook</Typography>
                <Typography variant='body2' sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                  Not connected
                </Typography>
              </Box>
            </Box>
            <Button color='secondary' variant='outlined' sx={{ p: 2, minWidth: 38 }}>
              <LinkVariant sx={{ fontSize: '1.25rem' }} />
            </Button>
          </Box>

          <Box sx={{ display: 'flex', mb: 6, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Img width='35' height='35' alt='Twitter' src='/images/logos/twitter.png' />
              <Box sx={{ ml: 3 }}>
                <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>Twitter</Typography>
                <Typography variant='body2' sx={{ fontWeight: 500, color: 'primary.main', fontSize: '0.8125rem' }}>
                  @theme_selection
                </Typography>
              </Box>
            </Box>
            <Button color='secondary' variant='outlined' sx={{ p: 2, minWidth: 38 }}>
              <Close sx={{ fontSize: '1.25rem' }} />
            </Button>
          </Box>

          <Box sx={{ display: 'flex', mb: 6, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Img width='35' height='35' alt='LinkedIn' src='/images/logos/linkedin.png' />
              <Box sx={{ ml: 3 }}>
                <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>LinkedIn</Typography>
                <Typography variant='body2' sx={{ fontWeight: 500, color: 'primary.main', fontSize: '0.8125rem' }}>
                  @theme_selection
                </Typography>
              </Box>
            </Box>
            <Button color='secondary' variant='outlined' sx={{ p: 2, minWidth: 38 }}>
              <Close sx={{ fontSize: '1.25rem' }} />
            </Button>
          </Box>

          <Box sx={{ display: 'flex', mb: 6, alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Img width='35' height='35' alt='Dribbble' src='/images/logos/dribbble.png' />
              <Box sx={{ ml: 3 }}>
                <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>Dribbble</Typography>
                <Typography variant='body2' sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                  Not connected
                </Typography>
              </Box>
            </Box>
            <Button color='secondary' variant='outlined' sx={{ p: 2, minWidth: 38 }}>
              <LinkVariant sx={{ fontSize: '1.25rem' }} />
            </Button>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Img width='35' height='35' alt='Behance' src='/images/logos/behance.png' />
              <Box sx={{ ml: 3 }}>
                <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>Behance</Typography>
                <Typography variant='body2' sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                  Not connected
                </Typography>
              </Box>
            </Box>
            <Button color='secondary' variant='outlined' sx={{ p: 2, minWidth: 38 }}>
              <LinkVariant sx={{ fontSize: '1.25rem' }} />
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Fragment>
  )
}

export default UserViewConnection
