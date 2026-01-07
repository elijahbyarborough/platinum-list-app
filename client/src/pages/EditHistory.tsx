import { useQuery } from '@tanstack/react-query';
import { EditComparison } from '@/types/editHistory';
import { api } from '@/utils/api';
import { formatDate, formatDateTime, formatMultiple } from '@/utils/formatting';
import { cn } from '@/lib/utils';
import { getFiscalYearLabels } from '@/utils/fiscalYear';

export default function EditHistory() {
  const { data: comparisons = [], isLoading, error } = useQuery({
    queryKey: ['editHistory'],
    queryFn: api.getEditHistory,
  });

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading edit history...</p>
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
          <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Data</h3>
          <p className="text-muted-foreground text-sm">Unable to fetch edit history. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-grid-pattern">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">See All Edits</h1>
          <p className="text-muted-foreground">Before and after comparison of all estimate edits</p>
        </div>

        {comparisons.length === 0 ? (
          <div className="rounded-xl bg-card border border-border/50 p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No edits yet</h3>
            <p className="text-muted-foreground text-sm">Edit history will appear here once companies are updated</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comparisons.map((comparison, index) => {
              // Get fiscal year labels (using the "after" fiscal year end date as reference)
              // We'll need to get this from the company data, but for now use a placeholder
              const labels = Array.from({ length: 11 }, (_, i) => `FY${i + 1}`);
              
              return (
                <div key={index} className="rounded-xl bg-card border border-border/50 overflow-hidden">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-border/50 bg-secondary/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">
                          <span className="font-mono">{comparison.ticker}</span>
                          <span className="ml-2 text-muted-foreground font-normal">{comparison.company_name}</span>
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Edited on {formatDate(comparison.after.submitted_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <div className="text-muted-foreground">Before</div>
                          <div className="font-medium">{comparison.before.analyst_initials}</div>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="text-right">
                          <div className="text-muted-foreground">After</div>
                          <div className="font-medium">{comparison.after.analyst_initials}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Before Column */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                          <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                            Before ({formatDate(comparison.before.submitted_at)})
                          </h4>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Exit Multiple</div>
                            <div className="font-mono">
                              {comparison.before.exit_multiple !== null ? (
                                <span>
                                  {formatMultiple(comparison.before.exit_multiple)}
                                  <span className="text-muted-foreground text-xs ml-1 font-sans">({comparison.before.metric_type})</span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Metrics</div>
                            <div className="grid grid-cols-11 gap-1 text-xs font-mono">
                              {comparison.before.metrics.map((val, idx) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    "p-1.5 rounded text-center",
                                    val !== null ? "bg-secondary/50" : "bg-secondary/20 text-muted-foreground"
                                  )}
                                >
                                  {val !== null ? val.toFixed(2) : '—'}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Dividends</div>
                            <div className="grid grid-cols-11 gap-1 text-xs font-mono">
                              {comparison.before.dividends.map((val, idx) => (
                                <div
                                  key={idx}
                                  className={cn(
                                    "p-1.5 rounded text-center",
                                    val !== null ? "bg-secondary/50" : "bg-secondary/20 text-muted-foreground"
                                  )}
                                >
                                  {val !== null ? val.toFixed(2) : '—'}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* After Column */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <h4 className="font-semibold text-sm uppercase tracking-wider text-primary">
                            After ({formatDate(comparison.after.submitted_at)})
                          </h4>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Exit Multiple</div>
                            <div className="font-mono">
                              {comparison.after.exit_multiple !== null ? (
                                <span>
                                  {formatMultiple(comparison.after.exit_multiple)}
                                  <span className="text-muted-foreground text-xs ml-1 font-sans">({comparison.after.metric_type})</span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Metrics</div>
                            <div className="grid grid-cols-11 gap-1 text-xs font-mono">
                              {comparison.after.metrics.map((val, idx) => {
                                const beforeVal = comparison.before.metrics[idx];
                                const changed = beforeVal !== val;
                                return (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "p-1.5 rounded text-center",
                                      val !== null 
                                        ? changed 
                                          ? "bg-primary/20 border border-primary/50" 
                                          : "bg-secondary/50"
                                        : "bg-secondary/20 text-muted-foreground"
                                    )}
                                  >
                                    {val !== null ? val.toFixed(2) : '—'}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Dividends</div>
                            <div className="grid grid-cols-11 gap-1 text-xs font-mono">
                              {comparison.after.dividends.map((val, idx) => {
                                const beforeVal = comparison.before.dividends[idx];
                                const changed = beforeVal !== val;
                                return (
                                  <div
                                    key={idx}
                                    className={cn(
                                      "p-1.5 rounded text-center",
                                      val !== null 
                                        ? changed 
                                          ? "bg-primary/20 border border-primary/50" 
                                          : "bg-secondary/50"
                                        : "bg-secondary/20 text-muted-foreground"
                                    )}
                                  >
                                    {val !== null ? val.toFixed(2) : '—'}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

