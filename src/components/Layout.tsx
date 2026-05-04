import { ReactNode } from 'react';
import { ArrowLeft, Home, CalendarDays, History, User } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  onBack?: () => void;
  activeTab?: 'home' | 'jobs' | 'history' | 'profile';
  onTabChange?: (tab: 'home' | 'jobs' | 'history' | 'profile') => void;
  hideBottomNav?: boolean;
}

export default function Layout({ 
  children, 
  title = 'BCI Field Service', 
  onBack, 
  activeTab = 'home',
  onTabChange,
  hideBottomNav = false
}: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-surface/80 backdrop-blur-md shadow-[0px_8px_24px_rgba(28,27,31,0.06)] h-16">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                aria-label="Back"
                className="p-2 rounded-full hover:bg-surface-container-high transition-colors active:scale-90"
              >
                <ArrowLeft className="w-6 h-6 text-primary" />
              </button>
            )}
            <h1 className="font-headline font-extrabold text-primary text-lg tracking-tight">
              {title}
            </h1>
          </div>
          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden border border-outline-variant/20">
            <User className="w-4 h-4 text-primary" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow pt-16 overflow-y-auto no-scrollbar">
        {children}
      </main>

      {/* Bottom Nav */}
      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 h-20 bg-surface-container-high/90 backdrop-blur-xl rounded-t-[1.5rem] shadow-[0px_-4px_12px_rgba(28,27,31,0.04)]">
          <div className="flex justify-around items-center h-full px-4">
            <button onClick={() => onTabChange?.('home')} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${activeTab === 'home' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}>
              <Home className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
            </button>
            <button onClick={() => onTabChange?.('jobs')} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${activeTab === 'jobs' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}>
              <CalendarDays className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Calendar</span>
            </button>
            <button onClick={() => onTabChange?.('history')} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${activeTab === 'history' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}>
              <History className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
            </button>
            <button onClick={() => onTabChange?.('profile')} className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}>
              <User className="w-6 h-6" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
