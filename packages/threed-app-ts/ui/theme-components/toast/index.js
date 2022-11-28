// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import PageHeader from '#/ui/~core/components/page-header'
import CardSnippet from '#/ui/~core/components/card-snippet'

// ** Demo Components
import ToastBlank from '#/ui/views/components/toast/ToastBlank'
import ToastError from '#/ui/views/components/toast/ToastError'
import ToastEmoji from '#/ui/views/components/toast/ToastEmoji'
import ToastThemed from '#/ui/views/components/toast/ToastThemed'
import ToastCustom from '#/ui/views/components/toast/ToastCustom'
import ToastSuccess from '#/ui/views/components/toast/ToastSuccess'
import ToastPromise from '#/ui/views/components/toast/ToastPromise'
import ToastMultiLine from '#/ui/views/components/toast/ToastMultiLine'
import ToastCustomPosition from '#/ui/views/components/toast/ToastCustomPosition'

// ** Source code imports
import * as source from '#/ui/views/components/toast/ToastSourceCode'

const ReactHotToasts = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <PageHeader
        subtitle={<Typography variant='body2'>Smoking hot React notifications.</Typography>}
        title={
          <Typography variant='h5'>
            <Link href='https://github.com/timolins/react-hot-toast' target='_blank'>
              React Hot Toasts
            </Link>
          </Typography>
        }
      />
      <Grid item xs={12} sm={6} md={4}>
        <CardSnippet
          title=''
          code={{
            tsx: null,
            jsx: source.ToastBlankJSXCode,
          }}>
          <ToastBlank />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardSnippet
          title=''
          code={{
            tsx: null,
            jsx: source.ToastMultiLineJSXCode,
          }}>
          <ToastMultiLine />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardSnippet
          title=''
          code={{
            tsx: null,
            jsx: source.ToastSuccessJSXCode,
          }}>
          <ToastSuccess />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardSnippet
          title=''
          code={{
            tsx: null,
            jsx: source.ToastErrorJSXCode,
          }}>
          <ToastError />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardSnippet
          title=''
          code={{
            tsx: null,
            jsx: source.ToastPromiseJSXCode,
          }}>
          <ToastPromise />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardSnippet
          title=''
          code={{
            tsx: null,
            jsx: source.ToastEmojiJSXCode,
          }}>
          <ToastEmoji />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardSnippet
          title=''
          code={{
            tsx: null,
            jsx: source.ToastThemedJSXCode,
          }}>
          <ToastThemed />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardSnippet
          title=''
          code={{
            tsx: null,
            jsx: source.ToastCustomJSXCode,
          }}>
          <ToastCustom />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <CardSnippet
          title=''
          code={{
            tsx: null,
            jsx: source.ToastCustomPositionJSXCode,
          }}>
          <ToastCustomPosition />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default ReactHotToasts
