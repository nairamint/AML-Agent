import { useState } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  BookOpen, 
  FileText, 
  Globe, 
  Shield, 
  AlertTriangle,
  Bookmark,
  Calendar,
  Tag,
  TrendingUp,
  Users,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download,
  Share,
  MoreHorizontal,
  Plus
} from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

export function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const jurisdictions = [
    { id: 'eu', name: 'European Union', count: 1247 },
    { id: 'us', name: 'United States', count: 892 },
    { id: 'uk', name: 'United Kingdom', count: 734 },
    { id: 'sg', name: 'Singapore', count: 456 },
    { id: 'hk', name: 'Hong Kong', count: 389 },
  ];

  const domains = [
    { id: 'aml', name: 'Anti-Money Laundering', icon: Shield, count: 567 },
    { id: 'esg', name: 'ESG & Sustainability', icon: Globe, count: 423 },
    { id: 'sanctions', name: 'Sanctions', icon: AlertTriangle, count: 234 },
    { id: 'kyc', name: 'Know Your Customer', icon: Users, count: 345 },
    { id: 'data-protection', name: 'Data Protection', icon: FileText, count: 289 },
  ];

  const recentSearches = [
    'DORA implementation timeline',
    'ESG disclosure requirements 2024',
    'CSSF minor onboarding procedures',
    'AML risk assessment guidelines',
    'Sanctions screening protocols'
  ];

  const searchResults = [
    {
      id: 1,
      title: 'Digital Operational Resilience Act (DORA) - Implementation Guidelines',
      source: 'European Banking Authority',
      jurisdiction: 'EU',
      domain: 'Operational Risk',
      date: '2024-12-15',
      type: 'Regulation',
      relevance: 98,
      summary: 'Comprehensive guidelines for implementing digital operational resilience requirements for financial entities operating in the EU.',
      tags: ['DORA', 'Operational Risk', 'ICT Risk', 'Business Continuity'],
      bookmarked: true,
      views: 2847
    },
    {
      id: 2,
      title: 'ESG Reporting Standards - Corporate Sustainability Reporting Directive',
      source: 'European Commission',
      jurisdiction: 'EU',
      domain: 'ESG',
      date: '2024-11-28',
      type: 'Directive',
      relevance: 94,
      summary: 'Updated requirements for corporate sustainability reporting under the CSRD framework.',
      tags: ['CSRD', 'ESG', 'Sustainability', 'Disclosure'],
      bookmarked: false,
      views: 1923
    },
    {
      id: 3,
      title: 'Anti-Money Laundering Risk Assessment Methodology',
      source: 'Financial Action Task Force',
      jurisdiction: 'Global',
      domain: 'AML',
      date: '2024-10-22',
      type: 'Guidance',
      relevance: 91,
      summary: 'Best practices for conducting AML risk assessments in line with FATF recommendations.',
      tags: ['FATF', 'Risk Assessment', 'Money Laundering', 'Compliance'],
      bookmarked: true,
      views: 3456
    }
  ];

  const savedSearches = [
    { name: 'GDPR compliance updates', query: 'GDPR data protection 2024', alerts: 3 },
    { name: 'Sanctions screening protocols', query: 'sanctions screening procedures', alerts: 1 },
    { name: 'ESG disclosure requirements', query: 'ESG reporting sustainability disclosure', alerts: 5 }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Regulatory Intelligence Search</h1>
        <p className="text-slate-600">Advanced search across global regulatory databases and compliance resources</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search regulations, guidelines, case studies, and compliance resources..."
            className="pl-12 pr-4 py-3 text-base glass-input border-0 focus:ring-2 focus:ring-primary/20"
          />
          <Button 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary hover:bg-primary/90 text-white"
            size="sm"
          >
            Search
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <Card className="glass-subtle border-0 sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="w-4 h-4" />
                Search Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Filters */}
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Content Type</h4>
                <div className="space-y-2">
                  {['Regulations', 'Guidelines', 'Case Studies', 'Templates', 'Updates'].map((type) => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox />
                      <span className="text-sm text-slate-600">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Jurisdictions */}
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Jurisdiction</h4>
                <div className="space-y-2">
                  {jurisdictions.map((jurisdiction) => (
                    <label key={jurisdiction.id} className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <Checkbox />
                        <span className="text-sm text-slate-600">{jurisdiction.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{jurisdiction.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Domains */}
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Domain</h4>
                <div className="space-y-2">
                  {domains.map((domain) => (
                    <label key={domain.id} className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <Checkbox />
                        <domain.icon className="w-3 h-3 text-slate-500" />
                        <span className="text-sm text-slate-600">{domain.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{domain.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Date Range */}
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Date Range</h4>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-week">Last week</SelectItem>
                    <SelectItem value="last-month">Last month</SelectItem>
                    <SelectItem value="last-quarter">Last quarter</SelectItem>
                    <SelectItem value="last-year">Last year</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="results">Search Results</TabsTrigger>
              <TabsTrigger value="saved">Saved Searches</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
            </TabsList>

            <TabsContent value="results">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-slate-600">
                    Showing <span className="font-medium">1-10</span> of <span className="font-medium">247</span> results
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Sort by:</span>
                    <Select defaultValue="relevance">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="jurisdiction">Jurisdiction</SelectItem>
                        <SelectItem value="views">Popularity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Bookmark className="w-4 h-4 mr-2" />
                    Save Search
                  </Button>
                </div>
              </div>

              {/* Search Results */}
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <Card key={result.id} className="glass-subtle border-0 hover:bg-white/30 transition-all duration-200 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-slate-800 hover:text-primary transition-colors">
                              {result.title}
                            </h3>
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {result.source}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {result.jurisdiction}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {result.date}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {result.relevance}% match
                          </Badge>
                          <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-slate-700 mb-3 leading-relaxed">{result.summary}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {result.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              <Tag className="w-2 h-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {result.views} views
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`text-xs ${result.bookmarked ? 'text-yellow-600' : 'text-slate-500'}`}
                          >
                            <Star className={`w-3 h-3 mr-1 ${result.bookmarked ? 'fill-current' : ''}`} />
                            {result.bookmarked ? 'Saved' : 'Save'}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs text-slate-500">
                            <Share className="w-3 h-3 mr-1" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center mt-8">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm" className="bg-primary text-white">1</Button>
                  <Button variant="outline" size="sm">2</Button>
                  <Button variant="outline" size="sm">3</Button>
                  <span className="px-2 text-slate-500">...</span>
                  <Button variant="outline" size="sm">25</Button>
                  <Button variant="outline" size="sm">Next</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="saved">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">Saved Searches</h3>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    New Alert
                  </Button>
                </div>

                {savedSearches.map((search, index) => (
                  <Card key={index} className="glass-subtle border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800">{search.name}</h4>
                          <p className="text-sm text-slate-600 mt-1">{search.query}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            <span>Last updated: 2 hours ago</span>
                            {search.alerts > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {search.alerts} new result{search.alerts > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Search className="w-4 h-4" />
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

            <TabsContent value="recent">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Recent Searches</h3>
                
                <div className="space-y-2">
                  {recentSearches.map((search, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/20 hover:bg-white/30 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700">{search}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-500">
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trending">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Trending Topics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="glass-subtle border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800">DORA Implementation</h4>
                          <p className="text-xs text-slate-600">+340% search volume</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700">Digital operational resilience requirements gaining significant attention as deadline approaches.</p>
                    </CardContent>
                  </Card>

                  <Card className="glass-subtle border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-800">ESG Disclosure Updates</h4>
                          <p className="text-xs text-slate-600">+180% search volume</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700">New sustainability reporting requirements driving increased compliance research.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}