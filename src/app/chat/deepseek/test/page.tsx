'use client'

import React from 'react'
import { DeepSeekProvider, useDeepSeekAPI } from 'deepseek-react'

const DeepSeekComponent = () => {
  const { data, loading, error, callDeepSeek } = useDeepSeekAPI()

  return (
    <div>
      <button onClick={() => callDeepSeek('chatCompletion', { messages: [{ role: 'user', content: 'Tell me a joke' }] })}>
        Ask DeepSeek AI
      </button>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {data && <p>Response: {data.choices[0].message.content}</p>}
    </div>
  )
}

const App = () => (
  <DeepSeekProvider apiKey='sk-XXXXXX' model='deepseek-chat-v2' baseURL='https://api.deepseek.com'>
    <DeepSeekComponent />
  </DeepSeekProvider>
)

export default App