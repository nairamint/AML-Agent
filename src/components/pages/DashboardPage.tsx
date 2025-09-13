import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  FileText, 
  BarChart3,
  Calendar,
  Shield,
  Globe,
  Briefcase,
  Target,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

// Mock data for charts
const complianceMetrics = [
  { month: 'Jan', score: 92, cases: 45, alerts: 12 },
  { month: 'Feb', score: 89, cases: 52, alerts: 18 },
  { month: 'Mar', score: 94, cases: 38, alerts: 8 },
  { month: 'Apr', score: 91, cases: 41, alerts: 15 },
  { month: 'May', score: 96, cases: 33, alerts: 6 },
  { month: 'Jun', score: 93, cases: 47, alerts: 11 }
];

const riskDistribution = [
  { risk: 'Low', count: 156, percentage: 65 },
  { risk: 'Medium', count: 67, percentage: 28 },
  { risk: 'High', count: 17, percentage: 7 }
];

export function DashboardPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Compliance Command Center</h1>
          <p className="text-slate-600 mt-1">Real-time regulatory oversight and risk intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            All Systems Operational
          </Badge>
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Review
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-subtle border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +2.3%
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">96%</h3>
            <p className="text-sm text-slate-600">Compliance Score</p>
            <div className="mt-2">
              <Progress value={96} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-subtle border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                <ArrowDownRight className="w-3 h-3 mr-1" />
                -15%
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">47</h3>
            <p className="text-sm text-slate-600">Active Cases</p>
            <p className="text-xs text-slate-500 mt-1">vs. 55 last month</p>
          </CardContent>
        </Card>

        <Card className="glass-subtle border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                <ArrowDownRight className="w-3 h-3 mr-1" />
                -31%
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">11</h3>
            <p className="text-sm text-slate-600">Risk Alerts</p>
            <p className="text-xs text-slate-500 mt-1">vs. 16 last month</p>
          </CardContent>
        </Card>

        <Card className="glass-subtle border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                <ArrowUpRight className="w-3 h-3 mr-1" />
                +8.2%
              </Badge>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">89%</h3>
            <p className="text-sm text-slate-600">SLA Performance</p>
            <p className="text-xs text-slate-500 mt-1">Response time improved</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trends */}
        <Card className="glass-subtle border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Compliance Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={complianceMetrics}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-slate-600" />
                <YAxis className="text-slate-600" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(16px)'
                  }} 
                />
                <Area type="monotone" dataKey="score" stroke="#6366f1" fill="url(#gradient)" strokeWidth={2} />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card className="glass-subtle border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      item.risk === 'Low' ? 'bg-green-500' :
                      item.risk === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium text-slate-700">{item.risk} Risk</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">{item.count}</span>
                    <div className="w-20 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          item.risk === 'Low' ? 'bg-green-500' :
                          item.risk === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-500 w-10">{item.percentage}%</span>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Total Cases</span>
                  <span className="font-medium text-slate-800">240</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Actions */}
        <Card className="glass-subtle border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Priority Actions Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">DORA Compliance Review</p>
                  <p className="text-sm text-red-600">Critical system resilience assessment overdue</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="destructive" className="text-xs">Overdue</Badge>
                    <span className="text-xs text-red-600">Due: Jan 17, 2025</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-50">
                  Review
                </Button>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="font-medium text-orange-800">AML Risk Assessment</p>
                  <p className="text-sm text-orange-600">High-risk client requires enhanced due diligence</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs text-orange-700 border-orange-300">High Priority</Badge>
                    <span className="text-xs text-orange-600">Due: Tomorrow</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-orange-700 border-orange-300 hover:bg-orange-50">
                  Start
                </Button>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div className="flex-1">
                  <p className="font-medium text-blue-800">ESG Disclosure Review</p>
                  <p className="text-sm text-blue-600">Q4 sustainability metrics validation</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">Scheduled</Badge>
                    <span className="text-xs text-blue-600">Due: Next Week</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-blue-700 border-blue-300 hover:bg-blue-50">
                  Plan
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass-subtle border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">John Davis</span> completed AML screening for TechCorp Ltd
                  </p>
                  <p className="text-xs text-slate-500">2 hours ago</p>
                </div>
                <Badge variant="outline" className="text-xs text-green-700 border-green-300">Approved</Badge>
              </div>

              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616c28ca2be?w=100&h=100&fit=crop&crop=face" />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">Sarah Chen</span> flagged suspicious transaction pattern
                  </p>
                  <p className="text-xs text-slate-500">4 hours ago</p>
                </div>
                <Badge variant="outline" className="text-xs text-orange-700 border-orange-300">Investigation</Badge>
              </div>

              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" />
                  <AvatarFallback>MR</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">Mike Rodriguez</span> updated ESG disclosure framework
                  </p>
                  <p className="text-xs text-slate-500">1 day ago</p>
                </div>
                <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">Framework</Badge>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-800">
                    System automatically generated <span className="font-medium">quarterly compliance report</span>
                  </p>
                  <p className="text-xs text-slate-500">2 days ago</p>
                </div>
                <Button size="sm" variant="ghost" className="text-xs text-primary hover:bg-primary/10">
                  View <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regulatory Calendar & Navigator Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regulatory Calendar */}
        <Card className="glass-subtle border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Upcoming Regulatory Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                <div>
                  <p className="font-medium text-red-800">DORA Implementation</p>
                  <p className="text-sm text-red-600">Digital operational resilience requirements</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-800">Jan 17, 2025</p>
                  <p className="text-xs text-red-600">8 days left</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div>
                  <p className="font-medium text-yellow-800">ESG Reporting Deadline</p>
                  <p className="text-sm text-yellow-600">Annual sustainability disclosure</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-yellow-800">Mar 31, 2025</p>
                  <p className="text-xs text-yellow-600">81 days left</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div>
                  <p className="font-medium text-blue-800">CSRD Compliance Review</p>
                  <p className="text-sm text-blue-600">Corporate sustainability reporting directive</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-800">Jun 15, 2025</p>
                  <p className="text-xs text-blue-600">157 days left</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigator Performance */}
        <Card className="glass-subtle border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              AI Navigator Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">AML Navigator</p>
                    <p className="text-xs text-slate-600">98.2% accuracy</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={98} className="w-16 h-2" />
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Excellent</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">ESG Navigator</p>
                    <p className="text-xs text-slate-600">94.7% accuracy</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={95} className="w-16 h-2" />
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Excellent</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Sanctions Navigator</p>
                    <p className="text-xs text-slate-600">91.3% accuracy</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={91} className="w-16 h-2" />
                  <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Good</Badge>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Overall System Health</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-green-700">Optimal</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}