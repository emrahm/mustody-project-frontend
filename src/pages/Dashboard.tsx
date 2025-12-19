import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { 
  Shield, 
  Key, 
  Users, 
  TrendingUp, 
  Activity,
  Wallet,
  Settings
} from 'lucide-react';

export default function Dashboard() {
  const stats = [
    {
      title: 'Total Assets',
      value: '$2,847,392',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: Wallet
    },
    {
      title: 'Active Wallets',
      value: '1,247',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: Shield
    },
    {
      title: 'API Requests',
      value: '45,892',
      change: '+23.1%',
      changeType: 'positive' as const,
      icon: Activity
    },
    {
      title: 'Success Rate',
      value: '99.9%',
      change: '+0.1%',
      changeType: 'positive' as const,
      icon: TrendingUp
    }
  ];

  const recentTransactions = [
    { id: '1', type: 'Deposit', amount: '+$12,500', status: 'completed', time: '2 minutes ago' },
    { id: '2', type: 'Withdrawal', amount: '-$8,750', status: 'pending', time: '5 minutes ago' },
    { id: '3', type: 'Transfer', amount: '$25,000', status: 'completed', time: '12 minutes ago' },
    { id: '4', type: 'Deposit', amount: '+$5,200', status: 'completed', time: '1 hour ago' },
    { id: '5', type: 'Withdrawal', amount: '-$15,000', status: 'failed', time: '2 hours ago' }
  ];

  return (
    <Layout currentPage="dashboard">
      <div className="p-6">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, John!</h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your crypto custody platform today.</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="stat-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="stat-label">{stat.title}</p>
                    <p className="stat-value">{stat.value}</p>
                    <p className={`stat-change ${stat.changeType === 'positive' ? 'stat-change-positive' : 'stat-change-negative'}`}>
                      {stat.change}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <stat.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest activity across all wallets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.type}</p>
                        <p className="text-sm text-gray-500">{transaction.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{transaction.amount}</p>
                      <Badge 
                        className={
                          transaction.status === 'completed' ? 'badge-success' :
                          transaction.status === 'pending' ? 'badge-warning' :
                          'badge-danger'
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Transactions
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button className="btn-primary h-20 flex-col">
                  <Wallet className="h-6 w-6 mb-2" />
                  Create Wallet
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Key className="h-6 w-6 mb-2" />
                  Generate API Key
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-6 w-6 mb-2" />
                  Invite Team
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Settings className="h-6 w-6 mb-2" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Status */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-600" />
              Security Status
            </CardTitle>
            <CardDescription>Your account security overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">Enabled</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium">API Key Encryption</p>
                  <p className="text-sm text-gray-500">Active</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="font-medium">Backup Recovery</p>
                  <p className="text-sm text-gray-500">Pending Setup</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
