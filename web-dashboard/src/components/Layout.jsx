import { Link, useLocation } from 'react-router-dom'
import logo from '../assetes/nawat_logo_original.png'
import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, User, BarChart3, MessageSquare, LogOut } from 'lucide-react'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/chatbot', icon: MessageSquare, label: 'Chatbot' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/3 translate-y-1/3"></div>

      <nav className="glass sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <img src={logo} alt="NAWAT Logo" className="h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-300" />
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              {user ? (
                <>
                  {navItems.map((item) => {
                    const active = isActive(item.path)
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                          active
                            ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                        }`}
                      >
                        <item.icon className={`w-4 h-4 ${active ? 'text-primary-600' : ''}`} />
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                  <div className="flex items-center space-x-2 ml-4 px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-100">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{user.name}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-2 ml-2 px-4 py-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 transition-all duration-300"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {children}
      </main>
    </div>
  )
}

export default Layout
