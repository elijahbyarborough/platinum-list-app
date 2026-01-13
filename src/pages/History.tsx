import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';
import { formatDate } from '@/utils/formatting';

interface DashboardSnapshot {
  id: number;
  snapshot_date: string;
  pdf_url: string;
  created_at: string;
}

export default function History() {
  const { data: snapshots = [], isLoading, error } = useQuery({
    queryKey: ['dashboard-snapshots'],
    queryFn: api.getDashboardSnapshots,
  });

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center p-8 rounded-lg bg-card border border-destructive/20">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading History</h3>
          <p className="text-muted-foreground text-sm">Unable to fetch snapshot history. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-grid-pattern">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">Dashboard History</h1>
          <p className="text-muted-foreground">Daily snapshots of the Platinum List dashboard</p>
        </div>

        {/* Snapshots List */}
        {snapshots.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-xl bg-card border border-border/50">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Snapshots Yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Daily snapshots will appear here after the first automated capture at 8:00 AM ET
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
            <div className="space-y-1">
              {snapshots.map((snapshot: DashboardSnapshot) => (
                <div
                  key={snapshot.id}
                  className="px-6 py-2 border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm">
                          {formatDate(snapshot.snapshot_date)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Snapshot captured at {new Date(snapshot.created_at).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            timeZone: 'America/New_York',
                            hour12: true 
                          })} ET
                        </div>
                      </div>
                    </div>
                    <a
                      href={snapshot.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      View PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

