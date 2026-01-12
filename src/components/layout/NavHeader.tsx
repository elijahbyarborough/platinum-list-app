import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useIsMobile';

export function NavHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Check if user wants to force desktop view
  const urlParams = new URLSearchParams(window.location.search);
  const forceDesktop = urlParams.get('desktop') === 'true';

  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
  const isNewSubmission = location.pathname === '/submit';
  const isSubmissionLog = location.pathname === '/submission-log';
  const isHistory = location.pathname === '/history';

  // For mobile, show desktop link instead of tabs
  if (isMobile && !forceDesktop) {
    return (
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(160,70%,40%)] flex items-center justify-center">
                <span className="text-background font-bold text-sm">PL</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="text-gradient">Platinum</span>
                <span className="text-foreground ml-1">List</span>
              </h1>
            </div>
            
            {/* Desktop Link */}
            <a
              href={`${window.location.pathname}?desktop=true`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-md hover:bg-secondary/50"
            >
              Desktop
            </a>
          </div>
        </div>
      </nav>
    );
  }

  // Desktop view - show normal navigation tabs
  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(160,70%,40%)] flex items-center justify-center">
              <span className="text-background font-bold text-sm">PL</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-gradient">Platinum</span>
              <span className="text-foreground ml-1">List</span>
            </h1>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('/dashboard')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isDashboard
                  ? 'bg-secondary text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </span>
            </button>
            <button
              onClick={() => navigate('/submit', { replace: false })}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isNewSubmission
                  ? 'bg-secondary text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Submission
              </span>
            </button>
            <button
              onClick={() => navigate('/submission-log')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isSubmissionLog
                  ? 'bg-secondary text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Submission Log
              </span>
            </button>
            <button
              onClick={() => navigate('/history')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isHistory
                  ? 'bg-secondary text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              )}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                History
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
