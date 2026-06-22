import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { ArrowLeft, Clock, Target, Smile, TrendingUp, Activity } from 'lucide-react'

const ChildProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { childrenData, loadChildData, sessions, moods, recommendations, loading } = useData()
  const [child, setChild] = useState(null)

  useEffect(() => {
    const foundChild = childrenData.find(c => c.id === id)
    if (foundChild) {
      setChild(foundChild)
      loadChildData(id)
    }
  }, [id, childrenData, loadChildData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!child) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Child not found</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 text-primary-600 hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const recentSessions = sessions.slice(0, 5)
  const recentMoods = moods.slice(0, 5)

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-50 hover:shadow-md transition-all duration-300 group"
        >
          <ArrowLeft className="w-6 h-6 text-gray-500 group-hover:text-primary-600 transition-colors" />
        </button>
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            {child.nickname}'s Profile
          </h1>
          <p className="text-lg text-gray-600 font-medium mt-1">{child.name}</p>
        </div>
      </div>

      {/* Child Info Card */}
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary-100 to-transparent rounded-full mix-blend-multiply opacity-50 -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center space-x-8 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-primary-500/30">
            <span className="text-white font-black text-4xl">
              {child.nickname?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-black text-gray-900">{child.nickname}</h2>
            <p className="text-lg text-gray-600 mt-1">{child.name}</p>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <span className="text-sm font-bold bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full border border-indigo-100">
                {child.language}
              </span>
              <span className="text-sm font-semibold bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full border border-gray-200 flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{sessions.length} sessions completed</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 group hover:-translate-y-1 hover:shadow-primary-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-sm">Total Sessions</h3>
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <p className="text-4xl font-black text-gray-900">{sessions.length}</p>
          <p className="text-sm font-medium text-gray-500 mt-2">Across all games</p>
        </div>

        <div className="glass-card p-6 group hover:-translate-y-1 hover:shadow-green-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-sm">Average Accuracy</h3>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-4xl font-black text-gray-900">
            {sessions.length > 0 
              ? Math.round(sessions.reduce((acc, s) => acc + (s.metrics?.accuracy || s.accuracy || 0), 0) / sessions.length)
              : 0}%
          </p>
          <p className="text-sm font-medium text-gray-500 mt-2">Overall performance</p>
        </div>

        <div className="glass-card p-6 group hover:-translate-y-1 hover:shadow-orange-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-sm">Mood Entries</h3>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Smile className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-4xl font-black text-gray-900">{moods.length}</p>
          <p className="text-sm font-medium text-gray-500 mt-2">Emotional tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Sessions */}
        <div className="glass-card p-8 flex flex-col h-full">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Recent Sessions</h2>
          </div>

          {recentSessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-lg font-semibold text-gray-900">No sessions yet</p>
              <p className="text-gray-500 mt-1">Sessions will appear here after playing.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {recentSessions.map((session) => (
                <div key={session.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:border-primary-100 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-lg">{session.gameType?.replace(/_/g, ' ')}</h3>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Duration</span>
                      <span className="font-bold text-gray-900">{Math.round((session.duration || 0) / 60)} min</span>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3">
                      <span className="block text-xs font-semibold text-green-700 uppercase mb-1">Accuracy</span>
                      <span className="font-bold text-green-900">{session.metrics?.accuracy || session.accuracy || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-8 flex flex-col">
          {/* Recent Moods */}
          <div className="glass-card p-8 flex-1">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Smile className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Moods</h2>
            </div>

            {recentMoods.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-gray-500">No mood entries recorded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {recentMoods.map((mood) => (
                  <div key={mood.id} className="bg-white border border-gray-100 rounded-2xl p-4 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <p className="text-4xl mb-3 filter drop-shadow-sm">{getMoodEmoji(mood.mood)}</p>
                    <p className="font-bold text-gray-900 text-sm capitalize">{mood.mood.toLowerCase()}</p>
                    <p className="text-xs font-medium text-gray-500 mt-2">
                      {new Date(mood.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="glass-card p-8 flex-1">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">AI Insights</h2>
            </div>

            {recommendations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-gray-500">No AI insights generated yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
                    <p className="font-bold text-gray-900 mb-3 text-lg">{rec.content}</p>
                    <p className="text-sm font-medium text-purple-800 bg-purple-100/50 p-3 rounded-xl mb-4 italic">"{rec.encouragement}"</p>
                    {rec.suggestedActivity && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">Suggested Activity</span>
                        <span className="text-sm font-bold bg-white text-purple-700 px-3 py-1 rounded-lg border border-purple-200 shadow-sm">
                          {rec.suggestedActivity}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const getMoodEmoji = (mood) => {
  const emojis = {
    CALM: '😌',
    HAPPY: '😊',
    TIRED: '😴',
    ANGRY: '😠',
    SAD: '😢',
    EXCITED: '🤩',
  }
  return emojis[mood] || '😐'
}

export default ChildProfile
