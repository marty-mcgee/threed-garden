// app/api/chat/route.js
import OpenAI from 'openai'

// const DEEPTHINK_API_URL = 'https://api.deepseek.com/v1/deepthink'
const DEEPTHINK_API_URL = 'https://api.deepseek.com/chat/completions'
const DEEPTHINK_API_KEY = process.env.DEEPTHINK_API_KEY

const openai = new OpenAI({
  // baseURL: 'https://api.deepseek.com',
  apiKey: process.env.OPEN_API_KEY,
  dangerouslyAllowBrowser: true
})

export async function POST(req: any) {
  try {
    const body = await req.json()
    const { messages } = body

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
    })
    // async analyzeText(text: string) {
    //   const completion = await openai.chat.completions.create({
    //     messages: [{ role: "system", content: text }],
    //     model: "gpt-4",
    //   })
  
    //   console.debug(completion.choices[0].message.content)
    // }

    return new Response(JSON.stringify({ reply: response.choices[0].message.content }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: 'Failed to fetch response from OpenAI' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}