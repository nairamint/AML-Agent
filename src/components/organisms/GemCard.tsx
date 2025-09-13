import { MessageCircle, Star, Shield, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { AdvisorySubheading, AdvisoryBody, AdvisoryCaption } from '../atoms/Typography';

interface GemCardProps {
  name: string;
  description: string;
  specialization: string;
  type: 'Custom' | 'Default' | 'Org-validated';
  icon?: 'shield' | 'dollar' | 'alert' | 'star';
  onChat?: () => void;
}

export function GemCard({ 
  name, 
  description, 
  specialization, 
  type, 
  icon = 'shield',
  onChat 
}: GemCardProps) {
  const getIcon = () => {
    switch (icon) {
      case 'shield':
        return <Shield className="h-6 w-6" />;
      case 'dollar':
        return <DollarSign className="h-6 w-6" />;
      case 'alert':
        return <AlertTriangle className="h-6 w-6" />;
      case 'star':
        return <Star className="h-6 w-6" />;
      default:
        return <Shield className="h-6 w-6" />;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'Custom':
        return 'bg-primary text-primary-foreground';
      case 'Org-validated':
        return 'bg-success text-success-foreground';
      case 'Default':
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="bg-card text-card-foreground p-4 space-y-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            {getIcon()}
          </div>
          <div className="space-y-1">
            <AdvisorySubheading className="text-[16px]">{name}</AdvisorySubheading>
            <AdvisoryCaption>{specialization}</AdvisoryCaption>
          </div>
        </div>
        
        <Badge className={getTypeColor() + " text-[12px] h-5"}>
          {type}
        </Badge>
      </div>

      <AdvisoryBody className="text-[14px] text-muted-foreground leading-relaxed">
        {description}
      </AdvisoryBody>

      <Button 
        onClick={onChat}
        className="w-full"
        size="sm"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Chat
      </Button>
    </Card>
  );
}