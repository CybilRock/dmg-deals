import { BOOKING_URL } from "./resend"

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function bookingButton(label = "Book a Call") {
  return `<div style="margin:32px 0;text-align:center;">
    <a href="${BOOKING_URL}" style="background:#c9a84c;color:#000;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;">${label}</a>
  </div>`
}

function layout(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:#1a1a1a;padding:24px 40px;">
            <p style="margin:0;color:#c9a84c;font-size:18px;font-weight:700;letter-spacing:1px;">HOLIDAY BROKERS</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;color:#1a1a1a;font-size:16px;line-height:1.7;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background:#f9f9f9;padding:24px 40px;border-top:1px solid #ebebeb;">
            <p style="margin:0;font-size:13px;color:#888;">holidaybrokers.co.za &nbsp;|&nbsp; You're receiving this because you used our ROI Calculator.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function p(text: string) {
  return `<p style="margin:0 0 16px 0;">${text}</p>`
}

function b(text: string) {
  return `<strong>${text}</strong>`
}

export interface EmailTemplate {
  subject: string
  html: string
}

export function email1(firstName: string): EmailTemplate {
  return {
    subject: "Your holiday savings report is ready",
    html: layout(`
      ${p(`Hi ${escapeHtml(firstName)},`)}
      ${p("Thanks for running your numbers on the Holiday Brokers calculator.")}
      ${p("Here's the headline: most South Africans who travel 2–3 times a year recover the full cost of a HolidayCorp membership within the first year — sometimes in the first trip.")}
      ${p("Here's why that's possible.")}
      ${p("Every time you book a flight, hotel, car hire, or cruise through a travel company, that company keeps a commission on your booking. It's built into the price you pay. You cover it without knowing.")}
      ${p(b("HolidayCorp inverts that."))}
      ${p("As a member, you get those commissions back as cash. Same supplier deals. Same prices at checkout. The margin just flows back to you instead of the company.")}
      ${p("One flight ticket: ~R4,000 cashback.<br>A family trip with 5 tickets: ~R20,000.<br>An all-inclusive Mauritius holiday: up to R50,000 back.")}
      ${p("That's not a promotional estimate. That's what members are receiving.")}
      ${p("In the next few days we'll walk you through exactly how it works, show you a real member story, and answer the most common questions. If you'd rather jump straight to the numbers conversation, our consultants are available now — 20 minutes, no pressure.")}
      ${bookingButton("Book a Call")}
      ${p("— Eva<br>Holiday Brokers")}
    `),
  }
}

export function email2(firstName: string): EmailTemplate {
  return {
    subject: "The hidden margin on every holiday you've ever booked",
    html: layout(`
      ${p(`Hi ${escapeHtml(firstName)},`)}
      ${p("Quick question: when you booked your last flight, do you know how much the booking platform made on your ticket?")}
      ${p("Most people don't. Here's what actually happens.")}
      ${p("Airlines, hotels, car hire companies, and cruise lines all operate on margin. They sell through third-party platforms — travel agencies, booking sites — and pay those platforms a commission on every transaction. The platform builds that commission into the price you see. You pay it, unknowingly, every single time.")}
      ${p(b("HolidayCorp was built on one idea: that money should come back to you."))}
      ${p("As a member, you book your travel through HolidayCorp. They have the same supplier relationships as any travel company. The difference? They don't keep those commissions. They pass them back to you as cashback — on every eligible booking, across every category:")}
      <p style="margin:0 0 16px 0;">
        ✓ Flights<br>✓ Accommodation<br>✓ Car rentals<br>✓ Sea cruises<br>✓ Activities<br>✓ Transfers
      </p>
      ${p("No cap on bookings. No category limits. The more you travel, the more you earn back.")}
      ${p(`${b("What does that look like in practice?")}<br><br>1 flight ticket: ~R4,000 cashback<br>Family of 5 on one trip: ~R20,000 cashback<br>All-inclusive Mauritius at R300,000 spend: up to R50,000 back`)}
      ${p("The calculator you ran was built on these real figures.")}
      ${p("Tomorrow we'll show you a real client story that shows exactly how this plays out in practice.")}
      ${p("— Eva, Holiday Brokers")}
    `),
  }
}

export function email3(firstName: string): EmailTemplate {
  return {
    subject: "He paid off his R25,000 membership in one trip to Amsterdam",
    html: layout(`
      ${p(`Hi ${escapeHtml(firstName)},`)}
      ${p("This is a real client story. We share it because it shows the model working exactly as designed.")}
      <hr style="border:none;border-top:1px solid #ebebeb;margin:24px 0;">
      ${p("A doctor. A trip to Amsterdam. Four tickets.")}
      ${p("He signed up for a 3-year HolidayCorp membership at R25,000. He paid 30% upfront (R7,500) and the balance over 23 months, interest-free — roughly R760 a month.")}
      ${p("A few months in, he booked Amsterdam for four people.")}
      ${p(`Cashback per ticket: R5,500.<br>Total cashback on that one booking: ${b("R22,000.")}`)}
      ${p(`His R25,000 membership — effectively down to ${b("R3,000 after one trip.")}`)}
      ${p("And that was just the first booking.")}
      ${p("He still had the rest of his 3-year term ahead of him. Unlimited cashback on every flight, hotel, car hire, and cruise he booked after that. The membership had already paid for itself. Everything that followed was straight savings.")}
      <hr style="border:none;border-top:1px solid #ebebeb;margin:24px 0;">
      ${p("That's not exceptional. That's the model working as intended.")}
      ${p("The bigger your travel spend, the faster your membership pays for itself. For a family that travels twice a year, the numbers compound quickly. For someone who travels frequently for work, even faster.")}
      ${p("If you'd like to run your own scenario with a consultant — your real travel habits, your numbers — that conversation takes about 20 minutes.")}
      ${bookingButton("Book a Call")}
      ${p("— Eva, Holiday Brokers")}
    `),
  }
}

export function email4(firstName: string): EmailTemplate {
  return {
    subject: '"Is this just a timeshare?"',
    html: layout(`
      ${p(`Hi ${escapeHtml(firstName)},`)}
      ${p("We get this question constantly. And honestly? We understand why.")}
      ${p("The travel industry has a complicated history. Timeshares. Points clubs. Fractional ownership. Travel voucher schemes. Some of those products have served people well. Others haven't. And a lot of people have been burned by fine print they didn't read carefully enough.")}
      ${p("When someone describes a membership product that promises to save money on travel, it's completely reasonable to be sceptical.")}
      ${p("So here's the honest breakdown.")}
      ${p(`${b("It's not a timeshare.")}<br>You don't purchase a property, a week, or a physical asset. No lock-in periods tied to resorts. No annual levy. No right-to-use weeks to manage.`)}
      ${p(`${b("It's not a points club.")}<br>There's no internal currency, no points that expire, no redemption system to navigate. You book real travel through real suppliers. The cashback is real money.`)}
      ${p(`${b("It's not a discount voucher scheme.")}<br>You don't receive coupons or inflated-price "discounts." You receive back the actual margin the supplier pays — which is why the cashback figures are material, not token gestures.`)}
      ${p(`${b("What it is:")}<br>A service agreement. HolidayCorp has supplier relationships with airlines, hotels, and travel companies. When you book through them, the commission that would normally stay with the travel company comes back to you as cash. You pay a membership fee. The cashback offsets — and in most cases, far exceeds — that cost over the term.`)}
      ${p("That's the whole model. No hidden charges. No resort fees. No gimmick.")}
      ${p("If you've still got questions, a 20-minute call with one of our consultants will answer all of them. They won't push you toward anything you're not ready for.")}
      ${bookingButton("Book a Call")}
      ${p("— Eva, Holiday Brokers")}
    `),
  }
}

export function email5(firstName: string): EmailTemplate {
  return {
    subject: "Let's run your actual numbers",
    html: layout(`
      ${p(`Hi ${escapeHtml(firstName)},`)}
      ${p("You ran your numbers on the calculator a couple of weeks ago.")}
      ${p("If you're still thinking about it — that's normal. This is a real financial commitment. It should take some thought.")}
      ${p("Here's what we'd suggest: one 20-minute call with one of our consultants.")}
      ${p("Not a closing call. A numbers conversation.")}
      ${p("You tell them how you actually travel — how often, where, how many people, what you typically spend. They'll run through the real cashback figures for your situation. You'll leave knowing exactly what you'd get back, what it would cost, and whether it makes sense for you.")}
      ${p("If the numbers don't work, they'll tell you. We'd rather you leave that call with an honest picture than a membership you're uncertain about.")}
      ${p(b("The three options that suit most people:"))}
      <table width="100%" style="border-collapse:collapse;margin:16px 0 24px 0;font-size:14px;">
        <thead>
          <tr style="background:#f4f4f4;">
            <th style="padding:10px 12px;text-align:left;border:1px solid #ddd;">Option</th>
            <th style="padding:10px 12px;text-align:left;border:1px solid #ddd;">Close price</th>
            <th style="padding:10px 12px;text-align:left;border:1px solid #ddd;">Monthly (23mo, 0%)</th>
            <th style="padding:10px 12px;text-align:left;border:1px solid #ddd;">What makes it different</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:10px 12px;border:1px solid #ddd;">3-Year</td>
            <td style="padding:10px 12px;border:1px solid #ddd;">R25,000</td>
            <td style="padding:10px 12px;border:1px solid #ddd;">~R760/mo</td>
            <td style="padding:10px 12px;border:1px solid #ddd;">Most popular starting point</td>
          </tr>
          <tr style="background:#fafafa;">
            <td style="padding:10px 12px;border:1px solid #ddd;">5-Year</td>
            <td style="padding:10px 12px;border:1px solid #ddd;">R54,000</td>
            <td style="padding:10px 12px;border:1px solid #ddd;">~R1,643/mo</td>
            <td style="padding:10px 12px;border:1px solid #ddd;">Higher cashback volume over time</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border:1px solid #ddd;">10-Year</td>
            <td style="padding:10px 12px;border:1px solid #ddd;">R75,000</td>
            <td style="padding:10px 12px;border:1px solid #ddd;">Flexible</td>
            <td style="padding:10px 12px;border:1px solid #ddd;">Full R75,000 returned at Year 10 — guaranteed</td>
          </tr>
        </tbody>
      </table>
      ${p("The 10-year is the one that tends to make people pause. You get 10 years of cashback savings, and at the end of the term, your full R75,000 comes back to you — guaranteed. The net cost is zero, before a single rand of cashback is counted. It's structured as a travel investment product, not just a membership.")}
      ${p("But the right option depends on your situation. That's what the call is for.")}
      ${bookingButton("Book a Call with a Consultant")}
      ${p("— Eva, Holiday Brokers")}
      ${p("P.S. If now isn't the right time — keep this email. When your next holiday is approaching and you're about to book flights, come back and run the numbers again. They tend to land differently when there's a real trip on the horizon.")}
    `),
  }
}

export function emailAutoReply(toEmail: string): EmailTemplate {
  return {
    subject: "Got your message — Eva here",
    html: layout(`
      ${p("Hi,")}
      ${p("Thanks for writing back — I've received your message and passed it to one of our consultants. They'll follow up with you directly.")}
      ${p("In the meantime, if you'd rather move faster and pick a time that works for you:")}
      ${bookingButton("Book a Call Now")}
      ${p("Talk soon.")}
      ${p("— Eva<br>Holiday Brokers")}
    `),
  }
}

// Delay in days for each email in the sequence (index 0 = email 1)
export const EMAIL_DELAYS_DAYS = [0, 2, 5, 9, 14] as const

export const EMAIL_TEMPLATES = [email1, email2, email3, email4, email5] as const

// ---------------------------------------------------------------------------
// Agent recruitment sequence
// NOTE: Commission figures use ~20% of close price as conservative floor.
//       Verify actual rate with HB before deploying.
// ---------------------------------------------------------------------------

export function agentEmail1(firstName: string): EmailTemplate {
  return {
    subject: "How the Holiday Brokers agent model works",
    html: layout(`
      ${p(`Hi ${escapeHtml(firstName)},`)}
      ${p("You asked about the Holiday Brokers agent opportunity. Here's the honest picture.")}
      ${p("Holiday Brokers is a sales brokerage. We sell HolidayCorp travel memberships to South African consumers — products that give members cashback on every flight, hotel, and holiday they book.")}
      ${p("There are two ways to earn with us:")}
      ${p(`${b("1. Sales Consultant")}<br>You work leads — your own network or warm leads we provide — present the membership on a call, close the sale, and earn commission. We train you on everything. Full product knowledge, scripts, objection handling.`)}
      ${p(`${b("2. Referral Agent")}<br>You don't need to close anything. You refer people who travel — friends, colleagues, clients — and earn a commission when they sign up. No calls, no presentations. Just the introduction.`)}
      ${p("The product sells itself to the right person. South Africans who travel 2–3 times a year recover the full membership cost within the first year. Your job is getting that conversation started. We handle everything else.")}
      ${p("In the next few days I'll walk you through the actual commission tiers, show you what an active agent's month looks like, and answer the questions everyone asks first.")}
      ${p("If you'd rather just talk now:")}
      ${bookingButton("Book a Call")}
      ${p("— Eva<br>Holiday Brokers")}
    `),
  }
}

export function agentEmail2(firstName: string): EmailTemplate {
  return {
    subject: "The commission structure, laid out",
    html: layout(`
      ${p(`Hi ${escapeHtml(firstName)},`)}
      ${p("Commission is tiered — both by membership and by your role.")}
      <table width="100%" style="border-collapse:collapse;margin:16px 0 24px 0;font-size:14px;">
        <thead>
          <tr style="background:#f4f4f4;">
            <th style="padding:10px 12px;text-align:left;border:1px solid #ddd;">Membership</th>
            <th style="padding:10px 12px;text-align:left;border:1px solid #ddd;">Sale Price</th>
            <th style="padding:10px 12px;text-align:left;border:1px solid #ddd;">Your Earning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:10px 12px;border:1px solid #ddd;">3-Year</td>
            <td style="padding:10px 12px;border:1px solid #ddd;">R25,000</td>
            <td style="padding:10px 12px;border:1px solid #ddd;">R2,500</td>
          </tr>
          <tr style="background:#fafafa;">
            <td style="padding:10px 12px;border:1px solid #ddd;">5-Year</td>
            <td style="padding:10px 12px;border:1px solid #ddd;">R54,000</td>
            <td style="padding:10px 12px;border:1px solid #ddd;">R5,282</td>
          </tr>
          <tr>
            <td style="padding:10px 12px;border:1px solid #ddd;">10-Year</td>
            <td style="padding:10px 12px;border:1px solid #ddd;">R75,000</td>
            <td style="padding:10px 12px;border:1px solid #ddd;">R7,300</td>
          </tr>
        </tbody>
      </table>
      ${p(`${b("Referral agents")} earn the same fixed amount — you refer the lead, we close it. One 5-year referral earns you R5,282 for a conversation you had over coffee.`)}
      ${p(`${b("Sales consultants")} present and close the sale themselves, with our training and scripts behind you. Two 3-year closes a month puts R5,000 in your pocket — part-time.`)}
      ${p(`${b("Senior consultants")} unlock higher tier earnings through volume. The more you close, the more you earn per close.`)}
      ${p("No inventory. No upfront cost. No monthly fees. You earn when you produce.")}
      ${p("Tomorrow I'll show you a real agent story.")}
      ${p("— Eva, Holiday Brokers")}
    `),
  }
}

export function agentEmail3(firstName: string): EmailTemplate {
  return {
    subject: "She went full-time after her third sale",
    html: layout(`
      ${p(`Hi ${escapeHtml(firstName)},`)}
      ${p("Real story. Shared with permission.")}
      <hr style="border:none;border-top:1px solid #ebebeb;margin:24px 0;">
      ${p("A former HR manager. Late 30s. Joined Holiday Brokers as a part-time consultant while still in full employment.")}
      ${p("Her first sale took six weeks. A colleague — someone she'd known for years, who travelled frequently, who'd never thought about a travel membership. She walked her through the HolidayCorp model on a Friday afternoon. That one close covered two months of her car payment.")}
      ${p("Her second and third sales followed over the next month. Both people in her professional network. Both genuinely qualified — frequent travellers who recovered their membership cost within twelve months.")}
      ${p(`By month four, she was earning more in commission than her base salary. ${b("She resigned.")}`)}
      <hr style="border:none;border-top:1px solid #ebebeb;margin:24px 0;">
      ${p("That's not a success story from a top performer. It's the expected outcome for someone who works their existing network, presents the product correctly, and closes consistently.")}
      ${p("The product isn't a hard sell. If someone travels regularly and you can show them why paying hidden commission to a booking platform is worse than receiving that commission back — the sale happens. Your job is the conversation.")}
      ${p("If this sounds like something you'd be good at:")}
      ${bookingButton("Book a Call")}
      ${p("— Eva, Holiday Brokers")}
    `),
  }
}

export function agentEmail4(firstName: string): EmailTemplate {
  return {
    subject: "The three questions everyone asks before joining",
    html: layout(`
      ${p(`Hi ${escapeHtml(firstName)},`)}
      ${p("These come up on almost every first call. Here's the honest answer to each.")}
      ${p(`${b('"Is this an MLM?"')}<br>No. You earn commission for closing sales — not for recruiting other consultants. There's no downline, no tiered structure below you, no recruitment quota. Holiday Brokers makes money when memberships are sold to consumers. You earn when you're the person who closed it.`)}
      ${p(`${b('"Do I need sales experience?"')}<br>It helps, but it's not a prerequisite. We provide full product training, sales scripts, objection handling frameworks, and certification. Consultants with no prior sales background regularly outperform those who come in expecting it to be a conventional sales role — because they listen to the training instead of reverting to old habits.`)}
      ${p(`${b('"Where do I get my leads?"')}<br>Two sources. Your own network first — the most effective starting point. South Africans who travel 2–3 times a year are everywhere: friends, colleagues, family, professional contacts. The second source is warm leads from Holiday Brokers — prospects generated by our website who've already expressed interest. As you build volume, we route more to you.`)}
      ${p("One more thing: there's no upfront cost to join. No franchise fee. No product purchase required. You complete training and certification, and then you sell.")}
      ${p("If you're ready to have the full conversation:")}
      ${bookingButton("Book a Call")}
      ${p("— Eva, Holiday Brokers")}
    `),
  }
}

export function agentEmail5(firstName: string): EmailTemplate {
  return {
    subject: "Still thinking about it?",
    html: layout(`
      ${p(`Hi ${escapeHtml(firstName)},`)}
      ${p("You looked into the Holiday Brokers consultant opportunity a couple of weeks ago.")}
      ${p("This isn't a pressure close. If the timing isn't right, keep this email and come back to it when it is.")}
      ${p("But if you've been sitting on the decision — one honest reason to move sooner rather than later:")}
      ${p(`${b("Capacity is real.")}<br>We're a structured brokerage, not an open marketplace. The number of active consultants in any given region is capped. When a region fills, the next intake goes on a waitlist. We're currently onboarding consultants in select areas. Once those spots are taken, the next window is months away.`)}
      ${p("If you've done the maths and the income model makes sense — one 20-minute call with our team is all it takes to get started.")}
      ${bookingButton("Book a Call to Join")}
      ${p("— Eva<br>Holiday Brokers")}
      ${p("P.S. If the timing genuinely isn't right — no hard feelings. Keep an eye on the site. When the next intake opens in your area, we'll list it.")}
    `),
  }
}

export const AGENT_EMAIL_DELAYS_DAYS = [0, 2, 5, 9, 14] as const

export const AGENT_EMAIL_TEMPLATES = [agentEmail1, agentEmail2, agentEmail3, agentEmail4, agentEmail5] as const
