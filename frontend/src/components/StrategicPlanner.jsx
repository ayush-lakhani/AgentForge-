import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StrategyForm from "./StrategyForm";
import StrategyResults from "./StrategyResults";
import AgentTerminal from "./AgentTerminal";
import UpgradeModal from "./UpgradeModal";
import ProfileWidget from "./ProfileWidget";
import { useAuth } from "../context/AuthContext";
import { strategyAPI } from "../api";
import { normalizeStrategy, isValidStrategy } from "../utils/strategyUtils";

export default function StrategicPlanner() {
  const { user, token } = useAuth();
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [agentLogs, setAgentLogs] = useState([]);
  const [usageCount, setUsageCount] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userTier = user?.tier || "free";

  // Handle strategy passed via navigation state (from Dashboard/History)
  useEffect(() => {
    if (location.state?.strategy) {
      console.log(
        "[PLANNER] Received strategy from navigation:",
        location.state.strategy,
      );
      setStrategy(location.state.strategy);
    }
  }, [location]);

  // Fetch user profile and usage on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      if (!token) return;

      const response = await fetch("http://localhost:8000/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Backend returns usage_count, not usage_month
        const serverUsage = data.usage_count || 0;
        setUsageCount(serverUsage);
        setUserTier(data.tier || "free");
        console.log("[PROFILE] Usage count updated:", serverUsage);
        console.log("[PROFILE] Full profile data:", data);

        // Check for upgrade trigger (e.g. if limit reached)
        if (serverUsage >= 3 && data.tier === "free") {
          // Optional: You could show upgrade modal here
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleGenerate = async (formData) => {
    setLoading(true);
    setAgentLogs([]);
    setStrategy(null);

    // Simulate agent logs
    const logs = [
      {
        agent: "SYSTEM",
        message: "Initializing strategy engine...",
        type: "info",
      },
      {
        agent: "ANALYZER",
        message: `Analyzing ${formData.industry} market trends...`,
        type: "agent",
      },
      {
        agent: "PERSONA",
        message: `Building ${formData.experience} persona profile...`,
        type: "agent",
      },
      {
        agent: "STRATEGIST",
        message: `Crafting ${formData.platform} content strategy...`,
        type: "agent",
      },
      {
        agent: "OPTIMIZER",
        message: "Generating SEO keywords and calendar...",
        type: "agent",
      },
    ];

    for (const log of logs) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setAgentLogs((prev) => [...prev, log]);
    }

    try {
      const result = await strategyAPI.generate(formData);
      console.log("[STRATEGY RESULT] Raw API response:", result);

      // CRITICAL: Normalize strategy structure
      const normalized = normalizeStrategy(result);
      console.log("[STRATEGY RESULT] Normalized:", normalized);
      console.log("[STRATEGY RESULT] Is valid?", isValidStrategy(normalized));

      if (!isValidStrategy(normalized)) {
        throw new Error("Invalid strategy structure received from API");
      }

      setStrategy(normalized);

      // Refresh profile to get updated usage count from server
      await fetchUserProfile();

      setAgentLogs((prev) => [
        ...prev,
        {
          agent: "SYSTEM",
          message: "✅ Strategy generated successfully!",
          type: "success",
        },
      ]);
    } catch (error) {
      console.error("[STRATEGY ERROR]", error);
      setAgentLogs((prev) => [
        ...prev,
        { agent: "ERROR", message: error.message, type: "error" },
      ]);
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
    navigate("/dashboard"); // Or navigate to a dedicated upgrade page
    setShowUpgradeModal(false);
  };

  const handleCloseModal = () => {
    setShowUpgradeModal(false);
  };

  // Debug logging for state tracking
  console.log("[PLANNER] Current strategy state:", strategy);
  console.log("[PLANNER] Has strategy?", !!strategy);

  if (strategy) {
    return <StrategyResults strategy={strategy} onReset={handleReset} />;
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
