// ** MUI Imports
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

// ** Custom Components Imports
import CardSnippet from 'src/@core/components/card-snippet'

// ** Demo Components Imports
import MenuBasic from 'src/views/components/menu/MenuBasic'
import MenuContext from 'src/views/components/menu/MenuContext'
import MenuSelected from 'src/views/components/menu/MenuSelected'
import MenuMaxHeight from 'src/views/components/menu/MenuMaxHeight'
import MenuCustomized from 'src/views/components/menu/MenuCustomized'
import MenuTransition from 'src/views/components/menu/MenuTransition'
import MenuComposition from 'src/views/components/menu/MenuComposition'

// ** Source code imports
import * as source from 'src/views/components/menu/MenuSourceCode'

const Menus = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Simple Menu'
          code={{
            tsx: null,
            jsx: source.MenuBasicJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Manage <code>anchorEl</code> and <code>open</code> props with the help of a state and <code>onClose</code>{' '}
            prop with the help of a function in <code>Menu</code> component.
          </Typography>
          <MenuBasic />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Selected Menu'
          code={{
            tsx: null,
            jsx: source.MenuSelectedJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Manage <code>selected</code> prop with the help of a state in <code>MenuItem</code> component to select an
            item.
          </Typography>
          <MenuSelected />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='MenuList Composition'
          code={{
            tsx: null,
            jsx: source.MenuCompositionJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use a different positioning strategy and not blocking the page scroll by using <code>MenuList</code> and{' '}
            <code>Popper</code> components.
          </Typography>
          <MenuComposition />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Customized Menu'
          code={{
            tsx: null,
            jsx: source.MenuCustomizedJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>styled</code> hook to customize your menu.
          </Typography>
          <MenuCustomized />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Max Height Menu'
          code={{
            tsx: null,
            jsx: source.MenuMaxHeightJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>PaperProps</code> prop and use <code>style</code> property to set the height of the menu.
          </Typography>
          <MenuMaxHeight />
        </CardSnippet>
      </Grid>
      <Grid item xs={12} md={6}>
        <CardSnippet
          title='Change Transition'
          code={{
            tsx: null,
            jsx: source.MenuTransitionJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>TransitionComponent</code> prop to change the transition of the menu.
          </Typography>
          <MenuTransition />
        </CardSnippet>
      </Grid>
      <Grid item xs={12}>
        <CardSnippet
          title='Context Menu'
          code={{
            tsx: null,
            jsx: source.MenuContextJSXCode
          }}
        >
          <Typography sx={{ mb: 4 }}>
            Use <code>onContextMenu</code> prop in the parent element to manage the context menu.
          </Typography>
          <MenuContext />
        </CardSnippet>
      </Grid>
    </Grid>
  )
}

export default Menus
