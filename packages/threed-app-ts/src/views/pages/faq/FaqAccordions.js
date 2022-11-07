// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Accordion from '@mui/material/Accordion'
import Typography from '@mui/material/Typography'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'

/**
 * ! Icons Imports:
 * ! You need to import all the icons which come from the API or from your server and then add these icons in 'icons' variable.
 * ! If you need all the icons from the library, use "import * as Icon from 'mdi-material-ui'"
 * */
import ChevronDown from 'mdi-material-ui/ChevronDown'
import CurrencyUsd from 'mdi-material-ui/CurrencyUsd'
import HelpCircleOutline from 'mdi-material-ui/HelpCircleOutline'
import BriefcaseVariantOutline from 'mdi-material-ui/BriefcaseVariantOutline'

const icons = {
  CurrencyUsd,
  HelpCircleOutline,
  BriefcaseVariantOutline
}

const FaqAccordions = ({ data }) => {
  // ** States
  const [expandedCommon, setExpandedCommon] = useState(false)
  const [expandedPayment, setExpandedPayment] = useState(false)
  const [expandedProduct, setExpandedProduct] = useState(false)

  const expanded = (section, panel) => {
    if (section === 'common') {
      return expandedCommon === panel
    } else if (section === 'payment') {
      return expandedPayment === panel
    } else {
      return expandedProduct === panel
    }
  }

  const handleChange = (section, panel) => (event, isExpanded) => {
    if (section === 'common') {
      setExpandedCommon(isExpanded ? panel : false)
    } else if (section === 'payment') {
      setExpandedPayment(isExpanded ? panel : false)
    } else {
      setExpandedProduct(isExpanded ? panel : false)
    }
  }

  const renderAccordions = item => {
    return item.qAndA.map(obj => {
      return (
        <Accordion key={obj.id} expanded={expanded(item.id, obj.id)} onChange={handleChange(item.id, obj.id)}>
          <AccordionSummary
            expandIcon={<ChevronDown />}
            id={`faq-accordion-${item.id}-${obj.id}-header`}
            aria-controls={`faq-accordion-${item.id}-${obj.id}-content`}
          >
            <Typography>{obj.question}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant='body2'>{obj.answer}</Typography>
          </AccordionDetails>
        </Accordion>
      )
    })
  }

  const renderData = () => {
    if (data) {
      return (
        <>
          {data.map(item => {
            if (item) {
              const IconTag = icons[item.icon]

              return (
                <Box key={item.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      variant='rounded'
                      sx={{ backgroundColor: theme => `rgba(${theme.palette.customColors.main}, 0.08)` }}
                    >
                      <IconTag sx={{ fontSize: '1.375rem' }} />
                    </Avatar>
                    <Box sx={{ ml: 3.5 }}>
                      <Typography variant='h6'>{item.title}</Typography>
                      <Typography variant='body2'>{item.subtitle}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mt: 6.5 }}>{renderAccordions(item)}</Box>
                </Box>
              )
            } else {
              return null
            }
          })}
        </>
      )
    } else {
      return null
    }
  }

  return renderData()
}

export default FaqAccordions
