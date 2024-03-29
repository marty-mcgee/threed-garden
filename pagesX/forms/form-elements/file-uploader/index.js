// ** MUI Imports
import Grid from '@mui/material/Grid'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import PageHeader from '#/ui/components/page-header'
import CardSnippet from '#/ui/components/card-snippet'

// ** Styled Component
import DropzoneWrapper from '#/ui/styles/react-dropzone'

// ** Demo Components Imports
import FileUploaderSingle from '#/ui/forms/form-elements/file-uploader/FileUploaderSingle'
import FileUploaderMultiple from '#/ui/forms/form-elements/file-uploader/FileUploaderMultiple'
import FileUploaderRestrictions from '#/ui/forms/form-elements/file-uploader/FileUploaderRestrictions'

// ** Source code imports
import * as source from '#/ui/forms/form-elements/file-uploader/FileUploaderSourceCode'

const FileUploader = () => {
  return (
    <DropzoneWrapper>
      <Grid container spacing={6} className='match-height'>
        <PageHeader
          title={
            <Typography variant='h5'>
              <Link href='https://github.com/react-dropzone/react-dropzone/' target='_blank'>
                React Dropzone
              </Link>
            </Typography>
          }
          subtitle={<Typography variant='body2'>Simple HTML5 drag-drop zone with React.js</Typography>}
        />
        <Grid item xs={12}>
          <CardSnippet
            title='Upload Multiple Files'
            code={{
              tsx: null,
              jsx: source.FileUploaderMultipleJSXCode,
            }}>
            <FileUploaderMultiple />
          </CardSnippet>
        </Grid>
        <Grid item xs={12}>
          <CardSnippet
            title='Upload Single Files'
            code={{
              tsx: null,
              jsx: source.FileUploaderSingleJSXCode,
            }}>
            <FileUploaderSingle />
          </CardSnippet>
        </Grid>
        <Grid item xs={12}>
          <CardSnippet
            title='Upload Files with Restrictions'
            code={{
              tsx: null,
              jsx: source.FileUploaderRestrictionsJSXCode,
            }}>
            <FileUploaderRestrictions />
          </CardSnippet>
        </Grid>
      </Grid>
    </DropzoneWrapper>
  )
}

export default FileUploader
