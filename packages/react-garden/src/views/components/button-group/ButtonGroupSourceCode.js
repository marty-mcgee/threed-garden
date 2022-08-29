export const ButtonGroupBasicJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'

const ButtonGroupBasic = () => {
  return (
    <div className='demo-space-y'>
      <div>
        <ButtonGroup variant='outlined'>
          <Button>One</Button>
          <Button>Two</Button>
          <Button>Three</Button>
        </ButtonGroup>
      </div>
      <div>
        <ButtonGroup variant='contained'>
          <Button>One</Button>
          <Button>Two</Button>
          <Button>Three</Button>
        </ButtonGroup>
      </div>
      <div>
        <ButtonGroup variant='text'>
          <Button>One</Button>
          <Button>Two</Button>
          <Button>Three</Button>
        </ButtonGroup>
      </div>
    </div>
  )
}

export default ButtonGroupBasic
`}</code>
  </pre>
)

export const ButtonGroupColorsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'

const ButtonGroupColor = () => {
  return (
    <div className='demo-space-x'>
      <ButtonGroup variant='outlined' color='secondary'>
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </ButtonGroup>

      <ButtonGroup variant='outlined' color='success'>
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </ButtonGroup>

      <ButtonGroup variant='outlined' color='error'>
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </ButtonGroup>

      <ButtonGroup variant='outlined' color='warning'>
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </ButtonGroup>

      <ButtonGroup variant='outlined' color='info'>
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </ButtonGroup>
    </div>
  )
}

export default ButtonGroupColor
`}</code>
  </pre>
)

export const ButtonGroupSplitJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useRef, useState, Fragment } from 'react'

// ** MUI Imports
import Grow from '@mui/material/Grow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Popper from '@mui/material/Popper'
import MenuItem from '@mui/material/MenuItem'
import MenuList from '@mui/material/MenuList'
import ButtonGroup from '@mui/material/ButtonGroup'
import ClickAwayListener from '@mui/material/ClickAwayListener'

// ** Icons Imports
import MenuDown from 'mdi-material-ui/MenuDown'

const options = ['Create a merge commit', 'Squash and merge', 'Rebase and merge']

const ButtonGroupSplit = () => {
  // ** States
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(1)

  // ** Ref
  const anchorRef = useRef(null)

  const handleClick = () => {
    console.info(You clicked '{options[selectedIndex]}')
  }

  const handleMenuItemClick = (event, index) => {
    setSelectedIndex(index)
    setOpen(false)
  }

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Fragment>
      <ButtonGroup variant='contained' ref={anchorRef} aria-label='split button'>
        <Button onClick={handleClick}>{options[selectedIndex]}</Button>
        <Button
          size='small'
          aria-haspopup='menu'
          onClick={handleToggle}
          aria-label='select merge strategy'
          aria-expanded={open ? 'true' : undefined}
          aria-controls={open ? 'split-button-menu' : undefined}
        >
          <MenuDown />
        </Button>
      </ButtonGroup>
      <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal>
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id='split-button-menu'>
                  {options.map((option, index) => (
                    <MenuItem
                      key={option}
                      disabled={index === 2}
                      selected={index === selectedIndex}
                      onClick={event => handleMenuItemClick(event, index)}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Fragment>
  )
}

export default ButtonGroupSplit
`}</code>
  </pre>
)

export const ButtonToggleColorsJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

const ButtonToggleColors = () => {
  // ** State
  const [alignment, setAlignment] = useState('web')

  const handleAlignment = (event, newAlignment) => {
    setAlignment(newAlignment)
  }

  return (
    <div className='demo-space-x'>
      <ToggleButtonGroup exclusive color='primary' value={alignment} onChange={handleAlignment}>
        <ToggleButton value='web'>Web</ToggleButton>
        <ToggleButton value='android'>Android</ToggleButton>
        <ToggleButton value='ios'>iOS</ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup exclusive color='secondary' value={alignment} onChange={handleAlignment}>
        <ToggleButton value='web'>Web</ToggleButton>
        <ToggleButton value='android'>Android</ToggleButton>
        <ToggleButton value='ios'>iOS</ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup exclusive color='success' value={alignment} onChange={handleAlignment}>
        <ToggleButton value='web'>Web</ToggleButton>
        <ToggleButton value='android'>Android</ToggleButton>
        <ToggleButton value='ios'>iOS</ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup exclusive color='error' value={alignment} onChange={handleAlignment}>
        <ToggleButton value='web'>Web</ToggleButton>
        <ToggleButton value='android'>Android</ToggleButton>
        <ToggleButton value='ios'>iOS</ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup exclusive color='warning' value={alignment} onChange={handleAlignment}>
        <ToggleButton value='web'>Web</ToggleButton>
        <ToggleButton value='android'>Android</ToggleButton>
        <ToggleButton value='ios'>iOS</ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup exclusive color='info' value={alignment} onChange={handleAlignment}>
        <ToggleButton value='web'>Web</ToggleButton>
        <ToggleButton value='android'>Android</ToggleButton>
        <ToggleButton value='ios'>iOS</ToggleButton>
      </ToggleButtonGroup>
    </div>
  )
}

export default ButtonToggleColors
`}</code>
  </pre>
)

export const ButtonGroupVerticalJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'

const ButtonGroupVertical = () => {
  return (
    <div className='demo-space-x'>
      <ButtonGroup variant='outlined' orientation='vertical'>
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </ButtonGroup>
      <ButtonGroup variant='contained' orientation='vertical'>
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </ButtonGroup>
      <ButtonGroup variant='text' orientation='vertical'>
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </ButtonGroup>
    </div>
  )
}

export default ButtonGroupVertical
`}</code>
  </pre>
)

export const ButtonToggleMultipleJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

// ** Icons Imports
import FormatBold from 'mdi-material-ui/FormatBold'
import FormatItalic from 'mdi-material-ui/FormatItalic'
import FormatUnderline from 'mdi-material-ui/FormatUnderline'
import FormatColorFill from 'mdi-material-ui/FormatColorFill'

const ButtonToggleMultiple = () => {
  // ** State
  const [formats, setFormats] = useState(() => ['bold', 'italic'])

  const handleFormat = (event, newFormats) => {
    setFormats(newFormats)
  }

  return (
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
  )
}

export default ButtonToggleMultiple
`}</code>
  </pre>
)

export const ButtonToggleCustomizedJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
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
    borderRadius: {theme.shape.borderRadius}px !important
  },
  '&:first-of-type': {
    borderRadius: {theme.shape.borderRadius}px !important
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
`}</code>
  </pre>
)

export const ButtonToggleSimpleJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

// ** Icons Imports
import FormatAlignLeft from 'mdi-material-ui/FormatAlignLeft'
import FormatAlignRight from 'mdi-material-ui/FormatAlignRight'
import FormatAlignCenter from 'mdi-material-ui/FormatAlignCenter'
import FormatAlignJustify from 'mdi-material-ui/FormatAlignJustify'

const ButtonToggleSimple = () => {
  // ** State
  const [alignment, setAlignment] = useState('left')

  const handleAlignment = (event, newAlignment) => {
    setAlignment(newAlignment)
  }

  return (
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
  )
}

export default ButtonToggleSimple
`}</code>
  </pre>
)

export const ButtonToggleEnforceValueJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

// ** Icons Imports
import Laptop from 'mdi-material-ui/Laptop'
import Monitor from 'mdi-material-ui/Monitor'
import Cellphone from 'mdi-material-ui/Cellphone'
import FormatAlignLeft from 'mdi-material-ui/FormatAlignLeft'
import FormatAlignRight from 'mdi-material-ui/FormatAlignRight'
import FormatAlignCenter from 'mdi-material-ui/FormatAlignCenter'
import FormatAlignJustify from 'mdi-material-ui/FormatAlignJustify'

const ButtonToggleEnforceValue = () => {
  // ** States
  const [formats, setFormats] = useState(() => ['phone'])
  const [alignment, setAlignment] = useState('left')

  const handleAlignment = (event, newAlignment) => {
    if (newAlignment !== null) {
      setAlignment(newAlignment)
    }
  }

  const handleFormat = (event, newFormats) => {
    if (newFormats.length) {
      setFormats(newFormats)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sm={6}>
        <Typography sx={{ fontWeight: 500, mb: 2 }}>Exclusive Selection</Typography>
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
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography sx={{ fontWeight: 500, mb: 2 }}>Multiple Selection</Typography>
        <ToggleButtonGroup value={formats} onChange={handleFormat} aria-label='device'>
          <ToggleButton value='laptop' aria-label='laptop'>
            <Laptop />
          </ToggleButton>
          <ToggleButton value='desktop' aria-label='desktop'>
            <Monitor />
          </ToggleButton>
          <ToggleButton value='phone' aria-label='phone'>
            <Cellphone />
          </ToggleButton>
        </ToggleButtonGroup>
      </Grid>
    </Grid>
  )
}

export default ButtonToggleEnforceValue
`}</code>
  </pre>
)

export const ButtonGroupSizesJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** MUI Imports
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'

const ButtonGroupSizes = () => {
  return (
    <div className='demo-space-y'>
      <div>
        <ButtonGroup size='small'>
          <Button>One</Button>
          <Button>Two</Button>
          <Button>Three</Button>
        </ButtonGroup>
      </div>
      <div>
        <ButtonGroup size='medium'>
          <Button>One</Button>
          <Button>Two</Button>
          <Button>Three</Button>
        </ButtonGroup>
      </div>
      <div>
        <ButtonGroup size='large'>
          <Button>One</Button>
          <Button>Two</Button>
          <Button>Three</Button>
        </ButtonGroup>
      </div>
    </div>
  )
}

export default ButtonGroupSizes
`}</code>
  </pre>
)

export const ButtonToggleSizesJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

// ** Icons Imports
import FormatAlignLeft from 'mdi-material-ui/FormatAlignLeft'
import FormatAlignRight from 'mdi-material-ui/FormatAlignRight'
import FormatAlignCenter from 'mdi-material-ui/FormatAlignCenter'
import FormatAlignJustify from 'mdi-material-ui/FormatAlignJustify'

const ButtonToggleSizes = () => {
  // ** State
  const [alignment, setAlignment] = useState('left')

  const handleAlignment = (event, newAlignment) => {
    setAlignment(newAlignment)
  }

  return (
    <div className='demo-space-y'>
      <div>
        <ToggleButtonGroup
          exclusive
          size='small'
          value={alignment}
          onChange={handleAlignment}
          aria-label='text alignment'
        >
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
      </div>
      <div>
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
      </div>
      <div>
        <ToggleButtonGroup
          exclusive
          size='large'
          value={alignment}
          onChange={handleAlignment}
          aria-label='text alignment'
        >
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
      </div>
    </div>
  )
}

export default ButtonToggleSizes
`}</code>
  </pre>
)

export const ButtonToggleVerticalJSXCode = (
  <pre className='language-jsx'>
    <code className='language-jsx'>{`// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

// ** Icons Imports
import ViewList from 'mdi-material-ui/ViewList'
import ViewQuilt from 'mdi-material-ui/ViewQuilt'
import ViewModule from 'mdi-material-ui/ViewModule'

const ButtonToggleVertical = () => {
  // ** State
  const [view, setView] = useState('left')

  const handleView = (event, newView) => {
    setView(newView)
  }

  return (
    <ToggleButtonGroup exclusive value={view} orientation='vertical' onChange={handleView} aria-label='text alignment'>
      <ToggleButton value='left' aria-label='left aligned'>
        <ViewList />
      </ToggleButton>
      <ToggleButton value='center' aria-label='center aligned'>
        <ViewModule />
      </ToggleButton>
      <ToggleButton value='right' aria-label='right aligned'>
        <ViewQuilt />
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

export default ButtonToggleVertical
`}</code>
  </pre>
)
