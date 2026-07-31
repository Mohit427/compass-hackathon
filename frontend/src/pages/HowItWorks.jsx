const SIGNALS = [
  {
    name: 'Income-to-Loan Ratio',
    summary: 'How big the loan is compared to how much the business earns.',
    detail: 'A business asking to borrow far more than it earns in a year is taking on more risk than one asking for a smaller top-up on strong income.',
  },
  {
    name: 'Cash Flow Stability',
    summary: "How steady the business's day-to-day income is.",
    detail: "A business with predictable daily earnings is in a stronger position to make regular repayments than one whose income swings wildly from day to day.",
  },
  {
    name: 'Revenue Trend',
    summary: "Whether the business's income has been growing, flat, or shrinking recently.",
    detail: 'A business on a growth trajectory is generally a safer bet than one whose income has been declining.',
  },
  {
    name: 'Bill Punctuality',
    summary: 'How reliably the business has paid existing bills and debts on time.',
    detail: "Past payment behavior is one of the strongest predictors of future payment behavior — it's the closest thing to a track record.",
  },
  {
    name: 'Filing Regularity',
    summary: 'How consistently the business keeps up with its regulatory filings (e.g. GST).',
    detail: 'Regular, predictable filing patterns suggest a well-run, organized operation rather than one that is chaotic or non-compliant.',
  },
  {
    name: 'External Credit Score',
    summary: "An independent, third-party read on the applicant's creditworthiness.",
    detail: "Similar to a traditional bureau credit score, blended in alongside Credit Lens's own alternative-data signals rather than relied on alone.",
  },
  {
    name: 'Employment / Business Stability',
    summary: 'How long the applicant has been employed or running their business.',
    detail: 'Longer tenure generally signals more experience and a more stable operation.',
  },
];

const OUTPUTS = [
  {
    name: 'Credit Score',
    detail: 'A single number from 300–900 (similar to familiar credit score scales) that summarizes overall creditworthiness. Higher is better.',
  },
  {
    name: 'Default Probability',
    detail: "Credit Lens's estimate of how likely the applicant is to fail to repay the loan, shown as a percentage. Lower is better.",
  },
  {
    name: 'Risk Tier',
    detail: 'A simple Low / Medium / High label that translates the default probability into an easy, at-a-glance category a lender can act on.',
  },
  {
    name: 'Top Contributing Factors',
    detail: "The signals that mattered most to Credit Lens's assessment for this applicant, so a lender can see why a score came out the way it did — not just the number itself.",
  },
];

const GLOSSARY = [
  { term: 'Alternative Data', def: 'Information beyond a traditional credit report — like cash flow patterns or bill payment habits — used to assess creditworthiness when formal credit history is missing or thin.' },
  { term: 'Bureau (Credit Bureau)', def: "An organization that collects and reports on individuals' and businesses' credit and loan history." },
  { term: 'Cash Flow', def: 'The money moving in and out of a business day to day.' },
  { term: 'Credit Score', def: 'A single number summarizing how creditworthy an applicant is. Higher generally means lower risk.' },
  { term: 'Default', def: 'When a borrower fails to repay a loan as agreed.' },
  { term: 'Default Probability', def: "An estimate of how likely an applicant is to default, shown as a percentage." },
  { term: 'GST (Goods and Services Tax)', def: 'A tax businesses file regularly. How consistently a business files is used here as a proxy for how organized and compliant it is.' },
  { term: 'Risk Tier', def: 'A Low / Medium / High category summarizing an applicant’s estimated risk, derived from their default probability.' },
  { term: 'SME (Small and Medium Enterprise)', def: 'A small or medium-sized business — the kind of applicant Credit Lens is built for.' },
  { term: 'Underwriting', def: 'The process a lender uses to decide whether — and on what terms — to approve a loan.' },
  { term: 'UPI (Unified Payments Interface)', def: 'A widely used real-time payment system in India. UPI transaction history is one of the "alternative data" sources this kind of model can draw on.' },
];

function HowItWorks({ onBack, onTryDashboard }) {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-10">

        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            ← Back to Home
          </button>
        </div>

        <header className="text-center space-y-3">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">How Credit Lens Works</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            A plain-English guide to what Credit Lens does, what it looks at, and what
            its results mean — no finance background required.
          </p>
        </header>

        <section className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 space-y-3">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">The Big Picture</h2>
          <p className="text-gray-700 leading-relaxed">
            Traditional lenders decide whether to approve a loan mostly by looking
            at a formal credit history. That works fine for people and businesses
            who already have one — but millions of small businesses don't,
            especially newer ones. Credit Lens is built to give those businesses a
            fair shot by looking at other real signals of financial health
            instead: how steady their income is, how reliably they pay existing
            bills, whether their revenue is growing, and more.
          </p>
          <p className="text-gray-700 leading-relaxed">
            You enter an applicant's annual income and requested loan amount on
            the Dashboard, and Credit Lens returns a credit score, an estimated
            default probability, a risk tier, and the factors that drove the
            decision — so a lender can see not just the answer, but why.
          </p>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">The 7 Signals Credit Lens Looks At</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {SIGNALS.map((s) => (
              <div key={s.name} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-1">{s.name}</h3>
                <p className="text-sm text-gray-600 mb-1">{s.summary}</p>
                <p className="text-sm text-gray-500">{s.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Understanding Your Results</h2>
          <div className="space-y-4">
            {OUTPUTS.map((o) => (
              <div key={o.name} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                <span className="font-semibold text-gray-800 sm:w-56 shrink-0">{o.name}</span>
                <span className="text-sm text-gray-600">{o.detail}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Glossary</h2>
          <dl className="space-y-4">
            {GLOSSARY.map((g) => (
              <div key={g.term}>
                <dt className="font-semibold text-gray-800">{g.term}</dt>
                <dd className="text-sm text-gray-600 mt-0.5">{g.def}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="text-center pb-4">
          <button
            onClick={onTryDashboard}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors"
          >
            Try our Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;
