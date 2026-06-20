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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Parent Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user.name}!</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Children</p>
              <p className="text-3xl font-bold text-gray-900">{childrenData.length}</p>
            </div>
            <Baby className="w-12 h-12 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">
                {childrenData.reduce((acc, child) => acc + (child.sessionsCount || 0), 0)}
              </p>
            </div>
            <Clock className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Accuracy</p>
              <p className="text-3xl font-bold text-gray-900">
                {childrenData.length > 0 
                  ? Math.round(childrenData.reduce((acc, child) => acc + (child.avgAccuracy || 0), 0) / childrenData.length)
                  : 0}%
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Mood Entries</p>
              <p className="text-3xl font-bold text-gray-900">
                {childrenData.reduce((acc, child) => acc + (child.moodsCount || 0), 0)}
              </p>
            </div>
            <Smile className="w-12 h-12 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Children List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Children</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => loadChildren()}
              className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Child</span>
            </button>
          </div>
        </div>

        {childrenData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Baby className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">No children added yet</p>
            <p className="text-sm mt-2">Add your first child to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {childrenData.map((child) => (
              <div key={child.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-lg">
                        {child.nickname?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{child.nickname}</h3>
                      <p className="text-sm text-gray-600">{child.name}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {child.language}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sessions:</span>
                    <span className="font-medium">{child.sessionsCount || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Accuracy:</span>
                    <span className="font-medium">{child.avgAccuracy || 0}%</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/child/${child.id}`)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleGenerateCode(child)}
                    className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Add Child</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Child's Full Name</label>
                <input
                  type="text"
                  required
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter child's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                <input
                  type="text"
                  required
                  value={addFormData.nickname}
                  onChange={(e) => setAddFormData({ ...addFormData, nickname: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter a nickname"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select
                  value={addFormData.language}
                  onChange={(e) => setAddFormData({ ...addFormData, language: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="ENGLISH">English</option>
                  <option value="FRENCH">French</option>
                  <option value="ARABIC">Arabic</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingChild}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Access Code for {selectedChild?.nickname}
            </h3>
            
            {loadingCode ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Generating code...</p>
              </div>
            ) : generatedCode ? (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Share this code with your child to use in the mobile app:
                </p>
                <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-6 text-center">
                  <p className="text-4xl font-bold text-primary-700 tracking-wider">
                    {generatedCode}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  This code is unique to {selectedChild?.nickname} and should be kept secure.
                </p>
              </div>
            ) : null}

            <button
              onClick={handleCloseModal}
              className="w-full mt-6 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
