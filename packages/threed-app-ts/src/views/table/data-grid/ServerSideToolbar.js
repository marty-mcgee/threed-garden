// ** MUI Imports
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import { GridToolbarContainer, GridToolbarExport } from '@mui/x-data-grid'

// ** Icons Imports
import Close from 'mdi-material-ui/Close'
import Magnify from 'mdi-material-ui/Magnify'

const StyledGridToolbarContainer = styled(GridToolbarContainer)({
  p: 2,
  pb: 0,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  justifyContent: 'space-between'
})

const ServerSideToolbar = props => {
  return (
    <StyledGridToolbarContainer>
      <Box>
        <GridToolbarExport printOptions={{ disableToolbarButton: true }} />
      </Box>
      <TextField
        variant='standard'
        value={props.value}
        onChange={props.onChange}
        placeholder='Search…'
        InputProps={{
          startAdornment: <Magnify fontSize='small' />,
          endAdornment: (
            <IconButton size='small' title='Clear' aria-label='Clear' onClick={props.clearSearch}>
              <Close fontSize='small' />
            </IconButton>
          )
        }}
        sx={{
          width: {
            xs: 1,
            sm: 'auto'
          },
          m: theme => theme.spacing(1, 0.5, 1.5),
          '& .MuiSvgIcon-root': {
            mr: 0.5
          },
          '& .MuiInput-underline:before': {
            borderBottom: 1,
            borderColor: 'divider'
          }
        }}
      />
    </StyledGridToolbarContainer>
  )
}

export default ServerSideToolbar
