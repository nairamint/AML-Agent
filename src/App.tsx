import { useEffect, useState } from 'react';
import { AdvisorySidebar } from './components/AdvisorySidebar';
import { AdvisoryHeader } from './components/AdvisoryHeader';
import { NavigationSystem, NavigationPage } from './components/NavigationSystem';
import { SkipNavigation } from './components/atoms/SkipLink';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('conversation');

  const handleSendMessage = (message: string) => {
    console.log('Advisory query:', message);
    // Here you would implement the advisory search logic
    // This could trigger AI analysis, regulatory lookup, etc.
  };

  const handleNavigation = (page: string) => {
    setCurrentPage(page as NavigationPage);
    
    // Update document title for better UX
    const pageNames: Record<string, string> = {
      'conversation': 'Advisory Navigator',
      'dashboard': 'Dashboard',
      'search': 'Search & Discovery',
      'navigators': 'AI Navigators',
      'create': 'Create New',
      'case-files': 'Case Files',
      'notifications': 'Notifications',
      'profile': 'Profile'
    };
    
    document.title = `${pageNames[page] || page} - Advisory Platform`;
    
    // Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: pageNames[page],
        page_location: window.location.href,
      });
    }
  };

  useEffect(() => {
    // Use light theme with glassmorphism
    document.documentElement.classList.remove('dark');
    
    // Set initial page title
    document.title = 'Advisory Navigator - Advisory Platform';
    
    // Add global keyboard shortcuts
    const handleKeyboard = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNavigation('search');
      }
      
      // Escape to close any open modals/popups
      if (e.key === 'Escape') {
        // This would be handled by individual components
        document.dispatchEvent(new CustomEvent('closeAllModals'));
      }
    };
    
    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex relative">
        {/* Skip Navigation for Accessibility */}
        <SkipNavigation />
        
        {/* Neutral Gradient Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50" />
        <div className="fixed inset-0 bg-gradient-to-tl from-slate-100/50 via-gray-100/30 to-zinc-100/50" />
        
        {/* Content */}
        <div className="relative z-10 flex w-full min-h-screen">
          {/* Fixed Sidebar */}
          <div className="fixed left-0 top-0 h-full z-30">
            <nav id="navigation" aria-label="Main navigation">
              <AdvisorySidebar 
                onNavigate={handleNavigation}
                currentPage={currentPage}
              />
            </nav>
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col ml-16">
            {/* Fixed Header */}
            <div className="sticky top-0 z-20">
              <AdvisoryHeader />
            </div>
            
            {/* Dynamic Content Area */}
            <main id="main-content" className="flex-1" role="main">
              <NavigationSystem 
                currentPage={currentPage}
                onSendMessage={handleSendMessage}
              />
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}