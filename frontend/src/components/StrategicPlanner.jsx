import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import StrategyForm from './StrategyForm';
import StrategyResults from './StrategyResults';
import AgentTerminal from './AgentTerminal';

export default function StrategicPlanner() {
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [agentLogs, setAgentLogs] = useState([]);
  const navigate = useNavigate();

  const handleStrategyGenerated = (data) => {
    setStrategy(data);
    setLoading(false);
  };

  const handleReset = () => {
    setStrategy(null);
    setAgentLogs([]);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-smooth"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Strategic Planner
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Elite AI agents will create your complete strategy
            </p>
          </div>
        </div>

        {/* Main Content */}
        {!strategy ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form (Left - 2 columns) */}
            <div className="lg:col-span-2">
              <StrategyForm 
                onGenerate={handleStrategyGenerated}
                setLoading={setLoading}
                setAgentLogs={setAgentLogs}
              />
            </div>

            {/* Agent Terminal (Right - 1 column) */}
            <div className="lg:col-span-1">
              <AgentTerminal logs={agentLogs} loading={loading} />
            </div>
          </div>
        ) : (
          <StrategyResults 
            strategy={strategy} 
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}
