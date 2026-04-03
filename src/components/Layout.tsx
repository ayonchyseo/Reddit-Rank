import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  Search,
  BarChart3,
  Target,
  TrendingUp,
  Lightbulb,
  Crosshair,
  Link as LinkIcon,
  Menu,
  X,
  MessageSquare
} from "lucide-react";

const navItems = [
  { path: "/", icon: Search, label: "Keyword Intel" },
  { path: "/subreddit", icon: BarChart3, label: "Subreddit Analyzer" },
  { path: "/aeo", icon: Target, label: "AEO Finder" },
  { path: "/geo", icon: TrendingUp, label: "GEO Tracker" },
  { path: "/ideas", icon: Lightbulb, label: "Content Ideas" },
  { path: "/competitor", icon: Crosshair, label: "Competitor Spy" },
  { path: "/traffic", icon: LinkIcon, label: "Traffic Finder" },
  { path: "/reply", icon: MessageSquare, label: "Safe Reply Generator" },
];

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-reddit flex items-center justify-center">
            <span className="font-bold text-white text-xl leading-none">r</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Reddit-Rank</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-gray-100 focus:outline-none"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={closeMenu}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-gray-800">
          <div className="w-8 h-8 rounded-full bg-reddit flex items-center justify-center">
            <span className="font-bold text-white text-xl leading-none">r</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Reddit-Rank</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 mt-16 md:mt-0">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMenu}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  isActive
                    ? "bg-reddit/10 text-reddit"
                    : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-950 pt-16 md:pt-0">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
