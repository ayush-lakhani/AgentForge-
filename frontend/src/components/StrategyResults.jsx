import { useState } from 'react';
import { User, TrendingUp, Search, Calendar, FileText, Download, RefreshCw, Copy, Check } from 'lucide-react';
import ShareButtons from './ShareButtons';

export default function StrategyResults({ strategy, onReset }) {
  const [activeTab, setActiveTab] = useState('blueprint');
  const [copied, setCopied] = useState(false);

  const tabs = [
    { id: 'blueprint', label: 'Tactical Blueprint', icon: FileText },
    { id: 'persona', label: 'Persona', icon: User },
    { id: 'gaps', label: 'Competitor Gaps', icon: TrendingUp },
    { id: 'keywords', label: 'Keywords', icon: Search },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'posts', label: 'Sample Posts', icon: FileText },
  ];

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(strategy.strategy || strategy, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'content-strategy.json';
    link.click();
  };

  // Check if content is HTML string or JSON object
  const isHTMLContent = typeof strategy.content === 'string' && strategy.content.includes('<div');
  
  // Robust data extraction
  const getStrategyData = () => {
    // 1. Check for nested strategy object first (Standard response)
    if (strategy.strategy) {
      if (strategy.strategy.output_data) return strategy.strategy.output_data;
      return strategy.strategy;
    }
    // 2. Check for output_data at top level (History detail response)
    if (strategy.output_data) return strategy.output_data;
    // 3. Fallback to top-level content (Old format)
    if (strategy.content && !isHTMLContent) return strategy.content;
    // 4. Fallback to the object itself
    return strategy;
  };

  const strategyData = getStrategyData();

  // If it's HTML content, render it directly
  if (isHTMLContent) {
    return (
      <div className="animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {strategy.topic || 'Your Content Strategy'}
            </h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Back to History
            </button>
          </div>
        </div>

        {/* Render HTML Content */}
        <div 
          className="glass-card p-8 prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: strategy.content }}
        />

        {/* Share Buttons */}
        <ShareButtons strategy={strategy} />
      </div>
    );
  }

  // If strategyData is not available, show error
  if (!strategyData) {
    return (
      <div className="animate-fade-in">
        <div className="glass-card p-8 text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Unable to display strategy content. The data format may be incompatible.
          </p>
          <button
            onClick={onReset}
            className="btn-gradient"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Your Content Strategy
          </h2>
          {strategy.cached && (
            <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
              ⚡ Loaded from cache instantly
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            New Strategy
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card p-2 mb-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all font-medium ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="glass-card p-8">
        {/* Tactical Blueprint Tab */}
        {activeTab === 'blueprint' && strategyData.tactical_blueprint && (
          <div className="animate-slide-up">
            <div 
              className="prose prose-lg dark:prose-invert max-w-none tactical-blueprint"
              data-experience={(strategyData.experience || strategy.experience || 'beginner').toLowerCase()}
              dangerouslySetInnerHTML={{ __html: strategyData.tactical_blueprint }}
            />
          </div>
        )}

        {/* Persona Tab */}
        {activeTab === 'persona' && (
          <PersonaDisplay personas={strategyData.personas} />
        )}

        {/* Competitor Gaps Tab */}
        {activeTab === 'gaps' && (
          <div className="space-y-4 animate-slide-up">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Competitor Gaps & Opportunities
            </h3>
            {strategyData.competitor_gaps.map((gap, index) => (
              <div key={index} className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-xl border-l-4 border-orange-500">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">{gap.gap}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    gap.impact === 'High' ? 'bg-red-500 text-white' :
                    gap.impact === 'Medium' ? 'bg-yellow-500 text-white' :
                    'bg-green-500 text-white'
                  }`}>
                    {gap.impact} Impact
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">How to exploit:</span> {gap.implementation}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === 'keywords' && (
          <div className="space-y-4 animate-slide-up">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              SEO Keyword Ladder
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Keyword</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Intent</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Difficulty</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Volume</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Priority</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Top 5 Hashtags</th>
                  </tr>
                </thead>
                <tbody>
                  {strategyData.keywords.map((keyword, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{keyword.term}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{keyword.intent}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          keyword.difficulty === 'Easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                          keyword.difficulty === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                          'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}>
                          {keyword.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{keyword.monthly_searches}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-primary-600 to-accent-600 h-2 rounded-full"
                              style={{ width: `${keyword.priority * 10}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{keyword.priority}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {keyword.hashtags && (
                          <div className="flex flex-wrap gap-1">
                            {keyword.hashtags.slice(0, 5).map((tag, i) => (
                              <span 
                                key={i} 
                                className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md text-xs font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-4 animate-slide-up">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              30-Day Content Calendar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {strategyData.calendar.map((item, index) => (
                <div key={index} className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 p-6 rounded-xl border border-primary-200 dark:border-primary-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                      Week {item.week}, Day {item.day}
                    </span>
                    <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300">
                      {item.format}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">{item.topic}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 italic">{item.caption_hook}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">CTA: {item.cta}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sample Posts Tab */}
        {activeTab === 'posts' && (
          <div className="animate-slide-up">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Ready-to-Post Content
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Professionally crafted post ideas ready for your {strategyData.experience || 'target'} audience.
                </p>
              </div>
            </div>

            <div className="bp-sample-grid">
              {(strategyData.sample_posts || []).map((post, index) => (
                <div key={index} className="bp-sample-card group">
                  <div className="bp-post-badge">{post.type || 'Platform Post'}</div>
                  
                  <div className="bp-sample-content">
                    {/* Hook Section */}
                    <div className="bp-sample-block-hook">
                      <span className="bp-sample-label">The Hook</span>
                      <div className="bp-sample-text">
                        {post.hook || post.title || post.caption?.split('\n')[0]}
                      </div>
                    </div>

                    {/* Body Section */}
                    <div>
                      <span className="bp-sample-label">{post.type?.includes('Carousel') ? 'The Content' : 'The Body'}</span>
                      <div className="bp-sample-text">
                        {post.body || post.caption || post.image_prompt}
                      </div>
                    </div>

                    {/* CTA Box */}
                    <div className="bp-cta-box">
                      <div className="flex-1">
                        <span className="bp-sample-label">Call to Action</span>
                        <div className="bp-cta-text">{post.cta || 'Link in bio!'}</div>
                      </div>
                      <button
                        onClick={() => handleCopy(`${post.hook || ''}\n\n${post.body || post.caption || ''}\n\n${post.cta || ''}`)}
                        className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl hover:scale-110 transition-all text-primary-600 dark:text-primary-400"
                        title="Copy Script"
                      >
                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(!strategyData.sample_posts || strategyData.sample_posts.length === 0) && (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                <p className="text-gray-500">No sample posts generated for this strategy yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share Buttons - Viral Growth */}
      <ShareButtons strategy={strategy} />
    </div>
  );
}

function DetailSection({ title, items, color }) {
  const colorClasses = {
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  };

  return (
    <div className={`${colorClasses[color]} border p-4 rounded-xl`}>
      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
            <span className="text-primary-600 dark:text-primary-400 mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PersonaDisplay({ personas }) {
  const [currentPersona, setCurrentPersona] = useState(0);

  // Handle both single persona (legacy) and multiple personas
  const personaArray = Array.isArray(personas) ? personas : [personas];
  const persona = personaArray[currentPersona];

  const nextPersona = () => {
    setCurrentPersona((prev) => (prev + 1) % personaArray.length);
  };

  const prevPersona = () => {
    setCurrentPersona((prev) => (prev - 1 + personaArray.length) % personaArray.length);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Navigation Header */}
      {personaArray.length > 1 && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevPersona}
            className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-all flex items-center gap-2"
          >
            ← Previous
          </button>
          <div className="flex gap-2">
            {personaArray.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPersona(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentPersona
                    ? 'bg-primary-600 w-8'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          <button
            onClick={nextPersona}
            className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-all flex items-center gap-2"
          >
            Next →
          </button>
        </div>
      )}

      {/* Persona Details */}
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        {persona.name}
        {personaArray.length > 1 && (
          <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-3">
            (Persona {currentPersona + 1} of {personaArray.length})
          </span>
        )}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-xl">
          <p className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">Age Range</p>
          <p className="text-2xl font-bold text-primary-900 dark:text-primary-100">{persona.age_range}</p>
        </div>
        <div className="bg-accent-50 dark:bg-accent-900/20 p-6 rounded-xl">
          <p className="text-sm font-semibold text-accent-700 dark:text-accent-300 mb-2">Occupation</p>
          <p className="text-2xl font-bold text-accent-900 dark:text-accent-100">{persona.occupation}</p>
        </div>
      </div>

      <div className="space-y-4">
        <DetailSection title="Pain Points" items={persona.pain_points} color="red" />
        <DetailSection title="Desires" items={persona.desires} color="green" />
        <DetailSection title="Objections" items={persona.objections} color="yellow" />
        <DetailSection title="Daily Habits" items={persona.daily_habits} color="blue" />
        <DetailSection title="Content Preferences" items={persona.content_preferences} color="purple" />
      </div>
    </div>
  );
}
