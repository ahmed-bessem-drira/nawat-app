import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Users, TrendingUp, MessageSquare } from 'lucide-react'

const Home = () => {
  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <div className="relative text-center py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 flex justify-center opacity-30 pointer-events-none">
          <div className="w-[800px] h-[400px] bg-gradient-to-r from-primary-400 to-indigo-400 blur-3xl rounded-full"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight">
            Welcome to <span className="text-gradient">NAWAT</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed font-light">
            Monitor your child's progress, track their emotional development, and get personalized AI insights.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-8">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-2xl font-bold text-lg hover:bg-gray-50 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
            >
              Login to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">Why choose NAWAT?</h2>
          <p className="text-lg text-gray-600 mt-4">Everything you need to support your child's growth</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="glass-card p-8 group hover:-translate-y-2 transition-all duration-300 cursor-default">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Private</h3>
            <p className="text-gray-600 leading-relaxed">
              Your child's data is protected with enterprise-grade security and privacy controls.
            </p>
          </div>

          <div className="glass-card p-8 group hover:-translate-y-2 transition-all duration-300 cursor-default">
            <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <Users className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Child Profiles</h3>
            <p className="text-gray-600 leading-relaxed">
              Create individual profiles for each child with unique access codes for the mobile app.
            </p>
          </div>

          <div className="glass-card p-8 group hover:-translate-y-2 transition-all duration-300 cursor-default">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Progress Tracking</h3>
            <p className="text-gray-600 leading-relaxed">
              Detailed analytics and visualizations to track your child's cognitive development.
            </p>
          </div>

          <div className="glass-card p-8 group hover:-translate-y-2 transition-all duration-300 cursor-default">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <MessageSquare className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI Chatbot</h3>
            <p className="text-gray-600 leading-relaxed">
              Get personalized insights and parenting recommendations powered by Grok AI.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="glass-card p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="text-lg text-gray-600 mt-4">Three simple steps to start the journey</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-gray-200 via-primary-300 to-gray-200"></div>
            
            <div className="text-center relative">
              <div className="w-20 h-20 bg-white border-4 border-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-600 text-3xl font-black shadow-lg relative z-10">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Register</h3>
              <p className="text-gray-600 leading-relaxed">
                Create your parent account and easily add your child's information.
              </p>
            </div>
            <div className="text-center relative">
              <div className="w-20 h-20 bg-white border-4 border-primary-100 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600 text-3xl font-black shadow-lg relative z-10">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Get Code</h3>
              <p className="text-gray-600 leading-relaxed">
                Receive a secure, unique code for your child to log into the mobile app.
              </p>
            </div>
            <div className="text-center relative">
              <div className="w-20 h-20 bg-white border-4 border-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-600 text-3xl font-black shadow-lg relative z-10">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Monitor</h3>
              <p className="text-gray-600 leading-relaxed">
                Watch them play and learn while you track their progress in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
