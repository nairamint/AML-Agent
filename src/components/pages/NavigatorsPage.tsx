import { useState } from 'react';
import { 
  Shield, 
  Globe, 
  AlertTriangle, 
  Users, 
  FileText, 
  Bot, 
  Star, 
  Plus, 
  Settings,
  Play,
  Pause,
  MoreHorizontal,
  TrendingUp,
  CheckCircle,
  Clock,
  Zap,
  Activity,
  Target,
  Wrench,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const navigators = [
  {
    id: 'aml-navigator',
    name: 'AML Navigator',
    description: 'Advanced anti-money laundering compliance assistant with real-time risk assessment capabilities',
    icon: Shield,
    color: 'from-blue-500 to-indigo-600',
    status: 'active',
    accuracy: 98.2,
    casesProcessed: 1247,
    lastUpdated: '2 hours ago',
    specialties: ['Transaction Monitoring', 'Customer Due Diligence', 'Suspicious Activity Reporting', 'Regulatory Reporting'],
    jurisdiction: ['EU', 'US', 'UK', 'Singapore'],
    featured: true,
    usage: 'high'
  },
  {
    id: 'esg-navigator',
    name: 'ESG Navigator',
    description: 'Environmental, Social & Governance compliance advisor for sustainability reporting and impact assessment',
    icon: Globe,
    color: 'from-green-500 to-emerald-600',
    status: 'active',
    accuracy: 94.7,
    casesProcessed: 892,
    lastUpdated: '4 hours ago',
    specialties: ['Climate Risk Assessment', 'Sustainability Reporting', 'ESG Scoring', 'Impact Measurement'],
    jurisdiction: ['EU', 'Global'],
    featured: true,
    usage: 'high'
  },
  {
    id: 'sanctions-navigator',
    name: 'Sanctions Navigator',
    description: 'Global sanctions screening and compliance monitoring with real-time watchlist updates',
    icon: AlertTriangle,
    color: 'from-red-500 to-rose-600',
    status: 'active',
    accuracy: 91.3,
    casesProcessed: 2156,
    lastUpdated: '1 hour ago',
    specialties: ['Watchlist Screening', 'Sanctions Risk Assessment', 'Compliance Monitoring', 'Alert Investigation'],
    jurisdiction: ['US', 'EU', 'UK', 'Global'],
    featured: true,
    usage: 'medium'
  },
  {
    id: 'kyc-navigator',
    name: 'KYC Navigator',
    description: 'Know Your Customer compliance workflows and customer due diligence automation',
    icon: Users,
    color: 'from-purple-500 to-violet-600',
    status: 'active',
    accuracy: 96.8,
    casesProcessed: 3421,
    lastUpdated: '3 hours ago',
    specialties: ['Customer Onboarding', 'Identity Verification', 'Risk Profiling', 'Enhanced Due Diligence'],
    jurisdiction: ['EU', 'US', 'UK'],
    featured: false,
    usage: 'high'
  },
  {
    id: 'gdpr-navigator',
    name: 'GDPR Navigator',
    description: 'Data protection compliance assistant for GDPR and privacy regulation adherence',
    icon: FileText,
    color: 'from-cyan-500 to-blue-600',
    status: 'maintenance',
    accuracy: 89.4,
    casesProcessed: 567,
    lastUpdated: '1 day ago',
    specialties: ['Data Mapping', 'Privacy Impact Assessment', 'Consent Management', 'Breach Response'],
    jurisdiction: ['EU'],
    featured: false,
    usage: 'medium'
  }
];

const customNavigators = [
  {
    id: 'custom-1',
    name: 'Internal Risk Assessment',
    description: 'Custom navigator for proprietary risk assessment frameworks',
    status: 'draft',
    accuracy: 0,
    casesProcessed: 0,
    lastUpdated: 'Never',
    owner: 'Sarah Chen'
  },
  {
    id: 'custom-2',
    name: 'Regulatory Change Monitor',
    description: 'Custom alert system for regulatory updates in specific jurisdictions',
    status: 'testing',
    accuracy: 76.3,
    casesProcessed: 45,
    lastUpdated: '2 days ago',
    owner: 'Mike Rodriguez'
  }
];

export function NavigatorsPage() {
  const [selectedTab, setSelectedTab] = useState('featured');
  const [sortBy, setSortBy] = useState('usage');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'maintenance': return 'bg-yellow-100 text-yellow-700';
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'testing': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getUsageIcon = (usage: string) => {
    switch (usage) {
      case 'high': return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'medium': return <Activity className="w-3 h-3 text-yellow-600" />;
      case 'low': return <Target className="w-3 h-3 text-gray-600" />;
      default: return <Target className="w-3 h-3 text-gray-600" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">AI Navigator Hub</h1>
          <p className="text-slate-600 mt-1">Specialized AI assistants for regulatory compliance and risk management</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usage">Sort by Usage</SelectItem>
              <SelectItem value="accuracy">Sort by Accuracy</SelectItem>
              <SelectItem value="recent">Recently Updated</SelectItem>
              <SelectItem value="name">Sort by Name</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Create Navigator
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="glass-subtle border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Active Navigators</p>
                <p className="text-2xl font-bold text-slate-800">4</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-subtle border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total Cases Processed</p>
                <p className="text-2xl font-bold text-slate-800">8.1K</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-subtle border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Average Accuracy</p>
                <p className="text-2xl font-bold text-slate-800">95.2%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-subtle border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Custom Navigators</p>
                <p className="text-2xl font-bold text-slate-800">2</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="featured">Featured Navigators</TabsTrigger>
          <TabsTrigger value="all">All Navigators</TabsTrigger>
          <TabsTrigger value="custom">Custom Navigators</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="featured">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {navigators.filter(nav => nav.featured).map((navigator) => (
              <Card key={navigator.id} className="glass-subtle border-0 hover:bg-white/30 transition-all duration-200 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${navigator.color} flex items-center justify-center`}>
                        <navigator.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{navigator.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(navigator.status)}>
                            {navigator.status}
                          </Badge>
                          {navigator.featured && (
                            <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">
                              <Star className="w-2 h-2 mr-1 fill-current" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">{navigator.description}</p>
                  
                  {/* Performance Metrics */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Accuracy</span>
                      <div className="flex items-center gap-2">
                        <Progress value={navigator.accuracy} className="w-16 h-1" />
                        <span className="font-medium text-slate-800">{navigator.accuracy}%</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Cases Processed</span>
                      <span className="font-medium text-slate-800">{navigator.casesProcessed.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Usage</span>
                      <div className="flex items-center gap-1">
                        {getUsageIcon(navigator.usage)}
                        <span className="font-medium text-slate-800 capitalize">{navigator.usage}</span>
                      </div>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-2">Specialties</p>
                    <div className="flex flex-wrap gap-1">
                      {navigator.specialties.slice(0, 3).map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {navigator.specialties.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{navigator.specialties.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Jurisdictions */}
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-2">Coverage</p>
                    <div className="flex flex-wrap gap-1">
                      {navigator.jurisdiction.map((jur) => (
                        <Badge key={jur} variant="outline" className="text-xs">
                          {jur}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90 text-white">
                      <Play className="w-3 h-3 mr-2" />
                      Launch
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Star className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated {navigator.lastUpdated}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="space-y-4">
            {navigators.map((navigator) => (
              <Card key={navigator.id} className="glass-subtle border-0 hover:bg-white/30 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${navigator.color} flex items-center justify-center`}>
                        <navigator.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-slate-800">{navigator.name}</h3>
                          <Badge className={getStatusColor(navigator.status)}>
                            {navigator.status}
                          </Badge>
                          {navigator.featured && (
                            <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">
                              <Star className="w-2 h-2 mr-1 fill-current" />
                              Featured
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            {getUsageIcon(navigator.usage)}
                            <span className="text-xs text-slate-600 capitalize">{navigator.usage} usage</span>
                          </div>
                        </div>
                        <p className="text-slate-600 mb-4 leading-relaxed">{navigator.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs font-medium text-slate-700 mb-1">Accuracy Rate</p>
                            <div className="flex items-center gap-2">
                              <Progress value={navigator.accuracy} className="flex-1 h-2" />
                              <span className="text-sm font-medium text-slate-800">{navigator.accuracy}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-700 mb-1">Cases Processed</p>
                            <p className="text-lg font-semibold text-slate-800">{navigator.casesProcessed.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-700 mb-1">Last Updated</p>
                            <p className="text-sm text-slate-600">{navigator.lastUpdated}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-slate-600">Specialties: </span>
                            <span className="text-slate-800">{navigator.specialties.length} areas</span>
                          </div>
                          <div>
                            <span className="text-slate-600">Coverage: </span>
                            <span className="text-slate-800">{navigator.jurisdiction.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
                        <Play className="w-3 h-3 mr-2" />
                        Launch
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-3 h-3" />
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

        <TabsContent value="custom">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Custom Navigators</h3>
                <p className="text-sm text-slate-600">Build and manage your organization's proprietary AI assistants</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Build New Navigator
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customNavigators.map((navigator) => (
                <Card key={navigator.id} className="glass-subtle border-0 hover:bg-white/30 transition-all duration-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{navigator.name}</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">{navigator.description}</p>
                      </div>
                      <Badge className={getStatusColor(navigator.status)}>
                        {navigator.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616c28ca2be?w=100&h=100&fit=crop&crop=face" />
                          <AvatarFallback>SC</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-slate-800">Created by {navigator.owner}</p>
                          <p className="text-xs text-slate-600">Last updated: {navigator.lastUpdated}</p>
                        </div>
                      </div>

                      {navigator.status !== 'draft' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Accuracy</span>
                            <span className="font-medium text-slate-800">{navigator.accuracy}%</span>
                          </div>
                          <Progress value={navigator.accuracy} className="h-1" />
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Cases Processed</span>
                            <span className="font-medium text-slate-800">{navigator.casesProcessed}</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {navigator.status === 'draft' ? (
                          <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90 text-white">
                            <Wrench className="w-3 h-3 mr-2" />
                            Continue Building
                          </Button>
                        ) : (
                          <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90 text-white">
                            <Play className="w-3 h-3 mr-2" />
                            Launch
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Settings className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Create New Card */}
              <Card className="glass-subtle border-0 border-dashed border-slate-300 hover:bg-white/30 transition-all duration-200 cursor-pointer">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                    <Plus className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Create New Navigator</h3>
                  <p className="text-sm text-slate-600 mb-4">Build a custom AI assistant tailored to your specific compliance needs</p>
                  <Button className="bg-primary hover:bg-primary/90 text-white">
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="marketplace">
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Navigator Marketplace</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              Discover and install pre-built navigators from our community and certified partners.
            </p>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Zap className="w-4 h-4 mr-2" />
              Explore Marketplace
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}