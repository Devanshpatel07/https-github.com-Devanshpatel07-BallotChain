import { Candidate } from '../types';
import { Award, BarChart3, TrendingUp, PieChart } from 'lucide-react';

interface ResultsChartProps {
  candidates: Candidate[];
}

export default function ResultsChart({ candidates }: ResultsChartProps) {
  const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);

  // Find the leading candidate
  const leadingCandidate = candidates.length > 0 
    ? [...candidates].sort((a, b) => b.votes - a.votes)[0]
    : null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6" id="results-dashboard">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-950 text-indigo-400 border border-indigo-800/60 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100 tracking-tight">Live Soroban Poll Results</h3>
            <p className="text-xs text-zinc-400">Real-time state updates derived directly from the contract instance storage.</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Total Ballots Cast</p>
          <p className="text-xl font-mono font-bold text-zinc-100">{totalVotes}</p>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-12 bg-zinc-950/40 border border-zinc-800/50 rounded-xl space-y-3">
          <p className="text-sm text-zinc-400 font-medium">No candidates registered yet</p>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">Use the candidate registration panel to invoke register_candidate() and seed the state.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Leading Candidate Highlight Banner */}
          {leadingCandidate && leadingCandidate.votes > 0 && (
            <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-xl flex items-center justify-between gap-4 animate-fade-in" id="leader-banner">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-950 text-amber-400 rounded-lg border border-amber-900/60 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-400">Current Leader</span>
                  <h4 className="text-sm font-bold text-zinc-100 truncate mt-0.5">{leadingCandidate.name}</h4>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono font-bold text-amber-400">
                  {totalVotes > 0 ? ((leadingCandidate.votes / totalVotes) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-[10px] text-zinc-500 font-medium uppercase">Share</p>
              </div>
            </div>
          )}

          {/* Graphical Progress Bars */}
          <div className="space-y-4">
            {candidates.map((candidate) => {
              const voteShare = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0;
              const isLeader = leadingCandidate && leadingCandidate.id === candidate.id && candidate.votes > 0;

              return (
                <div key={candidate.id} className="space-y-2 p-3 bg-zinc-950/50 border border-zinc-850 rounded-xl hover:border-zinc-800 transition-colors" id={`candidate-result-${candidate.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-zinc-500">#{candidate.id}</span>
                        <h4 className="font-semibold text-zinc-100 text-sm truncate">{candidate.name}</h4>
                        {isLeader && (
                          <span className="px-1.5 py-0.5 bg-amber-950 border border-amber-900/60 text-[9px] text-amber-400 rounded uppercase font-semibold">
                            leading
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{candidate.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-sm font-mono font-semibold text-zinc-100">{candidate.votes}</span>
                        <span className="text-[10px] text-zinc-500">votes</span>
                      </div>
                      <span className="text-xs font-mono font-medium text-zinc-400">
                        {voteShare.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Progressive Bar Visual */}
                  <div className="h-3 w-full bg-zinc-850 rounded-full overflow-hidden border border-zinc-800/40 relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out-expo ${
                        isLeader 
                          ? 'bg-gradient-to-r from-amber-500 to-amber-400' 
                          : 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                      }`}
                      style={{ width: `${voteShare}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simple Donut Chart Visualizer (Built purely with SVG) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4 border border-zinc-800 bg-zinc-950/20 rounded-xl">
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="rgba(39, 39, 42, 0.5)" strokeWidth="12" fill="transparent" />
                {totalVotes > 0 && (() => {
                  let accumulatedPercent = 0;
                  return candidates.map((candidate, idx) => {
                    const percent = (candidate.votes / totalVotes) * 100;
                    if (percent === 0) return null;
                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = 100 - accumulatedPercent + 25; // adjusted for orientation
                    accumulatedPercent += percent;
                    
                    const strokeColor = idx === 0 ? '#f59e0b' : idx === 1 ? '#6366f1' : idx === 2 ? '#10b981' : '#ec4899';
                    
                    return (
                      <circle
                        key={candidate.id}
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={strokeColor}
                        strokeWidth="12"
                        strokeDasharray={`${(percent * 2.512)} 251.2`} // 2 * PI * r = 251.2
                        strokeDashoffset={-((accumulatedPercent - percent) * 2.512)}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-in-out"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <PieChart className="w-4 h-4 text-zinc-500" />
                <span className="text-[10px] uppercase font-bold text-zinc-400 mt-1">Pool</span>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs w-full sm:w-auto">
              {candidates.map((candidate, idx) => {
                const color = idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-indigo-500' : idx === 2 ? 'bg-emerald-500' : 'bg-pink-500';
                return (
                  <div key={candidate.id} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    <span className="text-zinc-300 font-medium truncate max-w-[100px]">{candidate.name}</span>
                    <span className="text-zinc-500 font-mono font-medium ml-auto">({candidate.votes})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
