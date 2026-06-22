import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { Baby, Plus, Key, Clock, TrendingUp, Smile, X, RefreshCw } from 'lucide-react'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { childrenData, loadChildren, generateChildCode, addChild } = useData()
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedChild, setSelectedChild] = useState(null)
  const [generatedCode, setGeneratedCode] = useState('')
  const [loadingCode, setLoadingCode] = useState(false)
  const [addFormData, setAddFormData] = useState({
    name: '',
    nickname: '',
    language: 'ENGLISH',
  })
  const [addingChild, setAddingChild] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    loadChildren()
  }, [user, navigate, loadChildren])

  const handleGenerateCode = async (child) => {
    setSelectedChild(child)
    setShowCodeModal(true)
    setGeneratedCode('')
    setLoadingCode(true)
    
    try {
      const code = await generateChildCode(child.id)
      setGeneratedCode(code)
    } catch (error) {
      console.error('Failed to generate code:', error)
    } finally {
      setLoadingCode(false)
    }
  }

  const handleCloseModal = () => {
    setShowCodeModal(false)
    setSelectedChild(null)
    setGeneratedCode('')
  }

  const handleAddChild = async (e) => {
    e.preventDefault()
    setAddingChild(true)
    try {
      await addChild(addFormData)
      setShowAddModal(false)
      setAddFormData({ name: '', nickname: '', language: 'ENGLISH' })
      await loadChildren()
    } catch (error) {
      console.error('Failed to add child:', error)
    } finally {
      setAddingChild(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Parent Dashboard</h1>
          <p className="text-lg text-gray-600 mt-2 font-medium">Welcome back, <span className="text-primary-600">{user.name}</span>!</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 group hover:-translate-y-1 hover:shadow-primary-500/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Children</p>
              <p className="text-4xl font-black text-gray-900 mt-2">{childrenData.length}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Baby className="w-7 h-7 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 group hover:-translate-y-1 hover:shadow-green-500/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Total Sessions</p>
              <p className="text-4xl font-black text-gray-900 mt-2">
                {childrenData.reduce((acc, child) => acc + (child.sessionsCount || 0), 0)}
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 group hover:-translate-y-1 hover:shadow-purple-500/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Avg Accuracy</p>
              <p className="text-4xl font-black text-gray-900 mt-2">
                {childrenData.length > 0 
                  ? Math.round(childrenData.reduce((acc, child) => acc + (child.avgAccuracy || 0), 0) / childrenData.length)
                  : 0}%
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 group hover:-translate-y-1 hover:shadow-orange-500/10 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Mood Entries</p>
              <p className="text-4xl font-black text-gray-900 mt-2">
                {childrenData.reduce((acc, child) => acc + (child.moodsCount || 0), 0)}
              </p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
              <Smile className="w-7 h-7 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Children List */}
      <div className="glass-card p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Your Children</h2>
          <div className="flex space-x-3 w-full sm:w-auto">
            <button
              onClick={() => loadChildren()}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all duration-300"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Add Child</span>
            </button>
          </div>
        </div>

        {childrenData.length === 0 ? (
          <div className="text-center py-16 px-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Baby className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl font-semibold text-gray-900">No children added yet</p>
            <p className="text-gray-500 mt-2 max-w-md mx-auto">Add your first child to get their unique access code and start tracking their progress.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {childrenData.map((child) => (
              <div key={child.id} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:border-primary-100 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-50 to-indigo-50 border border-primary-100 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                      <span className="text-primary-600 font-black text-xl">
                        {child.nickname?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary-600 transition-colors">{child.nickname}</h3>
                      <p className="text-sm text-gray-500">{child.name}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                    {child.language}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div>
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sessions</span>
                    <span className="font-bold text-gray-900 text-lg">{child.sessionsCount || 0}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Avg Accuracy</span>
                    <span className="font-bold text-gray-900 text-lg">{child.avgAccuracy || 0}%</span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate(`/child/${child.id}`)}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 text-sm font-semibold"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleGenerateCode(child)}
                    className="flex-1 bg-primary-50 text-primary-700 py-2.5 rounded-xl hover:bg-primary-100 transition-all duration-300 text-sm font-semibold flex items-center justify-center space-x-2"
                  >
                    <Key className="w-4 h-4" />
                    <span>Get Code</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Child Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Add Child</h3>
                <p className="text-sm text-gray-500 mt-1">Create a new profile for your child</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center hover:bg-gray-200 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddChild} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Child's Full Name</label>
                <input
                  type="text"
                  required
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nickname</label>
                <input
                  type="text"
                  required
                  value={addFormData.nickname}
                  onChange={(e) => setAddFormData({ ...addFormData, nickname: e.target.value })}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900"
                  placeholder="e.g. Johnny"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Language</label>
                <select
                  value={addFormData.language}
                  onChange={(e) => setAddFormData({ ...addFormData, language: e.target.value })}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-gray-900 cursor-pointer"
                >
                  <option value="ENGLISH">English</option>
                  <option value="FRENCH">French</option>
                  <option value="ARABIC">Arabic</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-colors font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingChild}
                  className="flex-1 bg-gradient-to-r from-primary-600 to-indigo-600 text-white py-3 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all font-bold disabled:opacity-50 disabled:transform-none"
                >
                  {addingChild ? 'Adding...' : 'Add Child'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Key className="w-8 h-8 text-green-600" />
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 mb-2">
              Access Code for {selectedChild?.nickname}
            </h3>
            
            {loadingCode ? (
              <div className="py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-100 border-t-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-500 font-medium">Generating secure code...</p>
              </div>
            ) : generatedCode ? (
              <div className="space-y-6 mt-6">
                <p className="text-gray-600 text-sm">
                  Share this code with your child to use in the NAWAT mobile app:
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-indigo-400"></div>
                  <p className="text-5xl font-black text-gray-900 tracking-widest font-mono">
                    {generatedCode}
                  </p>
                </div>
                <p className="text-xs text-gray-500 font-medium">
                  This code is unique and securely linked to {selectedChild?.nickname}'s profile.
                </p>
              </div>
            ) : null}

            <button
              onClick={handleCloseModal}
              className="w-full mt-8 bg-gray-100 text-gray-800 py-3.5 rounded-xl hover:bg-gray-200 transition-colors font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
