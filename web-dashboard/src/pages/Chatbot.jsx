import { useState, useRef, useEffect } from 'react'
import { useData } from '../contexts/DataContext'
import { chatbotService } from '../services/chatbotService'
import { Send, Bot, User, Sparkles } from 'lucide-react'

const Chatbot = () => {
  const { childrenData, selectedChild } = useData()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your NAWAT AI assistant. I can help you understand your child\'s progress, provide insights about their development, and answer any questions you have about the games and activities. How can I help you today?'
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || loading) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      // Prepare child context for the AI
      const childContext = selectedChild ? {
        name: selectedChild.nickname,
        language: selectedChild.language,
        recentActivity: 'Recent game sessions and mood data available'
      } : {
        name: 'No child selected',
        language: 'ENGLISH'
      }

      const response = await chatbotService.sendMessage(userMessage, childContext)
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: error.message || 'I apologize, but I\'m having trouble connecting right now. Please try again later.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  const suggestedQuestions = [
    "How can I help my child improve their focus?",
    "What games are best for developing patience?",
    "How should I interpret my child's mood entries?",
    "What's a good practice schedule for my child?",
    "How can I track my child's progress over time?"
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Sparkles className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">NAWAT AI Assistant</h1>
        </div>
        <p className="text-gray-600">
          Powered by Grok AI - Get personalized insights about your child's development
        </p>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Messages Area */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary-600" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-primary-600" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask me anything about your child's progress..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Suggested Questions</h3>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => setInputMessage(question)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <Sparkles className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">About This AI Assistant</h3>
            <p className="text-sm text-gray-600">
              This chatbot is powered by Grok AI and has access to your child's game performance data, 
              mood entries, and progress metrics. It can provide personalized recommendations, 
              explain game mechanics, and offer insights about cognitive development. 
              All conversations are private and secure.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chatbot
