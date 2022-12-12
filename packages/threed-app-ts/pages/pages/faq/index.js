// ** React Imports
import { useEffect, useState } from 'react'

// ** MUI Imports
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

// ** Icons Imports
import AlertCircleOutline from 'mdi-material-ui/AlertCircleOutline'

// ** Third Party Imports
import axios from 'axios'

// ** Demo Imports
import FaqHeader from '#/ui/pages/faq/FaqHeader'
import FaqFooter from '#/ui/pages/faq/FaqFooter'
import FaqAccordions from '#/ui/pages/faq/FaqAccordions'

// Styled Box component
const StyledBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(14.25, 24, 0, 24),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(14.25, 0, 0),
  },
  '& > :not(:first-of-type)': {
    marginTop: theme.spacing(13),
  },
}))

const FAQ = ({ apiData }) => {
  // ** States
  const [data, setData] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  useEffect(() => {
    if (searchTerm !== '') {
      axios.get('/pages/faqs', { params: { q: searchTerm } }).then((response) => {
        if (response.data && response.data.length) {
          setData(response.data)
        } else {
          setData(null)
        }
      })
    } else {
      setData(apiData)
    }
  }, [apiData, searchTerm])

  const renderNoResult = (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <AlertCircleOutline sx={{ mr: 2 }} />
      <Typography variant='h6'>No Results Found!!</Typography>
    </Box>
  )

  return (
    <>
      <FaqHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <StyledBox>
        {data !== null ? <FaqAccordions data={data} /> : renderNoResult}
        <FaqFooter />
      </StyledBox>
    </>
  )
}

export const getStaticProps = async () => {
  const res = await axios.get('/pages/faqs')
  const apiData = res.data

  return {
    props: {
      apiData,
    },
  }
}

export default FAQ
