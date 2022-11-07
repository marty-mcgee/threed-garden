// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import { styled } from '@mui/material/styles'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import MuiToggleButton from '@mui/material/ToggleButton'

// ** Icons Imports
import FormatBold from 'mdi-material-ui/FormatBold'
import FormatItalic from 'mdi-material-ui/FormatItalic'
import FormatUnderline from 'mdi-material-ui/FormatUnderline'
import FormatColorFill from 'mdi-material-ui/FormatColorFill'
import FormatAlignLeft from 'mdi-material-ui/FormatAlignLeft'
import FormatAlignRight from 'mdi-material-ui/FormatAlignRight'
import FormatAlignCenter from 'mdi-material-ui/FormatAlignCenter'
import FormatAlignJustify from 'mdi-material-ui/FormatAlignJustify'

// Styled ToggleButton component
const ToggleButton = styled(MuiToggleButton)(({ theme }) => ({
  margin: theme.spacing(1),
  border: 'none !important',
  padding: theme.spacing(2),
  '&:not(:first-of-type)': {
    borderRadius: `${theme.shape.borderRadius}px !important`
  },
  '&:first-of-type': {
    borderRadius: `${theme.shape.borderRadius}px !important`
  }
}))

const ButtonToggleCustomized = () => {
  // ** States
  const [alignment, setAlignment] = useState('left')
  const [formats, setFormats] = useState(() => ['italic'])

  const handleAlignment = (event, newAlignment) => {
    setAlignment(newAlignment)
  }

  const handleFormat = (event, newFormats) => {
    setFormats(newFormats)
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
      <ToggleButtonGroup exclusive value={alignment} onChange={handleAlignment} aria-label='text alignment'>
        <ToggleButton value='left' aria-label='left aligned'>
          <FormatAlignLeft />
        </ToggleButton>
        <ToggleButton value='center' aria-label='center aligned'>
          <FormatAlignCenter />
        </ToggleButton>
        <ToggleButton value='right' aria-label='right aligned'>
          <FormatAlignRight />
        </ToggleButton>
        <ToggleButton value='justify' aria-label='justified' disabled>
          <FormatAlignJustify />
        </ToggleButton>
      </ToggleButtonGroup>
      <Divider flexItem orientation='vertical' sx={{ m: 1 }} />
      <ToggleButtonGroup value={formats} onChange={handleFormat} aria-label='text alignment'>
        <ToggleButton value='bold' aria-label='bold'>
          <FormatBold />
        </ToggleButton>
        <ToggleButton value='italic' aria-label='italic'>
          <FormatItalic />
        </ToggleButton>
        <ToggleButton value='underlined' aria-label='underlined'>
          <FormatUnderline />
        </ToggleButton>
        <ToggleButton value='color' aria-label='color' disabled>
          <FormatColorFill />
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  )
}

export default ButtonToggleCustomized
