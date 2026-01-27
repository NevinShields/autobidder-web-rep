
import React, { useState } from 'react';
import IconGenerator from './components/IconGenerator';

const App: React.FC = () => {
  const [showEmbed, setShowEmbed] = useState(false);
  const embedUrl = `${window.location.origin}${window.location.pathname}`;
  const iframeCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="800"
  frameborder="0"
  title="AI Icon Saloon"
></iframe>`;

  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(iframeCode.trim()).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-full flex flex-col font-sans overflow-y-auto">
      {/* Header - Only visible when not embedded */}
      <header className="app-header text-center py-8 px-4">
        <h1 className="font-display text-5xl md:text-7xl font-bold text-amber-100 tracking-wider drop-shadow-lg" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.8)' }}>
          AI Icon Saloon
        </h1>
        <p className="text-amber-200/80 mt-3 text-lg md:text-xl font-body italic">
          High-fidelity brand assets, forged in the AI frontier.
        </p>
      </header>

      {/* Main Tool */}
      <main className="flex-grow w-full max-w-6xl mx-auto p-4 md:p-8">
        <IconGenerator />
      </main>

      {/* Footer / Embed Utility */}
      <footer className="mt-12 pb-12 px-6">
        <div className="max-w-4xl mx-auto border-t border-stone-700 pt-8">
          <div className="flex flex-col items-center">
            <button 
              onClick={() => setShowEmbed(!showEmbed)}
              className="text-amber-400/60 hover:text-amber-400 transition-colors text-sm font-semibold uppercase tracking-widest"
            >
              {showEmbed ? '↑ Hide Embed Tools ↑' : '↓ Show Embed Tools ↓'}
            </button>
            
            {showEmbed && (
              <div className="w-full mt-8 bg-stone-800/80 backdrop-blur-md p-6 rounded-xl border border-amber-900/40 animate-fade-in">
                <h3 className="font-display text-2xl text-cyan-400 mb-4">Embed this Saloon</h3>
                <p className="text-stone-300 mb-4">Copy this snippet to host the Icon Generator on your own website.</p>
                <div className="relative bg-black/50 p-4 rounded-lg border border-stone-700 group">
                  <code className="text-cyan-300 text-sm break-all">{iframeCode}</code>
                  <button
                    onClick={handleCopy}
                    className="mt-4 sm:mt-0 sm:absolute sm:top-2 sm:right-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1 rounded text-xs font-bold transition-all"
                  >
                    {isCopied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>
            )}
            <p className="mt-8 text-stone-500 text-xs">Built for the modern web with Gemini AI & React</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
