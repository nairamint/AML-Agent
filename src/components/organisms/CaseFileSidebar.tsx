import { FileText, Download, Filter, Calendar, Building, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AdvisorySubheading, AdvisoryBody, AdvisoryCaption } from '../atoms/Typography';

interface CaseFile {
  id: string;
  clientProject: string;
  jurisdiction: string;
  riskProfile: 'Low' | 'Medium' | 'High';
  advisoryCount: number;
  lastUpdated: string;
}

interface CaseFileSidebarProps {
  caseFile: CaseFile;
  onExport?: (format: string) => void;
  onFilter?: (filter: string) => void;
}

export function CaseFileSidebar({ caseFile, onExport, onFilter }: CaseFileSidebarProps) {
  const getRiskProfileColor = () => {
    switch (caseFile.riskProfile) {
      case 'High':
        return 'bg-destructive text-destructive-foreground';
      case 'Medium':
        return 'bg-warning text-warning-foreground';
      case 'Low':
        return 'bg-success text-success-foreground';
    }
  };

  return (
    <div className="w-80 space-y-4">
      <Card className="bg-card text-card-foreground p-4 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <AdvisorySubheading className="text-[16px]">Case File</AdvisorySubheading>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <AdvisoryCaption>Client/Project</AdvisoryCaption>
            <AdvisoryBody className="text-[14px] font-medium">{caseFile.clientProject}</AdvisoryBody>
          </div>

          <div className="space-y-1">
            <AdvisoryCaption>Jurisdiction</AdvisoryCaption>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <AdvisoryBody className="text-[14px]">{caseFile.jurisdiction}</AdvisoryBody>
            </div>
          </div>

          <div className="space-y-1">
            <AdvisoryCaption>Risk Profile</AdvisoryCaption>
            <Badge className={getRiskProfileColor() + " text-[12px] h-6 w-fit"}>
              <AlertCircle className="h-3 w-3 mr-1" />
              {caseFile.riskProfile} Risk
            </Badge>
          </div>

          <div className="space-y-1">
            <AdvisoryCaption>Advisory Notes</AdvisoryCaption>
            <AdvisoryBody className="text-[14px]">{caseFile.advisoryCount} linked advisories</AdvisoryBody>
          </div>

          <div className="space-y-1">
            <AdvisoryCaption>Last Updated</AdvisoryCaption>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <AdvisoryBody className="text-[14px]">{caseFile.lastUpdated}</AdvisoryBody>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-card text-card-foreground p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <AdvisorySubheading className="text-[16px]">Filters</AdvisorySubheading>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <AdvisoryCaption>Advisory Type</AdvisoryCaption>
            <Select onValueChange={onFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="aml">AML Directive</SelectItem>
                <SelectItem value="kyc">KYC Compliance</SelectItem>
                <SelectItem value="sanctions">Sanctions</SelectItem>
                <SelectItem value="esg">ESG Requirements</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <AdvisoryCaption>Confidence Level</AdvisoryCaption>
            <Select onValueChange={onFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="high">High Confidence</SelectItem>
                <SelectItem value="medium">Medium Confidence</SelectItem>
                <SelectItem value="low">Low Confidence</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="bg-card text-card-foreground p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          <AdvisorySubheading className="text-[16px]">Export Options</AdvisorySubheading>
        </div>

        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start h-8"
            onClick={() => onExport?.('pdf')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start h-8"
            onClick={() => onExport?.('docx')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as DOCX
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start h-8"
            onClick={() => onExport?.('json')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export as JSON
          </Button>
        </div>
      </Card>
    </div>
  );
}