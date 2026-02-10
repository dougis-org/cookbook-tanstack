import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Home,
  Menu,
  BookOpen,
  ChefHat,
  Plus,
  Search,
  X,
  LogIn,
  UserPlus,
  LogOut,
  User,
} from 'lucide-react'
import { useSession, signOut } from '@/lib/auth-client'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: session, isPending } = useSession()

  async function handleSignOut() {
    await signOut()
    setIsOpen(false)
  }

  return (
    <>
      <header className="p-4 flex items-center justify-between bg-gray-800 text-white shadow-lg">
        <div className="flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <Link to="/" className="ml-4 flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-cyan-400" />
            <h1 className="text-xl font-semibold">CookBook</h1>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {isPending ? null : session ? (
            <>
              <Link
                to="/auth/profile"
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <User size={18} />
                <span className="hidden sm:inline">{session.user.name || session.user.email}</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-700"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth/login"
                className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-700"
              >
                <LogIn size={16} />
                <span className="hidden sm:inline">Login</span>
              </Link>
              <Link
                to="/auth/register"
                className="flex items-center gap-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <UserPlus size={16} />
                <span className="hidden sm:inline">Register</span>
              </Link>
            </>
          )}
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <ChefHat className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold">CookBook</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          <Link
            to="/recipes"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <BookOpen size={20} />
            <span className="font-medium">Recipes</span>
          </Link>

          <Link
            to="/categories"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <ChefHat size={20} />
            <span className="font-medium">Categories</span>
          </Link>

          <Link
            to="/recipes/new"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
            }}
          >
            <Plus size={20} />
            <span className="font-medium">New Recipe</span>
          </Link>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-3">
              Coming Soon
            </p>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 text-gray-500 mb-2">
              <Search size={20} />
              <span className="font-medium">Advanced Search</span>
            </div>
          </div>
        </nav>
      </aside>
    </>
  )
}
