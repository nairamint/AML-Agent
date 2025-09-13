import { 
  Search, 
  Filter, 
  Star, 
  Shield, 
  Building2, 
  Wrench, 
  Plus, 
  MessageSquare,
  Workflow,
  Upload,
  Bot,
  Home,
  Calendar,
  Pin,
  FileText,
  Archive,
  Download,
  Bell,
  CheckCircle,
  AlertTriangle,
  AtSign,
  User,
  Settings,
  Lock,
  Palette,
  Globe,
  HelpCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface PopoutProps {
  type: 'navigators' | 'create' | 'home' | 'search' | 'case-files' | 'notifications' | 'profile' | null;
  onClose: () => void;
  onNavigate?: (page: string) => void;
}

export function SidebarPopout({ type, onClose, onNavigate }: PopoutProps) {
  if (!type) return null;

  const renderNavigatorsContent = () => (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">AI Navigators</h3>
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => {
              if (onNavigate) {
                onNavigate('navigators');
                onClose();
              }
            }}
          >
            View All
          </Button>
        </div>
        <div className="space-y-3">
          <div className="glass-subtle rounded-xl p-4 hover:bg-white/25 transition-all duration-200 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">AML Navigator</span>
                  <Badge variant="secondary" className="text-xs">Featured</Badge>
                </div>
                <p className="text-sm text-slate-600">Anti-Money Laundering compliance assistant</p>
              </div>
            </div>
          </div>
          
          <div className="glass-subtle rounded-xl p-4 hover:bg-white/25 transition-all duration-200 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">ESG Navigator</span>
                  <Badge variant="secondary" className="text-xs">Featured</Badge>
                </div>
                <p className="text-sm text-slate-600">Environmental, Social & Governance advisor</p>
              </div>
            </div>
          </div>
          
          <div className="glass-subtle rounded-xl p-4 hover:bg-white/25 transition-all duration-200 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">Sanctions Navigator</span>
                  <Badge variant="secondary" className="text-xs">Featured</Badge>
                </div>
                <p className="text-sm text-slate-600">Global sanctions screening & analysis</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Org-Validated Navigators
        </h4>
        <div className="space-y-2">
          <div className="glass-subtle rounded-lg p-3 hover:bg-white/25 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">KYC Navigator</span>
              <Badge variant="outline" className="text-xs">Certified</Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1">Customer due diligence workflows</p>
          </div>
          <div className="glass-subtle rounded-lg p-3 hover:bg-white/25 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">GDPR Navigator</span>
              <Badge variant="outline" className="text-xs">Certified</Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1">Data protection compliance</p>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Custom & Tools
        </h4>
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-white/25">
            <User className="w-4 h-4 mr-2" />
            My Custom Navigators
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-white/25">
            <Bot className="w-4 h-4 mr-2" />
            Navigator Composer
          </Button>
        </div>
      </div>
    </div>
  );

  const renderCreateContent = () => (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Create New</h3>
        <Button 
          size="sm" 
          className="bg-primary hover:bg-primary/90 text-white"
          onClick={() => {
            if (onNavigate) {
              onNavigate('create');
              onClose();
            }
          }}
        >
          View All
        </Button>
      </div>
      <div className="grid gap-3">
        <Button variant="ghost" className="h-auto p-4 justify-start text-left hover:bg-white/25">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-slate-800">New Chat</div>
              <div className="text-sm text-slate-600">Single analysis consultation</div>
            </div>
          </div>
        </Button>
        
        <Button variant="ghost" className="h-auto p-4 justify-start text-left hover:bg-white/25">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-slate-800">New Pathway</div>
              <div className="text-sm text-slate-600">Multi-step case journey</div>
            </div>
          </div>
        </Button>
        
        <Button variant="ghost" className="h-auto p-4 justify-start text-left hover:bg-white/25">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-slate-800">Upload Documents</div>
              <div className="text-sm text-slate-600">Add context for Navigators</div>
            </div>
          </div>
        </Button>
        
        <Button variant="ghost" className="h-auto p-4 justify-start text-left hover:bg-white/25">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-slate-800">Build Navigator</div>
              <div className="text-sm text-slate-600">Create custom AI assistant</div>
            </div>
          </div>
        </Button>
      </div>
    </div>
  );

  const renderHomeContent = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Welcome Back</h3>
        <Button 
          size="sm" 
          className="bg-primary hover:bg-primary/90 text-white"
          onClick={() => {
            if (onNavigate) {
              onNavigate('dashboard');
              onClose();
            }
          }}
        >
          Dashboard
        </Button>
      </div>
      
      <div>
        <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Recent Chats
        </h4>
        <div className="space-y-2">
          <div className="glass-subtle rounded-lg p-3 hover:bg-white/25 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">CSSF minor onboarding requirements</span>
              <span className="text-xs text-slate-500">2 min ago</span>
            </div>
          </div>
          <div className="glass-subtle rounded-lg p-3 hover:bg-white/25 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">ESG disclosure timeline Q1 2024</span>
              <span className="text-xs text-slate-500">1 hour ago</span>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
          <Workflow className="w-4 h-4" />
          Ongoing Workflows
        </h4>
        <div className="space-y-2">
          <div className="glass-subtle rounded-lg p-3 hover:bg-white/25 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">AML Risk Assessment - ClientCorp</span>
              <Badge variant="secondary" className="text-xs">In Progress</Badge>
            </div>
            <div className="flex items-center mt-2 gap-2">
              <div className="w-full bg-slate-200 rounded-full h-1">
                <div className="bg-primary h-1 rounded-full" style={{width: '65%'}}></div>
              </div>
              <span className="text-xs text-slate-500">65%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
          <Pin className="w-4 h-4" />
          Pinned Navigators
        </h4>
        <div className="flex gap-2">
          <Badge variant="outline" className="cursor-pointer hover:bg-white/25">AML Navigator</Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-white/25">Sanctions</Badge>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Regulatory Calendar
        </h4>
        <div className="space-y-2">
          <div className="glass-subtle rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-800">DORA compliance deadline</span>
              <span className="text-xs text-orange-600 font-medium">Jan 17, 2025</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSearchContent = () => (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Search & Discovery</h3>
        <Button 
          size="sm" 
          className="bg-primary hover:bg-primary/90 text-white"
          onClick={() => {
            if (onNavigate) {
              onNavigate('search');
              onClose();
            }
          }}
        >
          Advanced Search
        </Button>
      </div>
      
      <div className="space-y-3">
        <Input 
          placeholder="Search chats, workflows, navigators..." 
          className="glass-input"
        />
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-slate-600 border-slate-300">
            <Filter className="w-3 h-3 mr-1" />
            Filters
          </Button>
          <Button variant="outline" size="sm" className="text-slate-600 border-slate-300">
            Jurisdiction
          </Button>
          <Button variant="outline" size="sm" className="text-slate-600 border-slate-300">
            Domain
          </Button>
        </div>
      </div>
      
      <Separator />
      
      <div>
        <h4 className="font-medium text-slate-700 mb-3">Saved Searches</h4>
        <div className="space-y-2">
          <div className="glass-subtle rounded-lg p-3 hover:bg-white/25 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-800">GDPR compliance updates</span>
              <Star className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="glass-subtle rounded-lg p-3 hover:bg-white/25 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-800">Sanctions screening protocols</span>
              <Star className="w-4 h-4 text-amber-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCaseFilesContent = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Case Files & Pathways</h3>
        <Button 
          size="sm" 
          className="bg-primary hover:bg-primary/90 text-white"
          onClick={() => {
            if (onNavigate) {
              onNavigate('case-files');
              onClose();
            }
          }}
        >
          Manage All
        </Button>
      </div>
      
      <div>
        <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
          <Workflow className="w-4 h-4" />
          Active Workflows
        </h4>
        <div className="space-y-2">
          <div className="glass-subtle rounded-lg p-4 hover:bg-white/25 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-800">AML Due Diligence - TechStart Ltd</span>
              <Badge variant="secondary" className="text-xs">Active</Badge>
            </div>
            <p className="text-sm text-slate-600 mb-2">Enhanced due diligence for high-risk client</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Started 3 days ago</span>
              <span className="text-xs text-slate-500">Step 4 of 7</span>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Workflow Templates
        </h4>
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-white/25">
            <Shield className="w-4 h-4 mr-2" />
            AML Workflow Template
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-white/25">
            <Globe className="w-4 h-4 mr-2" />
            ESG Disclosure Workflow
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-white/25">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Sanctions Review Template
          </Button>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
          <Archive className="w-4 h-4" />
          Archive & Export
        </h4>
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-white/25">
            <Archive className="w-4 h-4 mr-2" />
            Archived Workflows
          </Button>
          <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-white/25">
            <Download className="w-4 h-4 mr-2" />
            Export Options
          </Button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsContent = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
        <Button 
          size="sm" 
          className="bg-primary hover:bg-primary/90 text-white"
          onClick={() => {
            if (onNavigate) {
              onNavigate('notifications');
              onClose();
            }
          }}
        >
          View All
        </Button>
      </div>
      
      <div>
        <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Recent Updates
        </h4>
        <div className="space-y-3">
          <div className="glass-subtle rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">AML Navigator updated</p>
                <p className="text-xs text-slate-600 mt-1">New regulatory guidance from FATF integrated</p>
                <span className="text-xs text-slate-500">2 hours ago</span>
              </div>
            </div>
          </div>
          
          <div className="glass-subtle rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">Workflow deadline approaching</p>
                <p className="text-xs text-slate-600 mt-1">ESG disclosure review due in 2 days</p>
                <span className="text-xs text-slate-500">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Review Requests
        </h4>
        <div className="space-y-2">
          <div className="glass-subtle rounded-lg p-3 hover:bg-white/25 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-800">Risk assessment requires approval</span>
              <Badge variant="outline" className="text-xs">Pending</Badge>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
          <AtSign className="w-4 h-4" />
          Mentions & Comments
        </h4>
        <div className="space-y-2">
          <div className="glass-subtle rounded-lg p-3 hover:bg-white/25 transition-all duration-200 cursor-pointer">
            <p className="text-sm text-slate-800">@sarah.jones mentioned you in "Q4 Compliance Review"</p>
            <span className="text-xs text-slate-500">3 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfileContent = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl overflow-hidden">
          <ImageWithFallback 
            src="https://images.unsplash.com/photo-1652471949169-9c587e8898cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHdvbWFuJTIwaGVhZHNob3R8ZW58MXx8fHwxNzU3MzY1OTQ2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Sarah Chen</h3>
          <p className="text-sm text-slate-600">Senior Compliance Officer</p>
          <p className="text-xs text-slate-500">RegFinancial Services Ltd</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Account
          </h4>
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-white/25">
              <User className="w-4 h-4 mr-2" />
              Profile Settings
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-white/25">
              <Lock className="w-4 h-4 mr-2" />
              Security & Privacy
            </Button>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Preferences
          </h4>
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-white/25">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-white/25">
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </Button>
            <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-white/25">
              <Globe className="w-4 h-4 mr-2" />
              Language & Region
            </Button>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-slate-700 mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Support
          </h4>
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-white/25">
              <HelpCircle className="w-4 h-4 mr-2" />
              Help Center
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const getContent = () => {
    switch (type) {
      case 'navigators': return renderNavigatorsContent();
      case 'create': return renderCreateContent();
      case 'home': return renderHomeContent();
      case 'search': return renderSearchContent();
      case 'case-files': return renderCaseFilesContent();
      case 'notifications': return renderNotificationsContent();
      case 'profile': return renderProfileContent();
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Popout Panel */}
      <div className="absolute left-20 top-0 h-full w-80 glass border-r border-slate-200/40 shadow-2xl">
        <ScrollArea className="h-full">
          {getContent()}
        </ScrollArea>
      </div>
    </div>
  );
}