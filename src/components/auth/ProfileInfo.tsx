import { User, Mail, AtSign } from "lucide-react"
import { useSession } from "@/lib/auth-client"

export default function ProfileInfo() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 w-20 rounded-full bg-slate-700" />
        <div className="h-4 w-48 bg-slate-700 rounded" />
        <div className="h-4 w-64 bg-slate-700 rounded" />
      </div>
    )
  }

  if (!session) return null

  const { user } = session

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User avatar"}
            className="w-20 h-20 rounded-full object-cover border-2 border-cyan-500"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center border-2 border-cyan-500">
            <User className="w-10 h-10 text-gray-400" />
          </div>
        )}
        <div>
          <h3 className="text-xl font-semibold text-white">{user.name || "No name set"}</h3>
          <p className="text-gray-400 text-sm">Member since {new Date(user.createdAt).toISOString().split("T")[0]}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3 text-gray-300">
          <Mail className="w-5 h-5 text-cyan-400" />
          <span>{user.email}</span>
        </div>
        {("username" in user) && user.username && (
          <div className="flex items-center gap-3 text-gray-300">
            <AtSign className="w-5 h-5 text-cyan-400" />
            <span>{user.username as string}</span>
          </div>
        )}
      </div>
    </div>
  )
}
