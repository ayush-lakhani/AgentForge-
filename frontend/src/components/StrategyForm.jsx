import { useState } from 'react';
import { Target, Users, Briefcase, Share2, Sparkles, FileText } from 'lucide-react';
import { strategyAPI } from '../api';

export default function StrategyForm({ onGenerate, setLoading, setAgentLogs, loading }) {
  const [formData, setFormData] = useState({
    goal: '',
    audience: '',
    industry: '',
    platform: 'Instagram',
    contentType: 'Mixed Content',
    experience: 'beginner'
  });
  
  const [errors, setErrors] = useState({});

  const platforms = ['Instagram', 'LinkedIn', 'TikTok', 'Twitter/X', 'Facebook', 'YouTube'];
  const industries = [
    // Technology & Digital
    'SaaS (Software as a Service)',
    'IT Services & Consulting',
    'Cybersecurity',
    'Cloud Computing',
    'AI & Machine Learning',
    'Mobile App Development',
    'Web Development',
    'Data Analytics & BI',
    'DevOps & Infrastructure',
    'Blockchain & Crypto',
    
    // E-commerce & Retail
    'E-commerce',
    'Retail & Consumer Goods',
    'Fashion & Apparel',
    'Luxury Goods',
    'Beauty & Cosmetics',
    'Jewelry & Accessories',
    
    // Food & Beverage
    'F&B (Food & Beverage)',
    'Restaurants & Hospitality',
    'Coffee & Tea',
    'Organic & Health Foods',
    'Bakery & Confectionery',
    'Alcohol & Spirits',
    
    // Health & Wellness
    'Healthcare & Medical',
    'Fitness & Gym',
    'Wellness & Spa',
    'Mental Health',
    'Nutrition & Supplements',
    'Pharmaceuticals',
    'Medical Devices',
    
    // Education & Training
    'Education & EdTech',
    'Online Courses & eLearning',
    'Tutoring & Coaching',
    'Corporate Training',
    'Language Learning',
    
    // Finance & Insurance
    'Financial Services',
    'Banking',
    'Insurance',
    'Investment & Wealth Management',
    'FinTech',
    'Cryptocurrency & DeFi',
    'Accounting & Tax Services',
    
    // Real Estate & Construction
    'Real Estate',
    'Property Management',
    'Interior Design',
    'Architecture',
    'Construction',
    'Home Renovation',
    
    // Professional Services
    'Consulting & Strategy',
    'Legal Services',
    'Marketing & Advertising',
    'PR & Communications',
    'HR & Recruitment',
    'Business Process Outsourcing',
    
    // Media & Entertainment
    'Entertainment & Events',
    'Film & Video Production',
    'Music & Audio',
    'Gaming & Esports',
    'Publishing & Media',
    'Photography',
    'Podcasting',
    
    // Travel & Tourism
    'Travel & Tourism',
    'Hotels & Lodging',
    'Airlines',
    'Travel Agencies',
    'Adventure Tourism',
    
    // Automotive & Transportation
    'Automotive',
    'Electric Vehicles (EV)',
    'Logistics & Supply Chain',
    'Transportation Services',
    'Ride Sharing',
    
    // Manufacturing & Industrial
    'Manufacturing',
    'Industrial Equipment',
    'Electronics',
    'Chemicals',
    'Textiles',
    
    // Energy & Environment
    'Renewable Energy',
    'Oil & Gas',
    'Solar & Wind Power',
    'Environmental Services',
    'Sustainability',
    
    // Non-Profit & Social
    'Non-Profit Organizations',
    'Charity & Fundraising',
    'Social Impact',
    'Community Services',
    
    // Agriculture & Food Production
    'Agriculture & Farming',
    'AgriTech',
    'Food Production',
    'Livestock',
    
    // Lifestyle & Personal
    'Lifestyle & Personal Development',
    'Dating & Relationships',
    'Parenting & Family',
    'Pet Care & Veterinary',
    'Home Services',
    
    // Other
    'Telecommunications',
    'Government & Public Sector',
    'Sports & Recreation',
    'Other'
  ];
  const contentTypes = ['Mixed Content', 'Reels/Short Videos', 'Posts/Feed Content', 'Stories', 'Carousels', 'Long-Form Videos', 'Blogs/Articles', 'Live Streams'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loading) return; // 🚫 Prevent double submit
    
    setErrors({});
    
    // Validation
    const newErrors = {};
    if (formData.goal.length < 10) {
      newErrors.goal = 'Please provide more detail about your goal (at least 10 characters)';
    }
    if (formData.audience.length < 5) {
      newErrors.audience = 'Please provide more detail about your audience';
    }
    if (!formData.industry || formData.industry.length < 3) {
      newErrors.industry = 'Please select an industry';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 🚀 BULLETPROOF FETCH PREP
    const safeData = {
      goal: formData.goal.substring(0, 500),
      audience: formData.audience.substring(0, 200),
      industry: formData.industry.substring(0, 100),
      platform: formData.platform || "Instagram",
      contentType: formData.contentType || "Mixed Content",
      experience: formData.experience || "beginner"
    };

    console.log('🚀 Sending safe strategy request to parent:', safeData);
    onGenerate(safeData);
  };

  return (
    <div className="glass-card p-8 animate-slide-up">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
        <Sparkles className="w-7 h-7 text-primary-600 dark:text-primary-400" />
        Strategy Input
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Goal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Business Goal
          </label>
          <input
            type="text"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            className="input-premium"
            placeholder="e.g., Sell coffee subscriptions on Instagram"
            required
          />
          {errors.goal && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.goal}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formData.goal.length}/500 characters
          </p>
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Target Audience
          </label>
          <input
            type="text"
            value={formData.audience}
            onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
            className="input-premium"
            placeholder="e.g., College students aged 18-24"
            required
          />
          {errors.audience && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.audience}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Be specific about demographics, interests, pain points
          </p>
        </div>

        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Industry
          </label>
          <select
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            className="input-premium"
            required
          >
            <option value="">Select your industry</option>
            {industries.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
          {errors.industry && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.industry}</p>
          )}
        </div>

        {/* Content Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Content Type
          </label>
          <select
            value={formData.contentType}
            onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
            className="input-premium"
            required
          >
            {contentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            What format do you want to focus on?
          </p>
        </div>

        {/* Platform */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Primary Platform
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {platforms.map(platform => (
              <button
                key={platform}
                type="button"
                onClick={() => setFormData({ ...formData, platform })}
                className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium ${
                  formData.platform === platform
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Experience Level
          </label>
          <div className="space-y-3">
            {[
              { id: 'beginner', label: 'Beginner', desc: 'iPhone + templates, step-by-step guides' },
              { id: 'intermediate', label: 'Intermediate', desc: 'Batch workflows, optimization strategies' },
              { id: 'expert', label: 'Expert', desc: 'Viral frameworks, data-driven optimization' }
            ].map((exp) => (
              <label 
                key={exp.id}
                className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.experience === exp.id 
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <input
                  type="radio"
                  name="experience"
                  value={exp.id}
                  checked={formData.experience === exp.id}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="mt-1 mr-3 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <div className={`font-bold ${formData.experience === exp.id ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                    {exp.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{exp.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full btn-gradient flex items-center justify-center gap-2 ${
            loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating Strategy...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Strategy
            </>
          )}
        </button>
      </form>
    </div>
  );
}
