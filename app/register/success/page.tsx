export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-6">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#0f172a] mb-3">Application Received</h1>
        <p className="text-sm text-[#64748b] leading-relaxed mb-8">
          Thanks for applying to join Dream Merchant Group as a partner. We&apos;ll review your
          application and email you within 1–2 business days with next steps.
        </p>
        <a
          href="https://dreammerchants.co.za"
          className="text-xs text-amber-500 hover:underline"
        >
          Return to Dream Merchants →
        </a>
      </div>
    </div>
  )
}
