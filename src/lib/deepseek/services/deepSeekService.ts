import axios from 'axios'
// import OpenAI from "openai"

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com'
// const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1'
// const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/deepthink'
// const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/search'
// const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/chat'
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

// const openai = new OpenAI({
//   baseURL: DEEPSEEK_BASE_URL,
//   apiKey: process.env.OPENAI_API_KEY, // DEEPSEEK_API_KEY,
//   dangerouslyAllowBrowser: true
// })

// const deepSeekServiceOPENAI = {
    //   async analyzeText(text: string) {
    //     try {
    //       const completion = await openai.chat.completions.create({
    //         messages: [{ 
    //           role: "system", 
    //           content: text 
    //         }],
    //         model: "deepseek-chat",
    //       })
    //       console.debug('deepSeekService:', completion.choices[0].message.content)
    //     } catch (err) {
    //       // console.error('Unexpected Error:', err)
    //       // throw error
    //       console.debug('deepSeekService: CATCH: UNEXPECTED ERROR', err)
    //     }
    //   }

    // async function main() {
    //   const completion = await openai.chat.completions.create({
    //     messages: [{ role: "system", content: "You are a helpful assistant." }],
    //     model: "deepseek-chat",
    //   })

    //   console.log(completion.choices[0].message.content)
    // }

    // main()
// }

const deepseekClient = axios.create({
  baseURL: DEEPSEEK_BASE_URL,
  headers: {
    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    'Content-Type': 'application/json',
    // 'Access-Control-Allow-Origin': '*',

  },
  // body:
  // messages: [{ 
  //   role: "system", 
  //   content: text 
  // }],
  // model: "deepseek-chat",
})

const deepSeekServiceAXIOS = {
  async analyzeText(text: string) {
    try {
      // const response = await axios.post(DEEPSEEK_API_URL, {
      // const response = await axios.post(DEEPSEEK_BASE_URL, {
      // const response = await deepseekClient.post('/search', {
      const response = await deepseekClient.post(
        DEEPSEEK_API_URL,
        {
          // model: 'deepseek-chat-v2',
          model: 'deepseek-chat',
          messages:[{
            role: 'user',
            content: text
          }]
        }
      )
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('THREED DEEPSEEK API: Error:', error) // error.response?.data || error.message)

      } else {
        console.error('THREED DEEPSEEK API: Unexpected Error:', error)
      }
      throw error
    }
  }
}

// export default deepSeekServiceOPENAI
export default deepSeekServiceAXIOS




