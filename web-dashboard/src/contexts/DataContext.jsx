import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { dataService } from '../services/dataService'

const DataContext = createContext(null)

export const DataProvider = ({ children }) => {
  const [childrenData, setChildrenData] = useState([])
  const [sessions, setSessions] = useState([])
  const [moods, setMoods] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)

  const loadChildren = useCallback(async () => {
    setLoading(true)
    try {
      const data = await dataService.getChildren()
      setChildrenData(data)
    } catch (error) {
      console.error('Failed to load children:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadChildData = useCallback(async (childId) => {
    setLoading(true)
    try {
      const [sessionsData, moodsData, recommendationsData] = await Promise.all([
        dataService.getChildSessions(childId),
        dataService.getChildMoods(childId),
        dataService.getChildRecommendations(childId).catch(() => [])
      ])
      setSessions(sessionsData)
      setMoods(moodsData)
      setRecommendations(recommendationsData)
    } catch (error) {
      console.error('Failed to load child data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const addChild = useCallback(async (childData) => {
    const newChild = await dataService.addChild(childData)
    setChildrenData(prev => [...prev, newChild])
    return newChild
  }, [])

  const generateChildCode = useCallback(async (childId) => {
    const response = await dataService.generateChildCode(childId)
    return response.code
  }, [])

  return (
    <DataContext.Provider value={{
      childrenData,
      sessions,
      moods,
      recommendations,
      loading,
      loadChildren,
      loadChildData,
      addChild,
      generateChildCode
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
