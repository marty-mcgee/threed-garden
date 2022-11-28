// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import PageHeader from '#/ui/~core/components/page-header'
import CardSnippet from '#/ui/~core/components/card-snippet'

// ** Styled Component Import
import { EditorWrapper } from '#/ui/~core/styles/libs/react-draft-wysiwyg'

// ** Demo Components Imports
import EditorControlled from '#/ui/views/forms/form-elements/editor/EditorControlled'
import EditorUncontrolled from '#/ui/views/forms/form-elements/editor/EditorUncontrolled'

// ** Source code imports
import * as source from '#/ui/views/forms/form-elements/editor/EditorSourceCode'

// ** Styles
// import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css'

const Editors = () => {
  return (
    <EditorWrapper>
      <Grid container spacing={6} className='match-height'>
        <PageHeader
          title={
            <Typography variant='h5'>
              <Link href='https://jpuri.github.io/react-draft-wysiwyg/#/' target='_blank'>
                React Draft Wysiwyg
              </Link>
            </Typography>
          }
          subtitle={<Typography variant='body2'>A Wysiwyg Built on ReactJS and DraftJS</Typography>}
        />
        <Grid item xs={12}>
          <CardSnippet
            sx={{ overflow: 'visible' }}
            title='Controlled Wysiwyg Editor'
            code={{
              tsx: null,
              jsx: source.EditorControlledJSXCode,
            }}>
            <EditorControlled />
          </CardSnippet>
        </Grid>
        <Grid item xs={12}>
          <CardSnippet
            sx={{ overflow: 'visible' }}
            title='Uncontrolled Wysiwyg Editor'
            code={{
              tsx: null,
              jsx: source.EditorUncontrolledJSXCode,
            }}>
            <EditorUncontrolled />
          </CardSnippet>
        </Grid>
      </Grid>
    </EditorWrapper>
  )
}

export default Editors
