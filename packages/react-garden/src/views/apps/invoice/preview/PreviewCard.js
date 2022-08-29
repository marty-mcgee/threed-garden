// ** React Imports
import { useRef } from 'react'

// ** Next Import
import Link from 'next/link'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Table from '@mui/material/Table'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import TableRow from '@mui/material/TableRow'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'
import { styled, useTheme } from '@mui/material/styles'
import TableContainer from '@mui/material/TableContainer'
import TableCell from '@mui/material/TableCell'

// ** Third Party Imports
import ReactToPdf from 'react-to-pdf'

// ** Configs
import themeConfig from 'src/configs/themeConfig'

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

const PreviewCard = ({ data }) => {
  // ** Hook
  const theme = useTheme()

  // ** Ref
  const PreviewRef = useRef(null)
  if (data) {
    return (
      <Card>
        <Box ref={PreviewRef}>
          <CardContent>
            <Grid container>
              <Grid item sm={6} xs={12} sx={{ mb: { sm: 0, xs: 4 } }}>
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
              <Grid item sm={6} xs={12}>
                <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                  <Table sx={{ maxWidth: '200px' }}>
                    <TableBody>
                      <TableRow>
                        <MUITableCell>
                          <Typography variant='h6'>Invoice</Typography>
                        </MUITableCell>
                        <MUITableCell>
                          <Typography variant='h6'>{`#${data.invoice.id}`}</Typography>
                        </MUITableCell>
                      </TableRow>
                      <TableRow>
                        <MUITableCell>
                          <Typography variant='body2'>Date Issued:</Typography>
                        </MUITableCell>
                        <MUITableCell>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            {data.invoice.issuedDate}
                          </Typography>
                        </MUITableCell>
                      </TableRow>
                      <TableRow>
                        <MUITableCell>
                          <Typography variant='body2'>Date Due:</Typography>
                        </MUITableCell>
                        <MUITableCell>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            {data.invoice.dueDate}
                          </Typography>
                        </MUITableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </Grid>
            </Grid>
          </CardContent>

          <Divider />

          <CardContent>
            <Grid container>
              <Grid item xs={12} sm={6} sx={{ mb: { lg: 0, xs: 4 } }}>
                <Typography variant='body2' sx={{ mb: 3.5, fontWeight: 600 }}>
                  Invoice To:
                </Typography>
                <Typography variant='body2' sx={{ mb: 2 }}>
                  {data.invoice.name}
                </Typography>
                <Typography variant='body2' sx={{ mb: 2 }}>
                  {data.invoice.company}
                </Typography>
                <Typography variant='body2' sx={{ mb: 2 }}>
                  {data.invoice.address}
                </Typography>
                <Typography variant='body2' sx={{ mb: 2 }}>
                  {data.invoice.contact}
                </Typography>
                <Typography variant='body2' sx={{ mb: 2 }}>
                  {data.invoice.companyEmail}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: ['flex-start', 'flex-end'] }}>
                <div>
                  <Typography variant='body2' sx={{ mb: 3.5, fontWeight: 600 }}>
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

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>hours</TableCell>
                  <TableCell>qty</TableCell>
                  <TableCell>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Premium Branding Package</TableCell>
                  <TableCell>Branding & Promotion</TableCell>
                  <TableCell>48</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>$32</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Social Media</TableCell>
                  <TableCell>Social media templates</TableCell>
                  <TableCell>42</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>$28</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Web Design</TableCell>
                  <TableCell>Web designing package</TableCell>
                  <TableCell>46</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>$24</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>SEO</TableCell>
                  <TableCell>Search engine optimization</TableCell>
                  <TableCell>40</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>$22</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <CardContent>
            <Grid container>
              <Grid item xs={12} sm={7} lg={9} sx={{ order: { sm: 1, xs: 2 } }}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Typography variant='body2' sx={{ mr: 2, fontWeight: 600 }}>
                    Salesperson:
                  </Typography>
                  <Typography variant='body2'>Tommy Shelby</Typography>
                </Box>

                <Typography variant='body2'>Thanks for your business</Typography>
              </Grid>
              <Grid item xs={12} sm={5} lg={3} sx={{ mb: { sm: 0, xs: 4 }, order: { sm: 2, xs: 1 } }}>
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
            <Typography variant='body2'>
              <strong>Note:</strong> It was a pleasure working with you and your team. We hope you will keep us in mind
              for future freelance projects. Thank You!
            </Typography>
          </CardContent>
        </Box>
        <CardContent>
          <Box sx={{ mt: 4, width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
            <Link href={`/apps/invoice/print/${data.invoice.id}`} passHref>
              <Button sx={{ mr: 4 }} target='_blank' component='a' variant='contained'>
                Print
              </Button>
            </Link>

            <ReactToPdf scale={0.845} targetRef={PreviewRef} filename={`invoice-${data.invoice.id}.pdf`}>
              {({ toPdf }) => {
                return (
                  <Button variant='contained' color='success' onClick={toPdf}>
                    Download
                  </Button>
                )
              }}
            </ReactToPdf>
          </Box>
        </CardContent>
      </Card>
    )
  } else {
    return null
  }
}

export default PreviewCard
