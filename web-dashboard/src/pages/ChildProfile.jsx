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
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{child.nickname}'s Profile</h1>
          <p className="text-gray-600">{child.name}</p>
        </div>
      </div>

      {/* Child Info Card */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-bold text-3xl">
              {child.nickname?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{child.nickname}</h2>
            <p className="text-gray-600">{child.name}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {child.language}
              </span>
              <span className="text-sm text-gray-600">
                {sessions.length} sessions completed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Total Sessions</h3>
            <Clock className="w-6 h-6 text-primary-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{sessions.length}</p>
          <p className="text-sm text-gray-600 mt-2">Across all games</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Average Accuracy</h3>
            <Target className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {sessions.length > 0 
              ? Math.round(sessions.reduce((acc, s) => acc + (s.metrics?.accuracy || 0), 0) / sessions.length)
              : 0}%
          </p>
          <p className="text-sm text-gray-600 mt-2">Overall performance</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Mood Entries</h3>
            <Smile className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{moods.length}</p>
          <p className="text-sm text-gray-600 mt-2">Emotional tracking</p>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Sessions</h2>
          <Activity className="w-6 h-6 text-primary-600" />
        </div>

        {recentSessions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No sessions recorded yet</p>
        ) : (
          <div className="space-y-4">
            {recentSessions.map((session) => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{session.gameType}</h3>
                  <span className="text-sm text-gray-600">
                    {new Date(session.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <span className="text-gray-600">
                    Duration: {Math.round(session.duration / 60)} min
                  </span>
                  {session.metrics && (
                    <>
                      <span className="text-gray-600">
                        Accuracy: {session.metrics.accuracy}%
                      </span>
                      <span className="text-gray-600">
                        Reaction Time: {session.metrics.reactionTime}ms
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Moods */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Moods</h2>
          <Smile className="w-6 h-6 text-orange-600" />
        </div>

        {recentMoods.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No mood entries recorded yet</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {recentMoods.map((mood) => (
              <div key={mood.id} className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-2xl mb-2">{getMoodEmoji(mood.mood)}</p>
                <p className="font-medium text-gray-900">{mood.mood}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(mood.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recommendations</h2>
          <TrendingUp className="w-6 h-6 text-purple-600" />
        </div>

        {recommendations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No recommendations available yet</p>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-2">{rec.content}</p>
                <p className="text-sm text-gray-600 mb-2">{rec.encouragement}</p>
                {rec.suggestedActivity && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    Suggested: {rec.suggestedActivity}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
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
