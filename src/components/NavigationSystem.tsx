import { useState } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { SearchPage } from './pages/SearchPage';
import { NavigatorsPage } from './pages/NavigatorsPage';
import { CaseFilesPage } from './pages/CaseFilesPage';
import { CreatePage } from './pages/CreatePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdvisoryConversation } from './AdvisoryConversation';

export type NavigationPage = 
  | 'conversation' 
  | 'dashboard' 
  | 'search' 
  | 'navigators' 
  | 'case-files' 
  | 'create' 
  | 'notifications' 
  | 'profile';

interface NavigationSystemProps {
  currentPage: NavigationPage;
  onSendMessage: (message: string) => void;
}

export function NavigationSystem({ currentPage, onSendMessage }: NavigationSystemProps) {
  const renderPage = () => {
    switch (currentPage) {
      case 'conversation':
        return <AdvisoryConversation onSendMessage={onSendMessage} />;
      case 'dashboard':
        return <DashboardPage />;
      case 'search':
        return <SearchPage />;
      case 'navigators':
        return <NavigatorsPage />;
      case 'case-files':
        return <CaseFilesPage />;
      case 'create':
        return <CreatePage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <AdvisoryConversation onSendMessage={onSendMessage} />;
    }
  };

  return (
    <div className="flex-1">
      {renderPage()}
    </div>
  );
}