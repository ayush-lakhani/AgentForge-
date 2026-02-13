import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StrategyForm from './StrategyForm';
import StrategyResults from './StrategyResults';
import AgentTerminal from './AgentTerminal';
import UpgradeModal from './UpgradeModal';
import ProfileWidget from './ProfileWidget';
import { strategyAPI } from '../api';

export default function StrategicPlanner() {
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [agentLogs, setAgentLogs] = useState([]);
  const [usageCount, setUsageCount] = useState(0);
  const [userTier, setUserTier] = useState('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const navigate = useNavigate();

  // Fetch user profile and usage on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:8000/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const serverUsage = data.usage_month || 0;
        setUsageCount(serverUsage);
        setUserTier(data.tier || 'free');
        console.log('[PROFILE] Usage count updated:', serverUsage);

        // Check for upgrade trigger (e.g. if limit reached)
        if (serverUsage >= 3 && data.tier === 'free') {
           // Optional: You could show upgrade modal here
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleGenerate = async (formData) => {
    setLoading(true);
    setAgentLogs([]);
    setStrategy(null);

    // Simulate agent logs
    const logs = [
      { agent: 'SYSTEM', message: 'Initializing strategy engine...', type: 'info' },
      { agent: 'ANALYZER', message: `Analyzing ${formData.industry} market trends...`, type: 'agent' },
      { agent: 'PERSONA', message: `Building ${formData.experience} persona profile...`, type: 'agent' },
      { agent: 'STRATEGIST', message: `Crafting ${formData.platform} content strategy...`, type: 'agent' },
      { agent: 'OPTIMIZER', message: 'Generating SEO keywords and calendar...', type: 'agent' },
    ];

    for (const log of logs) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAgentLogs(prev => [...prev, log]);
    }

    try {
      const result = await strategyAPI.generate(formData);
      setStrategy(result);
      
      // ✅ OPTIMISTIC UPDATE: Update usage count immediately
      // This is "Real-Time" for the user, no need to wait for profile fetch
      setUsageCount(prev => prev + 1);
      
      setAgentLogs(prev => [...prev, { agent: 'SYSTEM', message: '✅ Strategy generated successfully!', type: 'success' }]);
      
    } catch (error) {
      setAgentLogs(prev => [...prev, { agent: 'ERROR', message: error.message, type: 'error' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStrategy(null);
    setAgentLogs([]);
    fetchUserProfile(); // Refresh usage count
  };

  const handleUpgrade = () => {
    // Navigate to payment/upgrade page
    navigate('/dashboard'); // Or navigate to a dedicated upgrade page
    setShowUpgradeModal(false);
  };

  const handleCloseModal = () => {
    setShowUpgradeModal(false);
  };

  if (strategy) {
    return <StrategyResults strategy={strategy.data} onReset={handleReset} />;
  } 

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Usage Counter Widget */}
        <div className="mb-6">
          <ProfileWidget 
            usageCount={usageCount} 
            totalAllowed={3}
            tier={userTier}
            onUpgrade={handleUpgrade}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <div>
            <StrategyForm 
              onGenerate={handleGenerate} 
              setLoading={setLoading} 
              setAgentLogs={setAgentLogs}
              loading={loading}
            />
          </div>

          {/* Right: Agent Terminal */}
          <div>
            <AgentTerminal logs={agentLogs} loading={loading} />
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal 
        usageCount={usageCount}
        onClose={handleCloseModal}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}
