// ** React Imports
import { useEffect, useState, forwardRef } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import MenuItem from '@mui/material/MenuItem'
import TableRow from '@mui/material/TableRow'
import Collapse from '@mui/material/Collapse'
import TableBody from '@mui/material/TableBody'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import InputLabel from '@mui/material/InputLabel'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import { styled, useTheme } from '@mui/material/styles'
import InputAdornment from '@mui/material/InputAdornment'
import TableContainer from '@mui/material/TableContainer'
import Select from '@mui/material/Select'
import TableCell from '@mui/material/TableCell'
import CardContent from '@mui/material/CardContent'

// ** Icon Imports
import Plus from 'mdi-material-ui/Plus'
import Close from 'mdi-material-ui/Close'

// ** Third Party Imports
import axios from 'axios'
import DatePicker from 'react-datepicker'

// ** Configs
import themeConfig from 'src/configs/themeConfig'

// ** Custom Component Imports
import Repeater from 'src/@core/components/repeater'

// ** Styles
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField size='small' inputRef={ref} {...props} sx={{ width: { sm: '250px', xs: '170px' } }} />
})

const MUITableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: 0,
  paddingLeft: '0 !important',
  paddingRight: '0 !important',
  paddingTop: `${theme.spacing(1)} !important`,
  paddingBottom: `${theme.spacing(1)} !important`
}))

const CalcWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  '&:not(:last-of-type)': {
    marginBottom: theme.spacing(2)
  }
}))

const RepeatingContent = styled(Grid)(({ theme }) => ({
  paddingRight: 0,
  display: 'flex',
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  '& .col-title': {
    top: '-1.5rem',
    position: 'absolute'
  },
  [theme.breakpoints.down('lg')]: {
    '& .col-title': {
      top: '0',
      position: 'relative'
    }
  }
}))

const RepeaterWrapper = styled(CardContent)(({ theme }) => ({
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(12),
  '& .repeater-wrapper + .repeater-wrapper': {
    marginTop: theme.spacing(8)
  }
}))

const InvoiceAction = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  padding: theme.spacing(2, 0),
  borderLeft: `1px solid ${theme.palette.divider}`
}))

const EditCard = ({ data }) => {
  // ** States
  const [count, setCount] = useState(1)
  const [selected, setSelected] = useState('')
  const [clients, setClients] = useState(undefined)
  const [selectedClient, setSelectedClient] = useState(null)
  const [dueDate, setDueDate] = useState(data ? new Date(data.invoice.dueDate) : new Date())
  const [issueDate, setIssueDate] = useState(data ? new Date(data.invoice.issuedDate) : new Date())

  // ** Hook
  const theme = useTheme()
  useEffect(() => {
    axios.get('/apps/invoice/clients').then(response => {
      if (response.data && clients === undefined) {
        setClients(response.data)
        setSelected(response.data[0].name)
        setSelectedClient(response.data[0])
      }
    })
  }, [clients])

  // ** Deletes form
  const deleteForm = e => {
    e.preventDefault()

    // @ts-ignore
    e.target.closest('.repeater-wrapper').remove()
  }

  // ** Handle Invoice To Change
  const handleInvoiceChange = e => {
    setSelected(e.target.value)
    if (clients !== undefined) {
      setSelectedClient(clients.filter(i => i.name === e.target.value)[0])
    }
  }
  if (data) {
    return (
      <Card>
        <CardContent>
          <Grid container>
            <Grid item xl={6} xs={12} sx={{ mb: { xl: 0, xs: 4 } }}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ mb: 6, display: 'flex', alignItems: 'center' }}>
                  <svg
                    width={30}
                    height={25}
                    version='1.1'
                    viewBox='0 0 30 23'
                    xmlns='http://www.w3.org/2000/svg'
                    xmlnsXlink='http://www.w3.org/1999/xlink'
                  >
                    <g stroke='none' strokeWidth='1' fill='none' fillRule='evenodd'>
                      <g id='Artboard' transform='translate(-95.000000, -51.000000)'>
                        <g id='logo' transform='translate(95.000000, 50.000000)'>
                          <path
                            id='Combined-Shape'
                            fill={theme.palette.primary.main}
                            d='M30,21.3918362 C30,21.7535219 29.9019196,22.1084381 29.7162004,22.4188007 C29.1490236,23.366632 27.9208668,23.6752135 26.9730355,23.1080366 L26.9730355,23.1080366 L23.714971,21.1584295 C23.1114106,20.7972624 22.7419355,20.1455972 22.7419355,19.4422291 L22.7419355,19.4422291 L22.741,12.7425689 L15,17.1774194 L7.258,12.7425689 L7.25806452,19.4422291 C7.25806452,20.1455972 6.88858935,20.7972624 6.28502902,21.1584295 L3.0269645,23.1080366 C2.07913318,23.6752135 0.850976404,23.366632 0.283799571,22.4188007 C0.0980803893,22.1084381 2.0190442e-15,21.7535219 0,21.3918362 L0,3.58469444 L0.00548573643,3.43543209 L0.00548573643,3.43543209 L0,3.5715689 C3.0881846e-16,2.4669994 0.8954305,1.5715689 2,1.5715689 C2.36889529,1.5715689 2.73060353,1.67359571 3.04512412,1.86636639 L15,9.19354839 L26.9548759,1.86636639 C27.2693965,1.67359571 27.6311047,1.5715689 28,1.5715689 C29.1045695,1.5715689 30,2.4669994 30,3.5715689 L30,3.5715689 Z'
                          />
                          <polygon
                            id='Rectangle'
                            opacity='0.077704'
                            fill={theme.palette.common.black}
                            points='0 8.58870968 7.25806452 12.7505183 7.25806452 16.8305646'
                          />
                          <polygon
                            id='Rectangle'
                            opacity='0.077704'
                            fill={theme.palette.common.black}
                            points='0 8.58870968 7.25806452 12.6445567 7.25806452 15.1370162'
                          />
                          <polygon
                            id='Rectangle'
                            opacity='0.077704'
                            fill={theme.palette.common.black}
                            points='22.7419355 8.58870968 30 12.7417372 30 16.9537453'
                            transform='translate(26.370968, 12.771227) scale(-1, 1) translate(-26.370968, -12.771227) '
                          />
                          <polygon
                            id='Rectangle'
                            opacity='0.077704'
                            fill={theme.palette.common.black}
                            points='22.7419355 8.58870968 30 12.6409734 30 15.2601969'
                            transform='translate(26.370968, 11.924453) scale(-1, 1) translate(-26.370968, -11.924453) '
                          />
                          <path
                            id='Rectangle'
                            fillOpacity='0.15'
                            fill={theme.palette.common.white}
                            d='M3.04512412,1.86636639 L15,9.19354839 L15,9.19354839 L15,17.1774194 L0,8.58649679 L0,3.5715689 C3.0881846e-16,2.4669994 0.8954305,1.5715689 2,1.5715689 C2.36889529,1.5715689 2.73060353,1.67359571 3.04512412,1.86636639 Z'
                          />
                          <path
                            id='Rectangle'
                            fillOpacity='0.35'
                            fill={theme.palette.common.white}
                            transform='translate(22.500000, 8.588710) scale(-1, 1) translate(-22.500000, -8.588710) '
                            d='M18.0451241,1.86636639 L30,9.19354839 L30,9.19354839 L30,17.1774194 L15,8.58649679 L15,3.5715689 C15,2.4669994 15.8954305,1.5715689 17,1.5715689 C17.3688953,1.5715689 17.7306035,1.67359571 18.0451241,1.86636639 Z'
                          />
                        </g>
                      </g>
                    </g>
                  </svg>
                  <Typography
                    variant='h6'
                    sx={{ ml: 2.5, fontWeight: 600, lineHeight: 'normal', textTransform: 'uppercase' }}
                  >
                    {themeConfig.templateName}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    Office 149, 450 South Brand Brooklyn
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    San Diego County, CA 91905, USA
                  </Typography>
                  <Typography variant='body2'>+1 (123) 456 7891, +44 (876) 543 2198</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xl={6} xs={12}>
              <DatePickerWrapper sx={{ '& .react-datepicker-wrapper': { width: 'auto' } }}>
                <Box
                  sx={{ display: 'flex', flexDirection: 'column', alignItems: { xl: 'flex-end', xs: 'flex-start' } }}
                >
                  <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
                    <Typography variant='h6' sx={{ mr: 2, width: '105px' }}>
                      Invoice
                    </Typography>
                    <TextField
                      size='small'
                      value={data.invoice.id}
                      sx={{ width: { sm: '250px', xs: '170px' } }}
                      InputProps={{
                        disabled: true,
                        startAdornment: <InputAdornment position='start'>#</InputAdornment>
                      }}
                    />
                  </Box>
                  <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
                    <Typography variant='body2' sx={{ mr: 3, width: '100px' }}>
                      Date Issued:
                    </Typography>
                    <DatePicker
                      id='issue-date'
                      selected={issueDate}
                      showDisabledMonthNavigation
                      customInput={<CustomInput />}
                      onChange={date => setIssueDate(date)}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant='body2' sx={{ mr: 3, width: '100px' }}>
                      Date Due:
                    </Typography>
                    <DatePicker
                      selected={dueDate}
                      showDisabledMonthNavigation
                      customInput={<CustomInput />}
                      onChange={date => setDueDate(date)}
                    />
                  </Box>
                </Box>
              </DatePickerWrapper>
            </Grid>
          </Grid>
        </CardContent>

        <Divider />

        <CardContent>
          <Grid container>
            <Grid item xs={12} sm={6} sx={{ mb: { lg: 0, xs: 4 } }}>
              <Typography variant='body2' sx={{ mb: 3.5, color: 'text.primary', fontWeight: 600 }}>
                Invoice To:
              </Typography>
              <Select size='small' value={selected} onChange={handleInvoiceChange} sx={{ mb: 4, width: '200px' }}>
                {clients !== undefined &&
                  clients.map(client => (
                    <MenuItem key={client.name} value={client.name}>
                      {client.name}
                    </MenuItem>
                  ))}
              </Select>
              {selectedClient !== null ? (
                <Box>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    {selectedClient.company}
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    {selectedClient.address}
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    {selectedClient.contact}
                  </Typography>
                  <Typography variant='body2' sx={{ mb: 1 }}>
                    {selectedClient.companyEmail}
                  </Typography>
                </Box>
              ) : null}
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: ['flex-start', 'flex-end'] }}>
              <div>
                <Typography variant='body2' sx={{ mb: 3.5, color: 'text.primary', fontWeight: 600 }}>
                  Bill To:
                </Typography>
                <TableContainer>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <MUITableCell>Total Due:</MUITableCell>
                        <MUITableCell>{data.paymentDetails.totalDue}</MUITableCell>
                      </TableRow>
                      <TableRow>
                        <MUITableCell>Bank name:</MUITableCell>
                        <MUITableCell>{data.paymentDetails.bankName}</MUITableCell>
                      </TableRow>
                      <TableRow>
                        <MUITableCell>Country:</MUITableCell>
                        <MUITableCell>{data.paymentDetails.country}</MUITableCell>
                      </TableRow>
                      <TableRow>
                        <MUITableCell>IBAN:</MUITableCell>
                        <MUITableCell>{data.paymentDetails.iban}</MUITableCell>
                      </TableRow>
                      <TableRow>
                        <MUITableCell>SWIFT code:</MUITableCell>
                        <MUITableCell>{data.paymentDetails.swiftCode}</MUITableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>
            </Grid>
          </Grid>
        </CardContent>

        <Divider />

        <RepeaterWrapper>
          <Repeater count={count}>
            {i => {
              const Tag = i === 0 ? Box : Collapse

              return (
                <Tag key={i} className='repeater-wrapper' {...(i !== 0 ? { in: true } : {})}>
                  <Grid container>
                    <RepeatingContent item xs={12}>
                      <Grid container sx={{ py: 4, width: '100%', pr: { lg: 0, xs: 4 } }}>
                        <Grid item lg={6} md={5} xs={12} sx={{ px: 4, my: { lg: 0, xs: 2 } }}>
                          <Typography
                            variant='body2'
                            className='col-title'
                            sx={{ fontWeight: '600', mb: { md: 2, xs: 0 } }}
                          >
                            Item
                          </Typography>
                          <Select fullWidth size='small' defaultValue='App Design'>
                            <MenuItem value='App Design'>App Design</MenuItem>
                            <MenuItem value='App Customization'>App Customization</MenuItem>
                            <MenuItem value='ABC Template'>ABC Template</MenuItem>
                            <MenuItem value='App Development'>App Development</MenuItem>
                          </Select>
                          <TextField
                            rows={2}
                            fullWidth
                            multiline
                            size='small'
                            sx={{ mt: 3.5 }}
                            defaultValue='Customization & Bug Fixes'
                          />
                        </Grid>
                        <Grid item lg={2} md={3} xs={12} sx={{ px: 4, my: { lg: 0, xs: 2 } }}>
                          <Typography
                            variant='body2'
                            className='col-title'
                            sx={{ fontWeight: '600', mb: { md: 2, xs: 0 } }}
                          >
                            Cost
                          </Typography>
                          <TextField
                            size='small'
                            type='number'
                            placeholder='24'
                            defaultValue='24'
                            InputProps={{ inputProps: { min: 0 } }}
                          />
                          <Box sx={{ mt: 3.5 }}>
                            <Typography component='span' variant='body2'>
                              Discount:
                            </Typography>{' '}
                            <Typography component='span' variant='body2'>
                              0%
                            </Typography>
                            <Tooltip title='Tax 1' placement='top'>
                              <Typography component='span' variant='body2' sx={{ mx: 2 }}>
                                0%
                              </Typography>
                            </Tooltip>
                            <Tooltip title='Tax 2' placement='top'>
                              <Typography component='span' variant='body2'>
                                0%
                              </Typography>
                            </Tooltip>
                          </Box>
                        </Grid>
                        <Grid item lg={2} md={2} xs={12} sx={{ px: 4, my: { lg: 0, xs: 2 } }}>
                          <Typography
                            variant='body2'
                            className='col-title'
                            sx={{ fontWeight: '600', mb: { md: 2, xs: 0 } }}
                          >
                            Hours
                          </Typography>
                          <TextField
                            size='small'
                            type='number'
                            placeholder='1'
                            defaultValue='1'
                            InputProps={{ inputProps: { min: 0 } }}
                          />
                        </Grid>
                        <Grid item lg={2} md={1} xs={12} sx={{ px: 4, my: { lg: 0 }, mt: 2 }}>
                          <Typography
                            variant='body2'
                            className='col-title'
                            sx={{ fontWeight: '600', mb: { md: 2, xs: 0 } }}
                          >
                            Price
                          </Typography>
                          <Typography>$24.00</Typography>
                        </Grid>
                      </Grid>
                      <InvoiceAction>
                        <IconButton size='small' onClick={deleteForm}>
                          <Close fontSize='small' />
                        </IconButton>
                      </InvoiceAction>
                    </RepeatingContent>
                  </Grid>
                </Tag>
              )
            }}
          </Repeater>

          <Grid container sx={{ mt: 4 }}>
            <Grid item xs={12} sx={{ px: 0 }}>
              <Button
                size='small'
                variant='contained'
                startIcon={<Plus fontSize='small' />}
                onClick={() => setCount(count + 1)}
              >
                Add Item
              </Button>
            </Grid>
          </Grid>
        </RepeaterWrapper>

        <Divider />

        <CardContent>
          <Grid container>
            <Grid item xs={12} sm={9} sx={{ order: { sm: 1, xs: 2 } }}>
              <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
                <Typography variant='body2' sx={{ mr: 2, fontWeight: 600 }}>
                  Salesperson:
                </Typography>
                <TextField size='small' sx={{ maxWidth: '150px' }} defaultValue='Tommy Shelby' />
              </Box>
              <TextField size='small' sx={{ maxWidth: '300px' }} defaultValue='Thanks for your business' />
            </Grid>
            <Grid item xs={12} sm={3} sx={{ mb: { sm: 0, xs: 4 }, order: { sm: 2, xs: 1 } }}>
              <CalcWrapper>
                <Typography variant='body2'>Subtotal:</Typography>
                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                  $1800
                </Typography>
              </CalcWrapper>
              <CalcWrapper>
                <Typography variant='body2'>Discount:</Typography>
                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                  $28
                </Typography>
              </CalcWrapper>
              <CalcWrapper>
                <Typography variant='body2'>Tax:</Typography>
                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                  21%
                </Typography>
              </CalcWrapper>
              <Divider />
              <CalcWrapper>
                <Typography variant='body2'>Total:</Typography>
                <Typography variant='body2' sx={{ fontWeight: 600 }}>
                  $1690
                </Typography>
              </CalcWrapper>
            </Grid>
          </Grid>
        </CardContent>

        <Divider />

        <CardContent>
          <InputLabel htmlFor='invoice-note' sx={{ mb: 2 }}>
            Note:
          </InputLabel>
          <TextField
            rows={2}
            fullWidth
            multiline
            id='invoice-note'
            defaultValue='It was a pleasure working with you and your team. We hope you will keep us in mind for future freelance projects. Thank You!'
          />
        </CardContent>
      </Card>
    )
  } else {
    return null
  }
}

export default EditCard
