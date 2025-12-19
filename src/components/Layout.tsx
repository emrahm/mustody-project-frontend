import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Shield, 
  Key, 
  Users, 
  Activity,
  Wallet,
  Settings,
  Bell,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentPage?: string;
}

export default function Layout({ children, currentPage = 'dashboard' }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/dashboard', key: 'dashboard' },
    { icon: Wallet, label: 'Wallets', href: '/wallets', key: 'wallets' },
    { icon: Key, label: 'API Keys', href: '/api-keys', key: 'api-keys' },
    { icon: Users, label: 'Team', href: '/team', key: 'team' },
    { icon: Activity, label: 'Transactions', href: '/transactions', key: 'transactions' },
    { icon: Settings, label: 'Settings', href: '/settings', key: 'settings' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-2xl font-bold text-blue-600">Mustody</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                currentPage === item.key
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </a>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">JD</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">John Doe</p>
              <p className="text-xs text-gray-500">john@company.com</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full mt-4 justify-start text-gray-600">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">JD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        {children}
      </div>
    </div>
  );
}
