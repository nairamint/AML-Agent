import { useState } from 'react';
import { 
  Home, 
  Search, 
  Bot, 
  Plus, 
  BarChart3, 
  Folder,
  Bell, 
  User
} from 'lucide-react';
import { Button } from './ui/button';
import { SidebarPopout } from './SidebarPopout';
import { ImageWithFallback } from './figma/ImageWithFallback';

type PopoutType = 'navigators' | 'create' | 'home' | 'search' | 'case-files' | 'notifications' | 'profile' | null;

interface AdvisorySidebarProps {
  onNavigate?: (page: string) => void;
  currentPage?: string;
}

export function AdvisorySidebar({ onNavigate, currentPage = 'conversation' }: AdvisorySidebarProps) {
  const [activePopout, setActivePopout] = useState<PopoutType>(null);

  const navigationItems = [
    { icon: Bot, label: 'Navigators', key: 'navigators' as PopoutType, page: 'navigators', hasPopout: true },
    { icon: Plus, label: 'Create', key: 'create' as PopoutType, page: 'create', hasPopout: true },
    { icon: Home, label: 'Home', key: 'home' as PopoutType, page: 'dashboard', hasPopout: true },
    { icon: Search, label: 'Search', key: 'search' as PopoutType, page: 'search', hasPopout: true },
    { icon: Folder, label: 'Case Files', key: 'case-files' as PopoutType, page: 'case-files', hasPopout: true },
  ];

  const userItems = [
    { icon: Bell, label: 'Notifications', key: 'notifications' as PopoutType, page: 'notifications', hasPopout: true },
    { icon: User, label: 'Profile', key: 'profile' as PopoutType, page: 'profile', isProfile: true, hasPopout: true },
  ];

  const handleItemClick = (key: PopoutType, page?: string, hasPopout?: boolean) => {
    // If it has a popout, show/hide the popout first
    if (hasPopout) {
      setActivePopout(activePopout === key ? null : key);
    } else if (onNavigate && page) {
      // If no popout but has page, navigate directly
      onNavigate(page);
      setActivePopout(null);
    }
  };

  const handleClosePopout = () => {
    setActivePopout(null);
  };

  return (
    <>
      <div className="w-16 h-full glass-navigation border-r border-slate-200/40 flex flex-col items-center py-6">
        {/* Logo */}
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mb-8 glass-subtle">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-3 mb-auto">
          {navigationItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              size="sm"
              onClick={() => handleItemClick(item.key, item.page, item.hasPopout)}
              className={`w-10 h-10 p-0 rounded-xl transition-all duration-200 ${
                currentPage === item.page || activePopout === item.key
                  ? 'glass-subtle text-Black shadow-lg'
                  : 'text-slate-600 hover:text-white hover:bg-white/15'
              }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
            </Button>
          ))}
        </nav>

        {/* User actions */}
        <div className="flex flex-col gap-3">
          {userItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              size="sm"
              onClick={() => handleItemClick(item.key, item.page, item.hasPopout)}
              className={`w-10 h-10 p-0 rounded-xl transition-all duration-200 ${
                currentPage === item.page || activePopout === item.key
                  ? 'glass-subtle text-white shadow-lg'
                  : 'text-slate-600 hover:text-white hover:bg-white/15'
              } ${item.isProfile ? 'overflow-hidden' : ''}`}
              title={item.label}
            >
              {item.isProfile ? (
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1652471949169-9c587e8898cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHdvbWFuJTIwaGVhZHNob3R8ZW58MXx8fHwxNzU3MzY1OTQ2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Profile"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <item.icon className="w-5 h-5" />
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Popout Panel */}
      <SidebarPopout 
        type={activePopout} 
        onClose={handleClosePopout}
        onNavigate={onNavigate}
      />
    </>
  );
}