import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, History, User, LogOut, Menu, X, Link2, Users, Home, Type } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    if (!user) return null;

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logged out successfully");
            navigate("/login");
        } catch {
            toast.error("Failed to log out");
        }
    };

    const navLinks = [
        { path: "/", label: "Home", icon: Home },
        { path: "/calendar-generator", label: "Dashboard", icon: Sparkles },
        { path: "/url-generator", label: "URL Repurpose", icon: Link2 },
        { path: "/engagement-planner", label: "Engagement", icon: Users },
        { path: "/caption-generator", label: "Captions", icon: Type },
        { path: "/history", label: "History", icon: History },
        { path: "/profile", label: "Profile", icon: User },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="bg-white/80 backdrop-blur-xl border-b border-[#E5E7EB] sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <img
                            src="/nav_logo2.png"
                            alt="ContentAI Logo"
                            className="h-10 w-auto object-contain"
                        />
                        <span className="text-lg font-bold tracking-tight text-[#111827] hidden sm:block ml-1">
                            ContentAI
                        </span>
                    </Link>

                    {/* User Menu (Desktop) */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            to="/profile"
                            className="flex items-center gap-2.5 px-4 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all group"
                        >
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full object-cover border border-white group-hover:border-blue-200 transition-all" />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white group-hover:ring-blue-100 transition-all">
                                    {(user.displayName || user.email)?.[0]?.toUpperCase() || "U"}
                                </div>
                            )}
                            <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">Account</span>
                                <span className="text-sm font-bold text-gray-700 max-w-[120px] truncate leading-none">
                                    {user.displayName || user.email?.split("@")[0]}
                                </span>
                            </div>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden lg:inline">Logout</span>
                        </button>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100"
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden border-t border-[#E5E7EB] bg-white pb-4 px-4">
                    <div className="flex items-center gap-3 py-3 mb-2 border-b border-gray-100">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full object-cover" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                {(user.displayName || user.email)?.[0]?.toUpperCase() || "U"}
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-semibold text-gray-800">{user.displayName}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                    </div>
                    {navLinks.map(({ path, label, icon: Icon }) => (
                        <Link
                            key={path}
                            to={path}
                            onClick={() => setMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(path)
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-600 hover:bg-gray-100"
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </Link>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 mt-2 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
