import { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Workflow, 
  Upload, 
  Bot, 
  FileText, 
  Users, 
  Calendar,
  Target,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const createOptions = [
  {
    id: 'new-chat',
    title: 'New Advisory Chat',
    description: 'Start a single analysis consultation with AI navigators',
    icon: MessageSquare,
    color: 'from-blue-500 to-indigo-600',
    duration: '5-15 min',
    complexity: 'Simple',
    popular: true
  },
  {
    id: 'new-pathway',
    title: 'Multi-Step Pathway',
    description: 'Create a structured workflow for complex compliance processes',
    icon: Workflow,
    color: 'from-purple-500 to-pink-600',
    duration: '30-90 min',
    complexity: 'Advanced',
    popular: true
  },
  {
    id: 'upload-docs',
    title: 'Document Analysis',
    description: 'Upload documents for AI-powered compliance review and analysis',
    icon: Upload,
    color: 'from-orange-500 to-red-600',
    duration: '10-30 min',
    complexity: 'Medium',
    popular: false
  },
  {
    id: 'build-navigator',
    title: 'Custom Navigator',
    description: 'Build a specialized AI assistant for your specific needs',
    icon: Bot,
    color: 'from-green-500 to-teal-600',
    duration: '2-4 hours',
    complexity: 'Expert',
    popular: false
  }
];

const templates = [
  {
    id: 'aml-assessment',
    name: 'AML Risk Assessment',
    description: 'Complete anti-money laundering risk evaluation workflow',
    category: 'Risk Management',
    estimatedTime: '45 min',
    steps: 7,
    used: 234
  },
  {
    id: 'esg-disclosure',
    name: 'ESG Disclosure Review',
    description: 'Sustainability reporting compliance validation process',
    category: 'ESG Compliance',
    estimatedTime: '60 min',
    steps: 9,
    used: 156
  },
  {
    id: 'sanctions-screening',
    name: 'Sanctions Screening',
    description: 'Comprehensive sanctions compliance verification',
    category: 'Sanctions',
    estimatedTime: '20 min',
    steps: 4,
    used: 412
  }
];

export function CreatePage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [chatTitle, setChatTitle] = useState('');
  const [chatDescription, setChatDescription] = useState('');
  const [selectedNavigator, setSelectedNavigator] = useState('');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Create New Advisory Session</h1>
        <p className="text-slate-600">Choose how you'd like to start your compliance analysis or workflow</p>
      </div>

      {/* Quick Start Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {createOptions.map((option) => (
          <Card 
            key={option.id} 
            className={`glass-subtle border-0 hover:bg-white/30 transition-all duration-200 cursor-pointer ${
              selectedOption === option.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedOption(option.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center`}>
                  <option.icon className="w-6 h-6 text-white" />
                </div>
                {option.popular && (
                  <Badge variant="secondary" className="text-xs">Popular</Badge>
                )}
              </div>
              <CardTitle className="text-lg leading-tight">{option.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed">{option.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Duration</span>
                  <span className="text-slate-700 font-medium">{option.duration}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Complexity</span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      option.complexity === 'Simple' ? 'text-green-700 border-green-300' :
                      option.complexity === 'Medium' ? 'text-yellow-700 border-yellow-300' :
                      option.complexity === 'Advanced' ? 'text-orange-700 border-orange-300' :
                      'text-red-700 border-red-300'
                    }`}
                  >
                    {option.complexity}
                  </Badge>
                </div>
              </div>

              <Button 
                className={`w-full mt-4 ${
                  selectedOption === option.id 
                    ? 'bg-primary hover:bg-primary/90 text-white' 
                    : 'bg-white/50 hover:bg-white/70 text-slate-700'
                }`}
                size="sm"
              >
                {selectedOption === option.id ? 'Selected' : 'Select'}
                <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Section */}
      {selectedOption && (
        <Card className="glass-subtle border-0 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Configure Your Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-3 w-full mb-6">
                <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
                <TabsTrigger value="templates">Use Template</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Session Title</label>
                      <Input
                        value={chatTitle}
                        onChange={(e) => setChatTitle(e.target.value)}
                        placeholder="e.g., Q4 AML Risk Assessment"
                        className="glass-input"
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Description (Optional)</label>
                      <Textarea
                        value={chatDescription}
                        onChange={(e) => setChatDescription(e.target.value)}
                        placeholder="Brief description of what you're analyzing..."
                        className="glass-input min-h-[100px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Primary Navigator</label>
                      <Select value={selectedNavigator} onValueChange={setSelectedNavigator}>
                        <SelectTrigger className="glass-input">
                          <SelectValue placeholder="Choose your AI assistant" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aml">AML Navigator</SelectItem>
                          <SelectItem value="esg">ESG Navigator</SelectItem>
                          <SelectItem value="sanctions">Sanctions Navigator</SelectItem>
                          <SelectItem value="kyc">KYC Navigator</SelectItem>
                          <SelectItem value="gdpr">GDPR Navigator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Jurisdiction</label>
                      <Select>
                        <SelectTrigger className="glass-input">
                          <SelectValue placeholder="Select applicable jurisdiction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eu">European Union</SelectItem>
                          <SelectItem value="us">United States</SelectItem>
                          <SelectItem value="uk">United Kingdom</SelectItem>
                          <SelectItem value="global">Global</SelectItem>
                          <SelectItem value="singapore">Singapore</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">Priority Level</label>
                      <Select>
                        <SelectTrigger className="glass-input">
                          <SelectValue placeholder="Set priority level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-slate-200">
                  <Button className="bg-primary hover:bg-primary/90 text-white px-8">
                    <Zap className="w-4 h-4 mr-2" />
                    Start Session
                  </Button>
                  <Button variant="outline">
                    Save as Draft
                  </Button>
                  <Button variant="ghost">
                    Cancel
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Advanced Configuration</h3>
                  <p className="text-slate-600 mb-4">Fine-tune your session with advanced settings and custom parameters</p>
                  <Button variant="outline">
                    Configure Advanced Settings
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="templates" className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800">Pre-built Templates</h3>
                    <Badge variant="secondary">3 available</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                      <Card key={template.id} className="glass-subtle border-0 hover:bg-white/30 transition-all duration-200 cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{template.name}</CardTitle>
                              <Badge variant="outline" className="text-xs mt-1">{template.category}</Badge>
                            </div>
                            <Badge variant="secondary" className="text-xs">{template.used} uses</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-slate-600">{template.description}</p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Duration
                              </span>
                              <span className="text-slate-700 font-medium">{template.estimatedTime}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Steps
                              </span>
                              <span className="text-slate-700 font-medium">{template.steps} steps</span>
                            </div>
                          </div>

                          <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white">
                            Use Template
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="glass-subtle border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { title: 'CSSF minor onboarding requirements', type: 'Chat', time: '2 hours ago', status: 'completed' },
              { title: 'ESG disclosure timeline Q1 2024', type: 'Pathway', time: '1 day ago', status: 'in-progress' },
              { title: 'AML risk assessment - TechCorp', type: 'Workflow', time: '3 days ago', status: 'completed' }
            ].map((session, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{session.title}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span>{session.type}</span>
                      <span>•</span>
                      <span>{session.time}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={session.status === 'completed' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {session.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}