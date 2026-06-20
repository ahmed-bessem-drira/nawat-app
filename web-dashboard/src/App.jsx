import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DataProvider } from './contexts/DataContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ChildProfile from './pages/ChildProfile'
import Analytics from './pages/Analytics'
import Chatbot from './pages/Chatbot'

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <DataProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/child/:id" element={<ChildProfile />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/chatbot" element={<Chatbot />} />
            </Routes>
          </Layout>
        </DataProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
