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
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center mb-10">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-indigo-100 rounded-2xl flex items-center justify-center shadow-inner">
            <Sparkles className="w-8 h-8 text-primary-600" />
          </div>
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">NAWAT AI Assistant</h1>
        <p className="text-lg text-gray-600 font-medium mt-3 max-w-2xl mx-auto">
          Powered by Grok AI - Get personalized insights about your child's development, ask questions, and discover recommendations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Chat Container */}
          <div className="glass-card flex flex-col h-[600px]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-end space-x-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-3xl px-6 py-4 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-br-sm'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    <p className={`text-[15px] leading-relaxed whitespace-pre-wrap font-medium ${message.role === 'user' ? 'text-white' : 'text-gray-700'}`}>
                      {message.content}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex items-end space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-3xl rounded-bl-sm px-6 py-5 shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce"></div>
                      <div className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                      <div className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/50 backdrop-blur-md border-t border-gray-100 rounded-b-2xl">
              <form onSubmit={handleSendMessage} className="flex space-x-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 px-5 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900 font-medium placeholder-gray-400 shadow-inner"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="px-6 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Suggested Questions */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Suggested Questions</h3>
            <div className="flex flex-col gap-3">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="text-left px-5 py-3 bg-white border border-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-primary-200 hover:text-primary-700 transition-all duration-300 text-sm shadow-sm"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-primary-50 rounded-2xl p-6 border border-indigo-100">
            <div className="flex flex-col space-y-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Sparkles className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-indigo-900 mb-2 text-lg">About This Assistant</h3>
                <p className="text-sm text-indigo-800 leading-relaxed font-medium">
                  This chatbot is powered by Grok AI. It securely accesses your child's performance data, 
                  mood entries, and progress metrics to provide tailored, actionable parenting advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chatbot
