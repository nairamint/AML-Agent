import { 
  Folder, 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  FileText,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Archive,
  Download,
  Share,
  Tag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';

const cases = [
  {
    id: 1,
    title: 'AML Due Diligence - TechStart Ltd',
    type: 'AML Assessment',
    status: 'active',
    priority: 'high',
    progress: 65,
    assignee: 'Sarah Chen',
    created: '2024-01-05',
    updated: '3 hours ago',
    dueDate: '2024-01-20',
    tags: ['High Risk', 'Enhanced DD', 'Tech Sector']
  },
  {
    id: 2,
    title: 'ESG Compliance Review - GreenCorp',
    type: 'ESG Disclosure',
    status: 'review',
    priority: 'medium',
    progress: 90,
    assignee: 'Mike Rodriguez',
    created: '2024-01-02',
    updated: '1 day ago',
    dueDate: '2024-01-15',
    tags: ['Sustainability', 'CSRD', 'Annual Review']
  },
  {
    id: 3,
    title: 'Sanctions Screening - Global Trade Co',
    type: 'Sanctions Review',
    status: 'completed',
    priority: 'urgent',
    progress: 100,
    assignee: 'John Davis',
    created: '2023-12-28',
    updated: '5 days ago',
    dueDate: '2024-01-10',
    tags: ['Watchlist', 'Trade Finance', 'Cleared']
  }
];

export function CaseFilesPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Case Files & Workflows</h1>
          <p className="text-slate-600 mt-1">Manage compliance cases, pathways, and workflow templates</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Archive className="w-4 h-4 mr-2" />
            Archive
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Case
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search cases, workflows, templates..."
            className="pl-10 glass-input"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cases</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="review">In Review</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Case List */}
      <div className="space-y-4">
        {cases.map((caseItem) => (
          <Card key={caseItem.id} className="glass-subtle border-0 hover:bg-white/30 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-800">{caseItem.title}</h3>
                    <Badge variant="outline" className="text-xs">{caseItem.type}</Badge>
                    <Badge 
                      className={`text-xs ${
                        caseItem.status === 'active' ? 'bg-blue-100 text-blue-700' :
                        caseItem.status === 'review' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}
                    >
                      {caseItem.status}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={`text-xs ${
                        caseItem.priority === 'urgent' ? 'text-red-700 border-red-300' :
                        caseItem.priority === 'high' ? 'text-orange-700 border-orange-300' :
                        'text-yellow-700 border-yellow-300'
                      }`}
                    >
                      {caseItem.priority} priority
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-4 h-4" />
                      <span>{caseItem.assignee}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>Due {caseItem.dueDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>Updated {caseItem.updated}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {caseItem.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className="text-slate-600">{caseItem.progress}% Complete</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Progress value={caseItem.progress} className="h-2" />
                  </div>

                  <div className="flex items-center gap-2">
                    {caseItem.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="w-2 h-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share className="w-4 h-4" />
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
    </div>
  );
}