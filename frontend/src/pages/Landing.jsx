function Landing({ onTryDashboard, onHowItWorks }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 flex items-center justify-center px-4 py-16">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-indigo-500/40 rounded-full mix-blend-screen filter blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-purple-500/30 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 sm:w-96 sm:h-96 bg-cyan-500/30 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 max-w-xl w-full backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 sm:p-12 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 mb-6 text-2xl">
          🧭
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
          Compass
        </h1>

        <p className="text-indigo-100/90 text-base sm:text-lg leading-relaxed mb-8">
          Millions of small businesses get turned away from credit simply because
          they lack a formal credit history. Compass builds a risk profile from
          real signals — cash flow patterns, bill payment habits, business
          tenure — so lenders can say yes to businesses traditional scoring
          overlooks.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onTryDashboard}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-900/40 transition-colors"
          >
            Try our Dashboard
          </button>
          <button
            onClick={onHowItWorks}
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold backdrop-blur-sm transition-colors"
          >
            How it Works
          </button>
        </div>
      </div>
    </div>
  );
}

export default Landing;
