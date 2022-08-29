// ** React Imports
import { Fragment, useEffect, useState } from 'react'

// ** Next Imports
import Anchor from 'next/link'
import { useRouter } from 'next/router'

// ** MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

/**
 * ! Icons Imports:
 * ! You need to import all the icons which come from the API or from your server and then add these icons in 'icons' variable.
 * ! If you need all the icons from the library, use "import * as Icon from 'mdi-material-ui'"
 * */
import Link from 'mdi-material-ui/Link'
import Cellphone from 'mdi-material-ui/Cellphone'
import CogOutline from 'mdi-material-ui/CogOutline'
import CurrencyUsd from 'mdi-material-ui/CurrencyUsd'
import CircleOutline from 'mdi-material-ui/CircleOutline'
import LockOpenOutline from 'mdi-material-ui/LockOpenOutline'
import AlertCircleOutline from 'mdi-material-ui/AlertCircleOutline'
import InformationOutline from 'mdi-material-ui/InformationOutline'

// ** Third Party Imports
import axios from 'axios'

// ** Demo Import
import KnowledgeBaseHeader from 'src/views/pages/knowledge-base/KnowledgeBaseHeader'

// Styled Link component
const StyledLink = styled('a')(({ theme }) => ({
  display: 'block',
  textDecoration: 'none',
  '&:not(:last-of-type)': {
    marginBottom: theme.spacing(6)
  },
  '&:hover *': {
    color: theme.palette.primary.main
  }
}))

// Styled CardContent component
const StyledCardContent = styled(CardContent)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3.75, 5.5),
  backgroundColor: `rgba(${theme.palette.customColors.main}, 0.08)`
}))

const icons = {
  Link,
  Cellphone,
  CogOutline,
  CurrencyUsd,
  LockOpenOutline,
  InformationOutline
}

const KnowledgeBaseCategory = ({ apiData }) => {
  // ** States
  const [searchTerm, setSearchTerm] = useState('')
  const [data, setData] = useState(null)
  const router = useRouter()
  const { category } = router.query
  useEffect(() => {
    if (searchTerm !== '') {
      axios.get('/pages/knowledge-base/categories', { params: { q: searchTerm } }).then(response => {
        if (response.data && response.data.length) {
          setData(response.data)
        } else {
          setData(null)
        }
      })
    } else {
      setData(apiData)
    }
  }, [searchTerm, apiData])

  const renderQuestions = item => {
    return item.questions.map((obj, index) => {
      return (
        <Anchor passHref key={index} href={`/pages/knowledge-base/${category}/${obj.slug}`}>
          <StyledLink>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircleOutline sx={{ mr: 2.25, fontSize: '0.875rem', color: 'text.secondary' }} />
              <Typography variant='body2'>{obj.question}</Typography>
            </Box>
          </StyledLink>
        </Anchor>
      )
    })
  }

  const renderGrid = () => {
    if (data !== null && Array.isArray(data)) {
      return data.map((item, index) => {
        if (item) {
          const IconTag = icons[item.icon]

          return (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <StyledCardContent>
                  <IconTag
                    sx={{ mr: 3, fontSize: '1.5rem', ...(item.iconColor ? { color: `${item.iconColor}.main` } : {}) }}
                  />
                  <Typography variant='h6'>{`${item.title} (${item.questions.length})`}</Typography>
                </StyledCardContent>
                <CardContent sx={{ p: theme => `${theme.spacing(6.75, 5.5, 7.5)} !important` }}>
                  {renderQuestions(item)}
                </CardContent>
              </Card>
            </Grid>
          )
        } else {
          return null
        }
      })
    } else {
      return (
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <InformationOutline sx={{ mr: 2 }} />
            <Typography variant='h6'>Data is not an array!</Typography>
          </Box>
        </Grid>
      )
    }
  }

  const renderNoResult = (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AlertCircleOutline sx={{ mr: 2 }} />
      <Typography variant='h6'>No Results Found!</Typography>
    </Box>
  )

  return (
    <Fragment>
      <KnowledgeBaseHeader searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      {data !== null ? (
        <Grid container spacing={6} className='match-height'>
          {renderGrid()}
        </Grid>
      ) : (
        renderNoResult
      )}
    </Fragment>
  )
}

export const getStaticPaths = async () => {
  const res = await axios.get('/pages/knowledge-base')
  const data = await res.data

  const paths = data.map(item => ({
    params: { category: `${item.category}` }
  }))

  return {
    paths,
    fallback: false
  }
}

export const getStaticProps = async () => {
  const res = await axios.get('/pages/knowledge-base/categories')
  const apiData = await res.data

  return {
    props: {
      apiData
    }
  }
}

export default KnowledgeBaseCategory
