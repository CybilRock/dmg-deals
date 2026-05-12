export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full mx-auto mb-6">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-[#c9a84c] font-light text-lg tracking-[0.2em] mb-1">dream</p>
        <p className="text-white text-xs font-bold tracking-[0.3em] uppercase mb-8">Merchant Group</p>
        <h1 className="text-2xl font-bold text-[#f5f5f5] mb-3">Application Received</h1>
        <p className="text-sm text-[#a8a8a8] leading-relaxed mb-8">
          Thanks for applying to join Dream Merchant Group as a partner. We&apos;ll review your
          application and email you within 1–2 business days with next steps.
        </p>
        <a href="https://dreammerchants.co.za" className="text-xs text-[#c9a84c] hover:underline tracking-wide">
          Return to Dream Merchants →
        </a>
      </div>
    </div>
  )
}
