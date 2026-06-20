import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Users, TrendingUp, MessageSquare } from 'lucide-react'

const Home = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to NAWAT Parent Dashboard
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Monitor your child's progress, track their emotional development, and get personalized insights through our AI-powered platform.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/register"
            className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
          <p className="text-gray-600">
            Your child's data is protected with enterprise-grade security and privacy controls.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Child Profiles</h3>
          <p className="text-gray-600">
            Create individual profiles for each child with unique access codes for the mobile app.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
          <p className="text-gray-600">
            Detailed analytics and visualizations to track your child's development over time.
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">AI Chatbot</h3>
          <p className="text-gray-600">
            Get personalized insights and recommendations powered by Grok AI.
          </p>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white rounded-xl shadow-md p-8">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Register</h3>
            <p className="text-gray-600">
              Create your parent account and add your child's information
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Get Code</h3>
            <p className="text-gray-600">
              Receive a unique code for your child to use in the mobile app
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Monitor</h3>
            <p className="text-gray-600">
              Track progress and get insights through the dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
