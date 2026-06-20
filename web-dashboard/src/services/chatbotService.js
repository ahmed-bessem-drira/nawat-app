import axios from 'axios'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export const chatbotService = {
  async sendMessage(message, childContext) {
    const apiKey = import.meta.env.VITE_GROK_API_KEY
    
    if (!apiKey) {
      throw new Error('Grok API key not configured')
    }

    const systemPrompt = `You are a helpful assistant for parents monitoring their child's progress in educational games. 
    The child's context: ${JSON.stringify(childContext)}. 
    Provide insights, recommendations, and answer questions about the child's development, game performance, and emotional state.`

    try {
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data.choices[0].message.content
    } catch (error) {
      const detail = error.response?.data?.error?.message || error.response?.data || error.message
      console.error('Groq API error:', detail)
      throw new Error(typeof detail === 'string' ? detail : 'Failed to get response from chatbot')
    }
  },
}
