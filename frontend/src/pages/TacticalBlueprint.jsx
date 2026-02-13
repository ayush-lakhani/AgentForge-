import { strategyAPI } from '../api';

export default function TacticalBlueprint() {
  const { strategyId } = useParams();
  const navigate = useNavigate();
  const [blueprint, setBlueprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateBlueprint = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await strategyAPI.getBlueprint(strategyId);
        setBlueprint(response.data.blueprint);
      } catch (error) {
        console.error('Blueprint generation failed:', error);
        setError(error.message || 'Failed to generate blueprint');
      } finally {
        setLoading(false);
      }
    };
    
    if (strategyId) {
      generateBlueprint();
    }
  }, [strategyId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-400">🔄 Generating Tactical Blueprint...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to History
          </button>
          
          <div className="glass-card p-12 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Blueprint Generation Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-gradient"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-6">No blueprint data available.</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-gradient"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/history')}
            className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-smooth"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              🎯 Tactical Blueprint
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Strategy ID: {strategyId}
            </p>
          </div>
        </div>

        {/* Blueprint Content */}
        <div className="space-y-6">
          {/* Objectives */}
          {blueprint.objectives && blueprint.objectives.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Objectives</h2>
              </div>
              <ul className="space-y-2">
                {blueprint.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tactics */}
          {blueprint.tactics && blueprint.tactics.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-accent-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tactics</h2>
              </div>
              <ul className="space-y-2">
                {blueprint.tactics.map((tactic, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-accent-600 font-bold mt-0.5 flex-shrink-0">{index + 1}.</span>
                    <span className="text-gray-700 dark:text-gray-300">{tactic}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Timeline */}
          {blueprint.timeline && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Timeline</h2>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{blueprint.timeline}</p>
            </div>
          )}

          {/* KPIs */}
          {blueprint.kpis && blueprint.kpis.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Key Performance Indicators</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {blueprint.kpis.map((kpi, index) => (
                  <div key={index} className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300">{kpi}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Data (for debugging) */}
          <details className="glass-card p-6">
            <summary className="cursor-pointer font-bold text-gray-900 dark:text-white mb-4">
              📊 Raw Blueprint Data (Debug)
            </summary>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(blueprint, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}
