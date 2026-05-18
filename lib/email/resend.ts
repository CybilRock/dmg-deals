import { Resend } from "resend"

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY is not set")
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.EMAIL_FROM ?? "Eva from Holiday Brokers <eva@holidaybrokers.co.za>"
export const BOOKING_URL = process.env.HB_BOOKING_URL ?? "https://holidaybrokers.co.za"
