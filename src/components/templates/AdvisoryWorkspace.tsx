import { useState } from 'react';
import { Search, Home, Compass, Users, Calendar, Library, Settings, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { AdvisoryTimeline } from '../organisms/AdvisoryTimeline';
import { CaseFileSidebar } from '../organisms/CaseFileSidebar';
import { GemCard } from '../organisms/GemCard';
import { AdvisoryHeadline } from '../atoms/Typography';

interface AdvisoryWorkspaceProps {
  onSearch?: (query: string) => void;
}

export function AdvisoryWorkspace({ onSearch }: AdvisoryWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSearch = () => {
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  // Mock data
  const caseFile = {
    id: '1',
    clientProject: 'Crypto Exchange Compliance Review',
    jurisdiction: 'United Kingdom',
    riskProfile: 'High' as const,
    advisoryCount: 3,
    lastUpdated: 'Dec 8, 2025'
  };

  const advisories = [
    {
      id: '1',
      title: 'AML Directive Advisory',
      context: 'UK Crypto Exchange Compliance',
      date: 'Dec 8, 2025 • 14:30',
      version: '1.2',
      confidence: 'High' as const,
      recommendation: 'We recommend implementing enhanced customer due diligence procedures for cryptocurrency transactions exceeding £10,000 to comply with the UK Money Laundering Regulations 2017.',
      reasoning: 'The Financial Conduct Authority has updated guidance requiring additional scrutiny for high-value crypto transactions.',
      evidence: [
        {
          id: '1',
          source: 'FCA Guidance FG21/4',
          snippet: 'Firms should apply enhanced due diligence measures for cryptocurrency transactions...',
          jurisdiction: 'United Kingdom',
          timestamp: 'Dec 5, 2025',
          trustScore: 95,
          url: 'https://fca.gov.uk'
        }
      ],
      assumptions: ['Client operates as a cryptocurrency exchange', 'Transactions involve UK residents'],
      status: 'Approved' as const,
      comments: [
        {
          id: '1',
          author: 'Sarah Chen',
          content: 'Reviewed and approved. Please ensure implementation by Q1 2026.',
          timestamp: '2 hours ago'
        }
      ]
    }
  ];

  const gems = [
    {
      name: 'AML Specialist',
      description: 'Expert in Anti-Money Laundering regulations across multiple jurisdictions.',
      specialization: 'AML • KYC • Sanctions',
      type: 'Org-validated' as const,
      icon: 'shield' as const
    },
    {
      name: 'ESG Advisor',
      description: 'Environmental, Social, and Governance compliance guidance.',
      specialization: 'ESG • Sustainability • Reporting',
      type: 'Default' as const,
      icon: 'star' as const
    }
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-card border-r border-border transition-all duration-300`}>
        <div className="p-4 space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8"
            >
              <Menu className="h-4 w-4" />
            </Button>
            {sidebarOpen && (
              <AdvisoryHeadline className="text-[18px]">Advisory</AdvisoryHeadline>
            )}
          </div>

          {sidebarOpen && (
            <nav className="space-y-2">
              {[
                { icon: Home, label: 'Home', active: true },
                { icon: Compass, label: 'Discover' },
                { icon: Users, label: 'Agents' },
                { icon: Calendar, label: 'Calendar' },
                { icon: Library, label: 'Library' },
                { icon: Settings, label: 'Settings' }
              ].map((item) => (
                <Button
                  key={item.label}
                  variant={item.active ? "default" : "ghost"}
                  className="w-full justify-start h-9"
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              ))}
            </nav>
          )}
        </div>
      </div>

      {/* Center Panel */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 space-y-6">
          {/* Search Input */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
              <Textarea
                placeholder="Ask a compliance or advisory question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-12 pr-4 min-h-[60px] resize-none text-[16px] bg-card"
              />
              <Button
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
                className="absolute right-3 bottom-3 h-8"
              >
                Submit
              </Button>
            </div>
          </div>

          {/* Advisory Timeline */}
          <div className="max-w-4xl mx-auto">
            <AdvisoryTimeline advisories={advisories} />
          </div>

          {/* Gem Gallery */}
          <div className="max-w-4xl mx-auto space-y-4">
            <AdvisoryHeadline className="text-[20px]">Available Advisors</AdvisoryHeadline>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gems.map((gem, index) => (
                <GemCard
                  key={index}
                  name={gem.name}
                  description={gem.description}
                  specialization={gem.specialization}
                  type={gem.type}
                  icon={gem.icon}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <CaseFileSidebar caseFile={caseFile} />
    </div>
  );
}