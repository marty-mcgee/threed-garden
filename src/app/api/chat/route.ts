// app/api/chat/route.js
import OpenAI from 'openai'

const openai = new OpenAI({
  // baseURL: 'https://api.deepseek.com',
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
})

export async function POST(req: any) {
  try {
    const body = await req.json()
    const { messages } = body
    // console.debug(completion.choices[0].message.content)

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
    })

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