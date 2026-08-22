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
    <div className="mc-diamond-panel p-6 space-y-6" id="results-dashboard">
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-black border-2 border-black text-[#2bf3ff]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="mc-title text-[#2bf3ff]">Live Soroban Poll Results</h3>
            <p className="text-sm text-[#aaaaaa]">Real-time state updates derived directly from the contract instance storage.</p>
          </div>
        </div>
        <div className="text-right leading-none">
          <p className="text-[10px] mc-pixel-font text-zinc-400 uppercase">Total Ballots</p>
          <p className="text-xl font-bold font-mono text-[#ffd666] mt-1">{totalVotes}</p>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-12 bg-black border-4 border-black space-y-3">
          <p className="text-sm text-zinc-400 font-medium font-sans">No candidates registered yet</p>
          <p className="text-xs text-zinc-500 max-w-xs mx-auto">Use the candidate registration panel to invoke register_candidate() and seed the state.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Leading Candidate Highlight Banner */}
          {leadingCandidate && leadingCandidate.votes > 0 && (
            <div className="p-4 bg-[#2d2105] border-4 border-[#ffaa00] flex items-center justify-between gap-4 animate-fade-in" id="leader-banner">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black border-2 border-black text-[#ffaa00] shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] mc-pixel-font text-[#ffaa00]">CURRENT LEADER</span>
                  <h4 className="text-md font-bold text-white mt-1">{leadingCandidate.name}</h4>
                </div>
              </div>
              <div className="text-right leading-none">
                <p className="text-lg font-bold font-mono text-[#ffaa00]">
                  {totalVotes > 0 ? ((leadingCandidate.votes / totalVotes) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-[9px] mc-pixel-font text-zinc-500 uppercase mt-0.5">Share</p>
              </div>
            </div>
          )}

          {/* Graphical Progress Bars */}
          <div className="space-y-4">
            {candidates.map((candidate) => {
              const voteShare = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0;
              const isLeader = leadingCandidate && leadingCandidate.id === candidate.id && candidate.votes > 0;

              return (
                <div key={candidate.id} className="space-y-2 p-3 bg-black border-4 border-black hover:border-zinc-700 transition-colors" id={`candidate-result-${candidate.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="mc-pixel-font text-[9px] text-zinc-500">#{candidate.id}</span>
                        <h4 className="font-semibold text-white text-sm truncate">{candidate.name}</h4>
                        {isLeader && (
                          <span className="mc-pixel-font text-[8px] text-[#ffaa00] px-1.5 py-0.5 bg-black border-2 border-black uppercase font-semibold">
                            leading
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{candidate.description}</p>
                    </div>
                    <div className="text-right shrink-0 leading-none">
                      <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-md font-bold font-mono text-white">{candidate.votes}</span>
                        <span className="text-[9px] mc-pixel-font text-zinc-500">votes</span>
                      </div>
                      <span className="text-xs font-mono font-medium text-zinc-400 mt-1 block">
                        {voteShare.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Progressive Bar Visual */}
                  <div className="h-4 w-full bg-[#151515] border-2 border-black relative">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out-expo ${
                        isLeader 
                          ? 'bg-[#ffaa00] border-r-2 border-white' 
                          : 'bg-[#2bf3ff] border-r-2 border-white'
                      }`}
                      style={{ width: `${voteShare}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simple Donut Chart Visualizer (Built purely with SVG) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4 border-4 border-black bg-black">
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#151515" strokeWidth="12" fill="transparent" />
                {totalVotes > 0 && (() => {
                  let accumulatedPercent = 0;
                  return candidates.map((candidate, idx) => {
                    const percent = (candidate.votes / totalVotes) * 100;
                    if (percent === 0) return null;
                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = 100 - accumulatedPercent + 25; // adjusted for orientation
                    accumulatedPercent += percent;
                    
                    const strokeColor = idx === 0 ? '#ffaa00' : idx === 1 ? '#2bf3ff' : idx === 2 ? '#5c9e31' : '#b72525';
                    
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
                        strokeLinecap="square"
                        fill="transparent"
                        className="transition-all duration-1000 ease-in-out"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <PieChart className="w-5 h-5 text-zinc-400" />
                <span className="text-[8px] mc-pixel-font text-zinc-400 mt-1 uppercase">Pool</span>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs w-full sm:w-auto">
              {candidates.map((candidate, idx) => {
                const color = idx === 0 ? 'bg-[#ffaa00]' : idx === 1 ? 'bg-[#2bf3ff]' : idx === 2 ? 'bg-[#5c9e31]' : 'bg-[#b72525]';
                return (
                  <div key={candidate.id} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 border border-black ${color}`} />
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
