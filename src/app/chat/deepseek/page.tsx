// 'use client'

import React from 'react'
import { NextPage } from 'next'
import DeepSeekComponent from '#/lib/deepseek/components/DeepSeekComponent'
// import deepSeekService from '#/lib/deepseek/services/deepSeekService'

interface ChatDeepSeekPageProps {
  initialAnalysisResult?: any // Replace 'any' with the actual type of your analysis result
}

// import { GetServerSideProps } from 'next'
// import { useEffect, useState } from 'react'

const ChatDeepSeekPage: NextPage<ChatDeepSeekPageProps> = () => {
  // // const customURL = 'https://github.com/marty-mcgee/threed-garden'
  const customURL = 'https://npmjs.com/package/threed-garden'
  const initialText = `Please tell me about 'ThreeD Garden' at ${customURL}`
  // const [analysisResult, setAnalysisResult] = useState(null)

  // ** for testing only
  // useEffect(() => {
  //   const fetchAnalysis = async () => {
  //     try {
  //       const result = await deepSeekService.analyzeText(initialText)
  //       setAnalysisResult(result)
  //     } catch (error) {
  //       console.error('Error fetching analysis:', error)
  //     }
  //   }

  //   fetchAnalysis()
  // }, [])

  return (
    <div>
      <h1>DeepSeek Chat</h1>
      <p>This page uses client-side rendering to fetch data.</p>
      
      {/* Pass the initialText as a prop to DeepSeekComponent */}
      <DeepSeekComponent initialText={initialText} />
      
      {/* {analysisResult && (
        <div>
          <h3>Analysis Result:</h3>
          <pre>{JSON.stringify(analysisResult, null, 2)}</pre>
        </div>
      )} */}
    </div>
  )
}

export default ChatDeepSeekPage