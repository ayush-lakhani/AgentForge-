import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Trash2,
  Eye,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { strategyAPI } from "../api";
import { safeDate } from "../utils/dateUtils";
import StrategyResults from "./StrategyResults";
import toast from "react-hot-toast";

export default function History() {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await strategyAPI.getHistory(); // Already returns response.data
      console.log("[HISTORY] API response:", data);

      // Normalize response - backend may return array or {history: [...]}
      const strategiesArray = Array.isArray(data) ? data : data?.history || [];

      console.log("[HISTORY] Normalized strategies:", strategiesArray);
      setStrategies(strategiesArray);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (strategy) => {
    // CRITICAL FIX: Use _id as fallback since backend returns both
    const strategyId = strategy.id || strategy._id;

    console.log("[DELETE] Strategy object:", strategy);
    console.log("[DELETE] Extracted ID:", strategyId);
    console.log("[DELETE] ID type:", typeof strategyId);

    if (!strategyId) {
      console.error("[DELETE] No valid ID found in strategy:", strategy);
      toast.error("Invalid strategy ID");
      return;
    }

    if (!confirm("Are you sure you want to delete this strategy?")) return;

    try {
      console.log(
        "[DELETE] Attempting to delete strategy with ID:",
        strategyId,
      );

      const response = await strategyAPI.delete(strategyId);
      console.log("[DELETE] Delete response:", response);
      console.log("[DELETE] Delete request successful, reloading history...");

      // Reload from server to get fresh data
      await loadHistory();

      toast.success("Strategy deleted successfully!");
      console.log("[OK] Strategy deleted and history reloaded");
    } catch (error) {
      console.error("[ERROR] Failed to delete strategy:", error);
      console.error("[ERROR] Error response:", error.response);
      console.error("[ERROR] Error status:", error.response?.status);
      console.error("[ERROR] Error data:", error.response?.data);
      console.error("[ERROR] Error message:", error.message);
      toast.error(
        `Failed to delete strategy: ${error.response?.data?.detail || error.message}`,
      );
    }
  };

  const handleView = async (strategy) => {
    // CRITICAL FIX: Use _id as fallback (same as handleDelete)
    const strategyId = strategy.id || strategy._id;

    console.log("[VIEW] Strategy object:", strategy);
    console.log("[VIEW] Extracted ID:", strategyId);

    if (!strategyId) {
      console.error("[VIEW] No valid ID found in strategy:", strategy);
      alert("Invalid strategy ID");
      return;
    }

    try {
      console.log("[VIEW] Fetching strategy with ID:", strategyId);
      const response = await strategyAPI.getById(strategyId);
      console.log("[VIEW] Strategy loaded:", response);
      setSelectedStrategy(response); // response is already the data
    } catch (error) {
      console.error("[VIEW] Failed to load strategy:", error);
      console.error("[VIEW] Error response:", error.response);
      console.error("[VIEW] Error data:", error.response?.data);
      alert("Failed to load strategy details. Please try again.");
    }
  };

  const handleFeedback = async (id, rating) => {
    try {
      await strategyAPI.submitFeedback(id, rating);
      // Update local state
      setStrategies(
        strategies.map((s) =>
          s.id === id ? { ...s, feedback_rating: rating } : s,
        ),
      );
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
      </div>
    );
  }

  if (selectedStrategy) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setSelectedStrategy(null)}
            className="flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to History
          </button>

          {/* Use the beautiful StrategyResults component */}
          <StrategyResults
            key={selectedStrategy.id || selectedStrategy._id}
            strategy={selectedStrategy}
            onReset={() => setSelectedStrategy(null)}
          />
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
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-smooth"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Strategy History
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {strategies.length} strategies generated
            </p>
          </div>
        </div>

        {/* Empty State */}
        {strategies.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No strategies yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Generate your first content strategy to see it here
            </p>
            <button
              onClick={() => navigate("/generate")}
              className="btn-gradient"
            >
              Create Strategy
            </button>
          </div>
        ) : (
          /* Strategies List */
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <div
                key={strategy.id}
                className="glass-card p-6 hover:shadow-xl transition-smooth"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {strategy.industry && strategy.platform
                        ? `${strategy.industry} - ${strategy.platform} Strategy`
                        : strategy.industry ||
                          strategy.platform ||
                          "Content Strategy"}
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {strategy.audience && (
                        <span className="flex items-center gap-1">
                          👥 {strategy.audience}
                        </span>
                      )}
                      {strategy.industry && (
                        <span className="flex items-center gap-1">
                          🏢 {strategy.industry}
                        </span>
                      )}
                      {strategy.platform && (
                        <span className="flex items-center gap-1">
                          📱 {strategy.platform}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Generated {safeDate(strategy.created_at, "datetime")}
                      {strategy.generation_time &&
                        ` • ${strategy.generation_time}s`}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {/* Feedback Buttons */}
                    <button
                      onClick={() => handleFeedback(strategy.id, "up")}
                      className={`p-2 rounded-lg transition-colors ${
                        strategy.feedback_rating === "up"
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900"
                      }`}
                      title="Good strategy"
                    >
                      <ThumbsUp className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleFeedback(strategy.id, "down")}
                      className={`p-2 rounded-lg transition-colors ${
                        strategy.feedback_rating === "down"
                          ? "bg-red-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900"
                      }`}
                      title="Needs improvement"
                    >
                      <ThumbsDown className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleView(strategy)}
                      className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(strategy)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
