// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Checkbox from '@mui/material/Checkbox'
import Accordion from '@mui/material/Accordion'
import Typography from '@mui/material/Typography'
import AccordionSummary from '@mui/material/AccordionSummary'
import FormControlLabel from '@mui/material/FormControlLabel'
import AccordionDetails from '@mui/material/AccordionDetails'

// ** Icons Imports
import ChevronDown from 'mdi-material-ui/ChevronDown'

const AccordionActions = () => {
  // ** State
  const [expanded, setExpanded] = useState(false)

  const handleChange = panel => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false)
  }

  return (
    <div>
      <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
        <AccordionSummary
          id='actions-panel-header-1'
          expandIcon={<ChevronDown />}
          aria-controls='actions-panel-content-1'
        >
          <FormControlLabel
            label='Accordion 1'
            aria-label='Acknowledge'
            control={<Checkbox disableRipple />}
            onClick={event => event.stopPropagation()}
            onFocus={event => event.stopPropagation()}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Wafer sesame snaps chocolate bar candy canes halvah. Cupcake sesame snaps sweet tart dessert biscuit.
            Topping soufflé tart sweet croissant.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
        <AccordionSummary
          id='actions-panel-header-2'
          expandIcon={<ChevronDown />}
          aria-controls='actions-panel-content-2'
        >
          <FormControlLabel
            label='Accordion 2'
            aria-label='Acknowledge'
            control={<Checkbox disableRipple />}
            onClick={event => event.stopPropagation()}
            onFocus={event => event.stopPropagation()}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Sugar plum sesame snaps caramels. Cake pie tart fruitcake sesame snaps donut cupcake macaroon. Gingerbread
            pudding cheesecake pie ice cream.
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
        <AccordionSummary
          id='actions-panel-header-3'
          expandIcon={<ChevronDown />}
          aria-controls='actions-panel-content-3'
        >
          <FormControlLabel
            label='Accordion 3'
            aria-label='Acknowledge'
            control={<Checkbox disableRipple />}
            onClick={event => event.stopPropagation()}
            onFocus={event => event.stopPropagation()}
          />
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            Gingerbread lemon drops bear claw gummi bears bonbon wafer jujubes tiramisu. Jelly pie cake. Sweet roll
            dessert sweet pastry powder.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </div>
  )
}

export default AccordionActions
