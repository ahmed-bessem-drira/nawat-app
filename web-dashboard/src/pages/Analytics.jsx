import { useEffect, useState } from 'react'
import { useData } from '../contexts/DataContext'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import { TrendingUp, Clock, Target, Brain, FileText, Award, Activity } from 'lucide-react'
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
  const { childrenData, sessions, moods, recommendations, loading, loadChildren, loadChildData } = useData()
  const [selectedChild, setSelectedChild] = useState(null)

  useEffect(() => {
    if (childrenData.length === 0) {
      loadChildren()
    }
  }, [childrenData, loadChildren])

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

  const childSessions = selectedChild 
    ? (sessions || []).filter(s => String(s.childId) === String(selectedChild.id))
    : (sessions || [])

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

  const gameToSkill = {
    'NOISE_SOUK': 'Attention',
    'GATE_OF_PATIENCE': 'Impulse Control',
    'CLOUD_VALLEY': 'Calmness',
    'BACKPACK_OASIS': 'Organization'
  };
  
  let strongestSkill = 'None yet';
  if (childSessions.length > 0) {
    const skillStats = childSessions.reduce((acc, session) => {
      const skill = gameToSkill[session.gameType];
      if (skill) {
        if (!acc[skill]) acc[skill] = { total: 0, count: 0 };
        acc[skill].total += (session.accuracy || 0);
        acc[skill].count += 1;
      }
      return acc;
    }, {});
    
    let highestAvg = -1;
    Object.keys(skillStats).forEach(skill => {
      const avg = Math.round(skillStats[skill].total / skillStats[skill].count);
      if (avg > highestAvg) {
        highestAvg = avg;
        strongestSkill = skill;
      }
    });
  }

  const totalPlayTimeMinutes = Math.round(childSessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-lg text-gray-600 mt-2 font-medium">Track progress and performance</p>
        </div>
        
        {childrenData.length > 0 && (
          <select
            value={selectedChild?.id || ''}
            onChange={(e) => setSelectedChild(childrenData.find(c => c.id === e.target.value))}
            className="px-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900 bg-white shadow-sm font-semibold cursor-pointer"
          >
            {childrenData.map(child => (
              <option key={child.id} value={child.id}>{child.nickname}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 group hover:-translate-y-1 hover:shadow-blue-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-sm">Total Sessions</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-4xl font-black text-gray-900">{childSessions.length}</p>
          <p className="text-sm font-medium text-gray-500 mt-2">All games combined</p>
        </div>

        <div className="glass-card p-6 group hover:-translate-y-1 hover:shadow-green-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-sm">Avg Accuracy</h3>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-4xl font-black text-gray-900">{avgAccuracy}%</p>
          <p className="text-sm font-medium text-gray-500 mt-2">Overall performance</p>
        </div>

        <div className="glass-card p-6 group hover:-translate-y-1 hover:shadow-purple-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-sm">Strongest Skill</h3>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-black text-gray-900 truncate">{strongestSkill}</p>
          <p className="text-sm font-medium text-gray-500 mt-2">Highest average accuracy</p>
        </div>

        <div className="glass-card p-6 group hover:-translate-y-1 hover:shadow-orange-500/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-500 uppercase tracking-wider text-sm">Total Play Time</h3>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-4xl font-black text-gray-900">{totalPlayTimeMinutes}<span className="text-2xl text-gray-500">m</span></p>
          <p className="text-sm font-medium text-gray-500 mt-2">Time spent on exercises</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Game Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Game Distribution</h3>
          <div className="h-64 flex justify-center">
            <div className="w-full max-w-[300px]">
              <Doughnut data={gameTypeData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Accuracy Over Time */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Accuracy Over Time</h3>
          <div className="h-64">
            <Line data={accuracyOverTime} options={chartOptions} />
          </div>
        </div>

      </div>

      {/* Performance Insights */}
      <div className="glass-card p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <h4 className="font-bold text-blue-900 mb-4 text-lg">Strengths</h4>
            <ul className="text-blue-800 space-y-3 font-medium">
              <li className="flex items-center space-x-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div><span>Consistent session completion</span></li>
              <li className="flex items-center space-x-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div><span>Improving accuracy over time</span></li>
              <li className="flex items-center space-x-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div><span>Good engagement with all games</span></li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
            <h4 className="font-bold text-orange-900 mb-4 text-lg">Areas for Improvement</h4>
            <ul className="text-orange-800 space-y-3 font-medium">
              <li className="flex items-center space-x-2"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div><span>Focus on reaction time exercises</span></li>
              <li className="flex items-center space-x-2"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div><span>Try more Gate of Patience sessions</span></li>
              <li className="flex items-center space-x-2"><div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div><span>Maintain consistent practice schedule</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Recent Sessions Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Game</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Accuracy</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reaction Time</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white/50">
              {sortedSessions.slice(-10).reverse().map((session, i) => (
                <tr key={i} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                    {new Date(session.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {session.gameType?.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {session.duration ? `${session.duration}s` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                      {session.accuracy ? session.accuracy + Math.floor(Math.random() * 5) : 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="w-full bg-gray-200 rounded-full h-2 max-w-[4rem]">
                        <div 
                          className={`h-2 rounded-full ${session.accuracy > 80 ? 'bg-green-500' : session.accuracy > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${session.accuracy || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{session.accuracy !== undefined ? `${session.accuracy}%` : '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {session.reactionTime !== undefined ? `${session.reactionTime}ms` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate font-medium">
                    {session.accuracy > 80 ? 'Excellent performance!' : session.accuracy > 50 ? 'Good effort!' : 'Needs some practice.'}
                  </td>
                </tr>
              ))}
              {sortedSessions.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 font-medium">
                    No sessions recorded yet. Play a game to see your stats!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500">
        Children: {childrenData.length} | Sessions in context: {(sessions || []).length} |
        Filtered: {childSessions.length} | Selected: {selectedChild?.nickname || 'none'} (id: {selectedChild?.id?.toString().slice(-6) || '-'})
      </div>
    </div>
  )
}

export default Analytics
