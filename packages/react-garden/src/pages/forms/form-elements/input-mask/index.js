// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import PageHeader from 'src/@core/components/page-header'
import CardSnippet from 'src/@core/components/card-snippet'

// ** Styled Component
import CleaveWrapper from 'src/@core/styles/libs/react-cleave'

// ** Example Import
import InputMaskExamples from 'src/views/forms/form-elements/input-mask/InputMaskExamples'

// ** Source code imports
import * as source from 'src/views/forms/form-elements/input-mask/InputMaskSourceCode'

const InputMask = () => {
  return (
    <CleaveWrapper>
      <Grid container spacing={6}>
        <PageHeader
          title={
            <Typography variant='h5'>
              <Link href='https://github.com/nosir/cleave.js' target='_blank'>
                Cleave.js
              </Link>
            </Typography>
          }
          subtitle={<Typography variant='body2'>Format input text content when you are typing</Typography>}
        />
        <Grid item xs={12}>
          <CardSnippet
            title='Input Masks'
            code={{
              tsx: null,
              jsx: source.InputMaskExamplesJSXCode
            }}
          >
            <InputMaskExamples />
          </CardSnippet>
        </Grid>
      </Grid>
    </CleaveWrapper>
  )
}

export default InputMask
