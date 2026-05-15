import type { Metadata } from "next"
import BookingFlow from "./BookingFlow"

export const metadata: Metadata = {
  title: "Book a Free Consultation — Holiday Brokers",
  description: "Pick a time and we'll walk you through your travel savings options. No obligation.",
}

export default function BookPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#c9a84c] mb-3">
            Holiday Brokers
          </p>
          <h1 className="text-2xl font-bold text-[#f5f5f5] leading-tight">
            Book a Free Consultation
          </h1>
          <p className="text-[#666] mt-2 text-sm leading-relaxed">
            Pick a time and we&apos;ll walk you through your options — no paperwork, no obligation.
          </p>
        </div>

        <BookingFlow />

        <p className="text-center text-[11px] text-[#333] mt-6">
          Dream Merchant Group · deals.dreammerchants.co.za
        </p>
      </div>
    </div>
  )
}
