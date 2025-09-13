import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Settings,
  Filter,
  MoreHorizontal,
  Clock,
  Star,
  Archive,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';

const notifications = [
  {
    id: 1,
    type: 'alert',
    title: 'DORA Compliance Deadline Approaching',
    message: 'Digital operational resilience requirements must be implemented by January 17, 2025. Critical systems assessment required.',
    time: '1 hour ago',
    read: false,
    priority: 'high'
  },
  {
    id: 2,
    type: 'update',
    title: 'AML Navigator Updated',
    message: 'New regulatory guidance from FATF has been integrated. Enhanced detection capabilities now available.',
    time: '3 hours ago',
    read: false,
    priority: 'medium'
  },
  {
    id: 3,
    type: 'approval',
    title: 'Risk Assessment Requires Approval',
    message: 'AML risk assessment for TechStart Ltd is ready for senior review and approval.',
    time: '5 hours ago',
    read: true,
    priority: 'high'
  },
  {
    id: 4,
    type: 'info',
    title: 'ESG Disclosure Deadline Reminder',
    message: 'Q4 sustainability metrics validation due in 7 days.',
    time: '1 day ago',
    read: true,
    priority: 'medium'
  }
];

export function NotificationsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Notifications</h1>
          <p className="text-slate-600 mt-1">Stay updated with alerts, approvals, and system notifications</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="unread">Unread (2)</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`glass-subtle border-0 hover:bg-white/30 transition-all duration-200 ${
                  !notification.read ? 'border-l-4 border-l-primary' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        notification.type === 'alert' ? 'bg-red-100' :
                        notification.type === 'update' ? 'bg-blue-100' :
                        notification.type === 'approval' ? 'bg-yellow-100' :
                        'bg-gray-100'
                      }`}>
                        {notification.type === 'alert' ? (
                          <AlertTriangle className={`w-5 h-5 ${
                            notification.type === 'alert' ? 'text-red-600' : 'text-gray-600'
                          }`} />
                        ) : notification.type === 'update' ? (
                          <Bell className="w-5 h-5 text-blue-600" />
                        ) : notification.type === 'approval' ? (
                          <CheckCircle className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <Info className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              notification.priority === 'high' ? 'text-red-700 border-red-300' :
                              'text-yellow-700 border-yellow-300'
                            }`}
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        
                        <p className={`text-sm leading-relaxed mb-2 ${
                          !notification.read ? 'text-slate-700' : 'text-slate-600'
                        }`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {notification.time}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Star className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Archive className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="unread">
          <div className="space-y-4">
            {notifications.filter(n => !n.read).map((notification) => (
              <Card key={notification.id} className="glass-subtle border-0 border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">{notification.title}</h3>
                        <p className="text-sm text-slate-700 mb-2">{notification.message}</p>
                        <span className="text-xs text-slate-500">{notification.time}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Mark as Read
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="space-y-4">
            {notifications.filter(n => n.type === 'alert').map((notification) => (
              <Card key={notification.id} className="glass-subtle border-0 border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">{notification.title}</h3>
                      <p className="text-sm text-slate-700 mb-2">{notification.message}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{notification.time}</span>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                          Take Action
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="glass-subtle border-0">
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Email Notifications</p>
                    <p className="text-sm text-slate-600">Receive notifications via email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Push Notifications</p>
                    <p className="text-sm text-slate-600">Browser push notifications</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Alert Notifications</p>
                    <p className="text-sm text-slate-600">High priority alerts and deadlines</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">System Updates</p>
                    <p className="text-sm text-slate-600">Navigator updates and system maintenance</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}