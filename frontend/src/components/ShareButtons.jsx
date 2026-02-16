import { Share2, Mail, Copy, Download } from 'lucide-react';
import { useState } from 'react';

export default function ShareButtons({ strategy }) {
  const [copied, setCopied] = useState(false);

  const handleShare = (platform) => {
    const shareText = `Check out this AI-generated content strategy from Planvix! 🚀\\n\\nGenerated ${strategy.calendar?.length || 30} days of content in 30 seconds.`;
    const shareUrl = window.location.href;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + '\\n' + shareUrl)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=AI Content Strategy from Planvix&body=${encodeURIComponent(shareText + '\\n\\n' + shareUrl)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
      case 'pdf':
        // PDF export functionality
        alert('PDF export coming soon!');
        break;
    }
  };

  return (
    <div className="share-section p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-2xl mt-8 animate-fade-in">
      <h3 className="font-bold text-xl mb-4 text-gray-900 dark:text-white">📈 Share Your Results</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Share this strategy with your team or refer friends to Planvix!
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => handleShare('whatsapp')}
          className="flex items-center justify-center gap-2 p-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all hover:scale-105 font-semibold shadow-lg"
        >
          <Share2 className="w-5 h-5" />
          WhatsApp
        </button>
        <button
          onClick={() => handleShare('email')}
          className="flex items-center justify-center gap-2 p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all hover:scale-105 font-semibold shadow-lg"
        >
          <Mail className="w-5 h-5" />
          Email
        </button>
        <button
          onClick={() => handleShare('copy')}
          className="flex items-center justify-center gap-2 p-4 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all hover:scale-105 font-semibold shadow-lg"
        >
          {copied ? <Copy className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <button
          onClick={() => handleShare('pdf')}
          className="flex items-center justify-center gap-2 p-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all hover:scale-105 font-semibold shadow-lg"
        >
          <Download className="w-5 h-5" />
          PDF
        </button>
      </div>
    </div >
  );
}
