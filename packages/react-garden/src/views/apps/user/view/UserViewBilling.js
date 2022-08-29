// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import TableRow from '@mui/material/TableRow'
import { styled } from '@mui/material/styles'
import TableCell from '@mui/material/TableCell'
import TableBody from '@mui/material/TableBody'
import TextField from '@mui/material/TextField'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import AlertTitle from '@mui/material/AlertTitle'
import InputLabel from '@mui/material/InputLabel'
import CardContent from '@mui/material/CardContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import LinearProgress from '@mui/material/LinearProgress'
import TableContainer from '@mui/material/TableContainer'
import FormControlLabel from '@mui/material/FormControlLabel'
import DialogContentText from '@mui/material/DialogContentText'

// ** Icons Imports
import Plus from 'mdi-material-ui/Plus'

// ** Third Party Imports
import Payment from 'payment'
import Cards from 'react-credit-cards'

// ** Custom Components
import CustomChip from 'src/@core/components/mui/chip'

// ** Util Import
import { formatCVC, formatExpirationDate, formatCreditCardNumber } from 'src/@core/utils/format'

// ** Styled Component Imports
import CardWrapper from 'src/@core/styles/libs/react-credit-cards'

// ** Styles Import
import 'react-credit-cards/es/styles-compiled.css'

// ** Styled <sup> component
const Sup = styled('sup')(({ theme }) => ({
  top: '0.2rem',
  left: '-0.6rem',
  position: 'absolute',
  color: theme.palette.primary.main
}))

// ** Styled <sub> component
const Sub = styled('sub')({
  fontWeight: 300,
  fontSize: '1rem',
  alignSelf: 'flex-end'
})

const data = [
  {
    cardCvc: '587',
    name: 'Tom McBride',
    expiryDate: '12/24',
    imgAlt: 'Mastercard',
    badgeColor: 'primary',
    cardStatus: 'Primary',
    cardNumber: '5577 0000 5577 9865',
    imgSrc: '/images/logos/mastercard.png'
  },
  {
    cardCvc: '681',
    imgAlt: 'Visa card',
    expiryDate: '02/24',
    name: 'Mildred Wagner',
    cardNumber: '4532 3616 2070 5678',
    imgSrc: '/images/logos/visa.png'
  },
  {
    cardCvc: '3845',
    expiryDate: '08/20',
    badgeColor: 'error',
    cardStatus: 'Expired',
    name: 'Lester Jennings',
    imgAlt: 'American Express card',
    cardNumber: '3700 000000 00002',
    imgSrc: '/images/logos/american-express.png'
  }
]

const UserViewBilling = () => {
  // ** States
  const [cvc, setCvc] = useState('')
  const [name, setName] = useState('')
  const [focus, setFocus] = useState()
  const [cardId, setCardId] = useState(0)
  const [expiry, setExpiry] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [dialogTitle, setDialogTitle] = useState('Add')
  const [openEditCard, setOpenEditCard] = useState(false)
  const [openAddressCard, setOpenAddressCard] = useState(false)
  const [openUpgradePlans, setOpenUpgradePlans] = useState(false)

  // Handle Edit Card dialog and get card ID
  const handleEditCardClickOpen = id => {
    setDialogTitle('Edit')
    setCardId(id)
    setCardNumber(data[id].cardNumber)
    setName(data[id].name)
    setCvc(data[id].cardCvc)
    setExpiry(data[id].expiryDate)
    setOpenEditCard(true)
  }

  const handleAddCardClickOpen = () => {
    setDialogTitle('Add')
    setCardNumber('')
    setName('')
    setCvc('')
    setExpiry('')
    setOpenEditCard(true)
  }

  const handleEditCardClose = () => {
    setDialogTitle('Add')
    setCardNumber('')
    setName('')
    setCvc('')
    setExpiry('')
    setOpenEditCard(false)
  }

  // Handle Upgrade Plan dialog
  const handleUpgradePlansClickOpen = () => setOpenUpgradePlans(true)
  const handleUpgradePlansClose = () => setOpenUpgradePlans(false)
  const handleBlur = () => setFocus(undefined)

  const handleInputChange = ({ target }) => {
    if (target.name === 'number') {
      target.value = formatCreditCardNumber(target.value, Payment)
      setCardNumber(target.value)
    } else if (target.name === 'expiry') {
      target.value = formatExpirationDate(target.value)
      setExpiry(target.value)
    } else if (target.name === 'cvc') {
      target.value = formatCVC(target.value, cardNumber, Payment)
      setCvc(target.value)
    }
  }

  return (
    <Fragment>
      <Card sx={{ mb: 6 }}>
        <CardHeader title='Current plan' titleTypographyProps={{ variant: 'h6' }} />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 4 }}>
                <Typography sx={{ fontWeight: 500, mb: 1, fontSize: '0.875rem' }}>
                  Your Current Plan is <strong>Basic</strong>
                </Typography>
                <Typography variant='body2'>A simple start for everyone</Typography>
              </Box>
              <Box sx={{ mb: 4 }}>
                <Typography sx={{ fontWeight: 500, mb: 1, fontSize: '0.875rem' }}>Active until Dec 09, 2021</Typography>
                <Typography variant='body2'>We will send you a notification upon Subscription expiration</Typography>
              </Box>
              <Box>
                <Box sx={{ display: 'flex', mb: 1, alignItems: 'center' }}>
                  <Typography sx={{ mr: 2, fontWeight: 500, fontSize: '0.875rem' }}>$99 Per Month</Typography>
                  <CustomChip
                    skin='light'
                    size='small'
                    label='Popular'
                    color='primary'
                    sx={{ height: 20, fontSize: '0.75rem', fontWeight: 600, borderRadius: '5px' }}
                  />
                </Box>
                <Typography variant='body2'>Standard plan for small to medium businesses</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6} sx={{ mt: [4, 4, 0] }}>
              <Alert icon={false} severity='warning' sx={{ mb: 4 }}>
                <AlertTitle sx={{ fontWeight: 600, mb: theme => `${theme.spacing(1)} !important` }}>
                  We need your attention!
                </AlertTitle>
                Your plan requires updates
              </Alert>
              <Box sx={{ display: 'flex', mb: 2, justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Days</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>26 of 30 Days</Typography>
              </Box>
              <LinearProgress value={86.6666666} variant='determinate' sx={{ height: 10, borderRadius: '5px' }} />
              <Typography variant='body2' sx={{ mt: 2, mb: 4 }}>
                Your plan requires update
              </Typography>
            </Grid>

            <Grid item xs={12} sx={{ mt: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <Button variant='contained' onClick={handleUpgradePlansClickOpen} sx={{ mr: 3, mb: [3, 0] }}>
                Upgrade Plan
              </Button>
              <Button variant='outlined' color='error'>
                Cancel Subscription
              </Button>
            </Grid>
          </Grid>
        </CardContent>

        <Dialog
          open={openUpgradePlans}
          onClose={handleUpgradePlansClose}
          aria-labelledby='user-view-plans'
          aria-describedby='user-view-plans-description'
          sx={{ '& .MuiPaper-root': { width: '100%', maxWidth: 650, pt: 8, pb: 8 } }}
        >
          <DialogTitle id='user-view-plans' sx={{ textAlign: 'center', fontSize: '1.5rem !important' }}>
            Upgrade Plan
          </DialogTitle>

          <DialogContent>
            <DialogContentText variant='body2' sx={{ textAlign: 'center' }} id='user-view-plans-description'>
              Choose the best plan for the user.
            </DialogContentText>
          </DialogContent>

          <DialogContent
            sx={{
              pb: 8,
              px: [6, 15],
              display: 'flex',
              alignItems: 'center',
              flexWrap: ['wrap', 'nowrap'],
              pt: theme => `${theme.spacing(2)} !important`
            }}
          >
            <FormControl fullWidth size='small' sx={{ mr: [0, 3], mb: [3, 0] }}>
              <InputLabel id='user-view-plans-select-label'>Choose Plan</InputLabel>
              <Select
                label='Choose Plan'
                defaultValue='Standard'
                id='user-view-plans-select'
                labelId='user-view-plans-select-label'
              >
                <MenuItem value='Basic'>Basic - $0/month</MenuItem>
                <MenuItem value='Standard'>Standard - $99/month</MenuItem>
                <MenuItem value='Enterprise'>Enterprise - $499/month</MenuItem>
                <MenuItem value='Company'>Company - $999/month</MenuItem>
              </Select>
            </FormControl>
            <Button variant='contained' sx={{ minWidth: ['100%', 0] }}>
              Upgrade
            </Button>
          </DialogContent>

          <Divider sx={{ m: 0 }} />

          <DialogContent sx={{ pt: 8, pl: [6, 15], pr: [6, 15] }}>
            <Typography sx={{ fontWeight: 500, mb: 2, fontSize: '0.875rem' }}>
              User current plan is standard plan
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: ['wrap', 'nowrap'],
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ mr: 3, display: 'flex', ml: 2.4, position: 'relative' }}>
                <Sup>$</Sup>
                <Typography
                  variant='h3'
                  sx={{
                    mb: -1.2,
                    lineHeight: 1,
                    color: 'primary.main',
                    fontSize: '3rem !important'
                  }}
                >
                  99
                </Typography>
                <Sub>/ month</Sub>
              </Box>
              <Button color='error' variant='outlined' sx={{ mt: 2 }}>
                Cancel Subscription
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      </Card>

      <Card sx={{ mb: 6 }}>
        <CardHeader
          title='Payment Methods'
          titleTypographyProps={{ variant: 'h6' }}
          action={
            <Button variant='contained' onClick={handleAddCardClickOpen}>
              <Plus sx={{ mr: 1, fontSize: '1.125rem' }} />
              Add Card
            </Button>
          }
        />
        <CardContent>
          {data.map((item, index) => (
            <Box
              key={index}
              sx={{
                p: 5,
                display: 'flex',
                borderRadius: 1,
                flexDirection: ['column', 'row'],
                justifyContent: ['space-between'],
                alignItems: ['flex-start', 'center'],
                mb: index !== data.length - 1 ? 4 : undefined,
                border: theme => `1px solid ${theme.palette.divider}`
              }}
            >
              <div>
                <img height='25' alt={item.imgAlt} src={item.imgSrc} />
                <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 500 }}>{item.name}</Typography>
                  {item.cardStatus ? (
                    <CustomChip
                      skin='light'
                      size='small'
                      label={item.cardStatus}
                      color={item.badgeColor}
                      sx={{ height: 20, ml: 2, fontSize: '0.75rem', fontWeight: 600, borderRadius: '5px' }}
                    />
                  ) : null}
                </Box>
                <Typography variant='body2'>
                  **** **** **** {item.cardNumber.substring(item.cardNumber.length - 4)}
                </Typography>
              </div>

              <Box sx={{ mt: [3, 0], textAlign: ['start', 'end'] }}>
                <Button variant='outlined' sx={{ mr: 3 }} onClick={() => handleEditCardClickOpen(index)}>
                  Edit
                </Button>
                <Button variant='outlined' color='secondary'>
                  Delete
                </Button>
                <Typography variant='body2' sx={{ mt: 5 }}>
                  Card expires at {item.expiryDate}
                </Typography>
              </Box>
            </Box>
          ))}
        </CardContent>

        <Dialog
          open={openEditCard}
          onClose={handleEditCardClose}
          aria-labelledby='user-view-billing-edit-card'
          sx={{ '& .MuiPaper-root': { width: '100%', maxWidth: 650, p: [2, 10] } }}
          aria-describedby='user-view-billing-edit-card-description'
        >
          <DialogTitle id='user-view-billing-edit-card' sx={{ textAlign: 'center', fontSize: '1.5rem !important' }}>
            {dialogTitle} Card
          </DialogTitle>
          <DialogContent>
            <DialogContentText
              variant='body2'
              id='user-view-billing-edit-card-description'
              sx={{ textAlign: 'center', mb: 7 }}
            >
              {dialogTitle} card for future billing
            </DialogContentText>
            <form>
              <Grid container spacing={6}>
                <Grid item xs={12}>
                  <CardWrapper sx={{ '& .rccs': { m: '0 auto' } }}>
                    <Cards cvc={cvc} focused={focus} expiry={expiry} name={name} number={cardNumber} />
                  </CardWrapper>
                </Grid>
                <Grid item xs={12}>
                  <Grid container spacing={6}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name='number'
                        value={cardNumber}
                        autoComplete='off'
                        label='Card Number'
                        onBlur={handleBlur}
                        onChange={handleInputChange}
                        placeholder='0000 0000 0000 0000'
                        onFocus={e => setFocus(e.target.name)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        name='name'
                        value={name}
                        autoComplete='off'
                        onBlur={handleBlur}
                        label='Name on Card'
                        placeholder='John Doe'
                        onChange={e => setName(e.target.value)}
                        onFocus={e => setFocus(e.target.name)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        name='expiry'
                        label='Expiry'
                        value={expiry}
                        onBlur={handleBlur}
                        placeholder='MM/YY'
                        onChange={handleInputChange}
                        inputProps={{ maxLength: '5' }}
                        onFocus={e => setFocus(e.target.name)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <FormControl fullWidth>
                        <InputLabel id='user-view-billing-edit-card-status-label'>Card Status</InputLabel>
                        <Select
                          label='Card Status'
                          id='user-view-billing-edit-card-status'
                          labelId='user-view-billing-edit-card-status-label'
                          defaultValue={data[cardId].cardStatus ? data[cardId].cardStatus : ''}
                        >
                          <MenuItem value='Primary'>Primary</MenuItem>
                          <MenuItem value='Expired'>Expired</MenuItem>
                          <MenuItem value='Active'>Active</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        name='cvc'
                        label='CVC'
                        value={cvc}
                        autoComplete='off'
                        onBlur={handleBlur}
                        onChange={handleInputChange}
                        onFocus={e => setFocus(e.target.name)}
                        placeholder={Payment.fns.cardType(cardNumber) === 'amex' ? '1234' : '123'}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={<Switch defaultChecked />}
                        label='Save Card for future billing?'
                        sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </form>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center' }}>
            <Button variant='contained' sx={{ mr: 1 }} onClick={handleEditCardClose}>
              Submit
            </Button>
            <Button variant='outlined' color='secondary' onClick={handleEditCardClose}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Card>

      <Card>
        <CardHeader
          title='Billing Address'
          titleTypographyProps={{ variant: 'h6' }}
          action={
            <Button variant='contained' onClick={() => setOpenAddressCard(true)}>
              Edit Address
            </Button>
          }
        />
        <CardContent>
          <Grid container spacing={6}>
            <Grid item xs={12} lg={6}>
              <TableContainer>
                <Table size='small' sx={{ width: '95%' }}>
                  <TableBody
                    sx={{
                      '& .MuiTableCell-root': {
                        border: 0,
                        pt: 2,
                        pb: 2,
                        pl: '0 !important',
                        pr: '0 !important',
                        '&:first-of-type': {
                          width: 148
                        }
                      }
                    }}
                  >
                    <TableRow>
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            lineHeight: '22px',
                            letterSpacing: '0.1px'
                          }}
                        >
                          Company Name:
                        </Typography>
                      </TableCell>
                      <TableCell>ThemeSelection</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            lineHeight: '22px',
                            letterSpacing: '0.1px'
                          }}
                        >
                          Billing Email:
                        </Typography>
                      </TableCell>
                      <TableCell>gertrude@gmail.com</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            lineHeight: '22px',
                            letterSpacing: '0.1px'
                          }}
                        >
                          Tax ID:
                        </Typography>
                      </TableCell>
                      <TableCell>TAX-875623</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            lineHeight: '22px',
                            letterSpacing: '0.1px'
                          }}
                        >
                          VAT Number:
                        </Typography>
                      </TableCell>
                      <TableCell>SDF754K77</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            lineHeight: '22px',
                            letterSpacing: '0.1px'
                          }}
                        >
                          Billing Address:
                        </Typography>
                      </TableCell>
                      <TableCell>100 Water Plant Avenue, Building 1303 Wake Island</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid item xs={12} lg={6}>
              <TableContainer>
                <Table size='small'>
                  <TableBody
                    sx={{
                      '& .MuiTableCell-root': {
                        border: 0,
                        pt: 2,
                        pb: 2,
                        pl: '0 !important',
                        pr: '0 !important',
                        '&:first-of-type': {
                          width: 148
                        }
                      }
                    }}
                  >
                    <TableRow>
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            lineHeight: '22px',
                            letterSpacing: '0.1px'
                          }}
                        >
                          Contact:
                        </Typography>
                      </TableCell>
                      <TableCell>+1(609) 933-44-22</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            lineHeight: '22px',
                            letterSpacing: '0.1px'
                          }}
                        >
                          Country:
                        </Typography>
                      </TableCell>
                      <TableCell>Australia</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            lineHeight: '22px',
                            letterSpacing: '0.1px'
                          }}
                        >
                          State:
                        </Typography>
                      </TableCell>
                      <TableCell>Queensland</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            lineHeight: '22px',
                            letterSpacing: '0.1px'
                          }}
                        >
                          Zip Code:
                        </Typography>
                      </TableCell>
                      <TableCell>403114</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </CardContent>

        <Dialog
          open={openAddressCard}
          onClose={() => setOpenAddressCard(false)}
          aria-labelledby='user-address-edit'
          sx={{ '& .MuiPaper-root': { width: '100%', maxWidth: 650, p: [2, 10] } }}
          aria-describedby='user-address-edit-description'
        >
          <DialogTitle id='user-address-edit' sx={{ textAlign: 'center', fontSize: '1.5rem !important' }}>
            Edit Address
          </DialogTitle>
          <DialogContent>
            <DialogContentText variant='body2' id='user-address-edit-description' sx={{ textAlign: 'center', mb: 7 }}>
              Edit Address for future billing
            </DialogContentText>
            <form>
              <Grid container spacing={6}>
                <Grid item xs={12} sm={6}>
                  <TextField size='small' defaultValue='ThemeSelection' label='Company Name' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField type='email' size='small' defaultValue='gertrude@gmail.com' label='Email' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField size='small' defaultValue='TAX-875623' label='Tax ID' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField size='small' defaultValue='SDF754K77' label='VAT Number' />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    size='small'
                    label='Billing Address'
                    defaultValue='100 Water Plant Avenue, Building 1303 Wake Island'
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField size='small' defaultValue='+1(609) 933-44-22' label='Contact' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl size='small' fullWidth>
                    <InputLabel id='country-select'>Country</InputLabel>
                    <Select labelId='country-select' defaultValue='usa' label='Country'>
                      <MenuItem value='usa'>USA</MenuItem>
                      <MenuItem value='uk'>UK</MenuItem>
                      <MenuItem value='france'>France</MenuItem>
                      <MenuItem value='germany'>Germany</MenuItem>
                      <MenuItem value='japan'>Japan</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField size='small' defaultValue='Capholim' label='State' />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField type='number' size='small' defaultValue='403114' label='Zip Code' />
                </Grid>
              </Grid>
            </form>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center' }}>
            <Button variant='contained' sx={{ mr: 1 }} onClick={() => setOpenAddressCard(false)}>
              Submit
            </Button>
            <Button variant='outlined' color='secondary' onClick={() => setOpenAddressCard(false)}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Card>
    </Fragment>
  )
}

export default UserViewBilling
