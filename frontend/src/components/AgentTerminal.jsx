import { Terminal, Activity } from 'lucide-react';
import { useEffect, useRef } from 'react';

export default function AgentTerminal({ logs, loading }) {
  const terminalRef = useRef(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-card p-6 h-[600px] flex flex-col sticky top-8">
      <div className="flex items-center gap-3 mb-4">
        <Terminal className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Agent Terminal</h3>
        {loading && (
          <Activity className="w-5 h-5 text-green-500 animate-pulse" />
        )}
      </div>

      <div 
        ref={terminalRef}
        className="flex-1 bg-gray-900 dark:bg-black rounded-xl p-4 overflow-y-auto font-mono text-sm"
      >
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">Waiting for input...</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div key={index} className="animate-fade-in">
                <span className={`font-bold ${
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'agent' ? 'text-cyan-400' :
                  'text-yellow-400'
                }`}>
                  [{log.agent}]
                </span>
                <span className="text-gray-300 ml-2">{log.message}</span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-gray-400 animate-pulse">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>●</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>🚀 Strategy Engine Active</p>
        <p>⚡ Professional Content Planning</p>
      </div>
    </div>
  );
}
