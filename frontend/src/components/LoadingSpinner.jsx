export default function LoadingSpinner({ message = "Generating your strategy..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      {/* Animated Icon */}
      <div className="relative mb-8">
        <div className="w-40 h-40 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse">
          <div className="text-6xl font-black text-white">P</div>
        </div>
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full border-4 border-primary-500 opacity-20 animate-ping"></div>
      </div>

      {/* Brand Text */}
      <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-2">
        Planvix AI
      </h2>
      
      {/* Loading Message */}
      <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
        {message}
      </p>
      
      {/* Progress Dots */}
      <div className="flex gap-2">
        <div className="w-3 h-3 bg-primary-600 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
        <div className="w-3 h-3 bg-accent-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-3 h-3 bg-green-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
