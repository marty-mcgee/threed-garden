'use client'

import React, { useState } from 'react'
import deepSeekService from '#/lib/deepseek/services/deepSeekService' // Adjust the path as needed

interface DeepSeekComponentProps {
  initialText?: string
}

const DeepSeekComponent: React.FC<DeepSeekComponentProps> = ({ initialText = '' }) => {
  const [inputText, setInputText] = useState(initialText)
  const [analysisResult, setAnalysisResult] = useState(null)

  const handleAnalyze = async () => {
    try {
      const result = await deepSeekService.analyzeText(inputText)
      setAnalysisResult(result)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div>
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter text to analyze"
      />
      <button onClick={handleAnalyze}>Analyze</button>
      {analysisResult && (
        <div>
          <h3>Analysis Result:</h3>
          <pre>{JSON.stringify(analysisResult, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

export default DeepSeekComponent