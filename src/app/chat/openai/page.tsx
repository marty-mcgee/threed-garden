'use client'

import { useState } from 'react'

export default function ChatOpenAIPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')

  const sendMessage = async () => {
    if (!input.trim()) return

    const newMessages = [...messages, { role: 'user', content: input }]
    setMessages(newMessages)
    setInput('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }])
      } else {
        console.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div 
      className='min-h-screen p-8 bg-gray-100' 
      style={{ 
        padding: 16 
      }}
    >
      <div className='max-w-xl mx-auto bg-white p-6 rounded shadow'>
        <h1 className='text-2xl font-bold mb-4'>Chatbot with GPT-4.0</h1>
        <div className='space-y-4'>
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded ${
                msg.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'
              }`}
            >
              <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
            </div>
          ))}
        </div>
        <div className='mt-4 flex'>
          <input
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Type your message...'
            className='flex-1 p-2 border border-gray-300 rounded-l'
          />
          <button
            onClick={sendMessage}
            className='px-2 py-2 bg-blue-500 text-black rounded-r'
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}