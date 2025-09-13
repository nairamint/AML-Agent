import { Search, Zap, Globe, Brain } from 'lucide-react';
import { Button } from './ui/button';

interface WelcomeScreenProps {
  onExampleClick: (query: string) => void;
}

export function WelcomeScreen({ onExampleClick }: WelcomeScreenProps) {
  const exampleQueries = [
    "What are the latest developments in AI?",
    "How does quantum computing work?",
    "What is the current state of renewable energy?",
    "Explain the benefits of meditation",
    "What are the trends in sustainable fashion?",
    "How do neural networks learn?"
  ];

  const features = [
    {
      icon: <Search className="w-6 h-6" />,
      title: "Accurate Answers",
      description: "Get precise, well-researched answers to your questions"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Information",
      description: "Access the most current information available"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Cited Sources",
      description: "Every answer comes with reliable source citations"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered",
      description: "Advanced AI understands context and nuance"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Where knowledge begins
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ask anything and get accurate, cited answers powered by advanced AI and real-time search.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div key={index} className="text-center space-y-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
              <div className="text-primary">
                {feature.icon}
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Example Queries */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-2">Try asking about...</h2>
          <p className="text-muted-foreground">Click any question to get started</p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {exampleQueries.map((query, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 text-left justify-start hover:bg-muted/80 transition-colors"
              onClick={() => onExampleClick(query)}
            >
              <div className="space-y-1">
                <p className="text-sm font-medium leading-relaxed">{query}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-8">
        <p className="text-sm text-muted-foreground">
          Powered by advanced AI • Real-time search • Cited sources
        </p>
      </div>
    </div>
  );
}