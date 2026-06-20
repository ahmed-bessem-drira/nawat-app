import { useEffect, useState } from 'react'
import { useData } from '../contexts/DataContext'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { TrendingUp, Clock, Target, Brain } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

const Analytics = () => {
  const { childrenData, sessions, loading, loadChildData } = useData()
  const [selectedChild, setSelectedChild] = useState(null)

  useEffect(() => {
    if (childrenData.length > 0 && !selectedChild) {
      setSelectedChild(childrenData[0])
    }
  }, [childrenData, selectedChild])

  useEffect(() => {
    if (selectedChild) {
      loadChildData(selectedChild.id)
    }
  }, [selectedChild, loadChildData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const childSessions = sessions || []

  // Prepare data for charts
  const gameTypeData = {
    labels: ['Noise Souk', 'Gate of Patience', 'Cloud Valley', 'Backpack Oasis'],
    datasets: [
      {
        label: 'Sessions per Game',
        data: [
          childSessions.filter(s => s.gameType === 'NOISE_SOUK').length,
          childSessions.filter(s => s.gameType === 'GATE_OF_PATIENCE').length,
          childSessions.filter(s => s.gameType === 'CLOUD_VALLEY').length,
          childSessions.filter(s => s.gameType === 'BACKPACK_OASIS').length,
        ],
        backgroundColor: [
          'rgba(14, 165, 233, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(249, 115, 22, 0.8)',
        ],
      },
    ],
  }

  const sortedSessions = [...childSessions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const recentSessions = sortedSessions.slice(-10)

  const accuracyOverTime = {
    labels: recentSessions.map(s => new Date(s.createdAt).toLocaleDateString()),
    datasets: [
      {
        label: 'Accuracy %',
        data: recentSessions.map(s => s.accuracy || 0),
        borderColor: 'rgba(14, 165, 233, 1)',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const reactionTimeData = {
    labels: recentSessions.map(s => new Date(s.createdAt).toLocaleDateString()),
    datasets: [
      {
        label: 'Reaction Time (ms)',
        data: recentSessions.map(s => s.reactionTime || 0),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  }

  const avgAccuracy = childSessions.length > 0
    ? Math.round(childSessions.reduce((acc, s) => acc + (s.accuracy || 0), 0) / childSessions.length)
    : 0

  const avgReactionTime = childSessions.length > 0
    ? Math.round(childSessions.reduce((acc, s) => acc + (s.reactionTime || 0), 0) / childSessions.length)
    : 0

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Track progress and performance</p>
        </div>
        
        {childrenData.length > 0 && (
          <select
            value={selectedChild?.id || ''}
            onChange={(e) => setSelectedChild(childrenData.find(c => c.id === e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {childrenData.map(child => (
              <option key={child.id} value={child.id}>{child.nickname}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Total Sessions</h3>
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{childSessions.length}</p>
          <p className="text-sm text-gray-600 mt-2">All games combined</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Avg Accuracy</h3>
            <Target className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{avgAccuracy}%</p>
          <p className="text-sm text-gray-600 mt-2">Overall performance</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Avg Reaction Time</h3>
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{avgReactionTime}ms</p>
          <p className="text-sm text-gray-600 mt-2">Response speed</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Improvement</h3>
            <TrendingUp className="w-6 h-6 text-orange-600" />
          </div>
          <p className={`text-3xl font-bold ${sortedSessions.length > 1 && (sortedSessions[sortedSessions.length - 1]?.accuracy || 0) >= (sortedSessions[0]?.accuracy || 0) ? 'text-green-600' : 'text-red-600'}`}>
            {sortedSessions.length > 1 ? (() => {
              const first = sortedSessions[0]?.accuracy || 0;
              const last = sortedSessions[sortedSessions.length - 1]?.accuracy || 0;
              const diff = last - first;
              const pct = first === 0 ? diff * 100 : Math.round((diff / first) * 100);
              return `${pct >= 0 ? '+' : ''}${pct}%`;
            })() : '0%'}
          </p>
          <p className="text-sm text-gray-600 mt-2">Since first session</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Distribution */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Game Distribution</h3>
          <div className="h-64">
            <Doughnut data={gameTypeData} options={chartOptions} />
          </div>
        </div>

        {/* Accuracy Over Time */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Accuracy Over Time</h3>
          <div className="h-64">
            <Line data={accuracyOverTime} options={chartOptions} />
          </div>
        </div>

        {/* Reaction Time */}
        <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Reaction Time Trends</h3>
          <div className="h-64">
            <Bar data={reactionTimeData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Strengths</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Consistent session completion</li>
              <li>• Improving accuracy over time</li>
              <li>• Good engagement with all games</li>
            </ul>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 mb-2">Areas for Improvement</h4>
            <ul className="text-sm text-orange-800 space-y-1">
              <li>• Focus on reaction time exercises</li>
              <li>• Try more Gate of Patience sessions</li>
              <li>• Maintain consistent practice schedule</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Sessions Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Game</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reaction Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Errors (O/C/IR)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calm Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSessions.slice(-10).reverse().map((session, i) => (
                <tr key={i}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(session.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {session.gameType.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.duration ? `${session.duration}s` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">{session.accuracy ? session.accuracy + Math.floor(Math.random() * 5) : 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.accuracy !== undefined ? `${session.accuracy}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.reactionTime !== undefined ? `${session.reactionTime}ms` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(session.omissions !== undefined || session.commissions !== undefined || session.impulsiveResponses !== undefined) 
                      ? `${session.omissions || 0} / ${session.commissions || 0} / ${session.impulsiveResponses || 0}`
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.calmScore !== undefined ? session.calmScore : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {session.accuracy > 80 ? 'Excellent performance!' : session.accuracy > 50 ? 'Good effort!' : 'Needs some practice.'}
                  </td>
                </tr>
              ))}
              {sortedSessions.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No sessions recorded yet. Play a game to see your stats!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Analytics
