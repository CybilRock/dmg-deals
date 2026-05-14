"""
One-time script: recalculate Debbie's booker_rate, booker_payout, and dmg_net
for all DVC deals using the correct FLAT rate model.

Flat rate logic (based on total non-no-deposit DVC turnover):
  - Total > R1,000,000: all deals at 2%
  - Total > R500,000:   all deals at 1.5%
  - Total <= R500,000:  all deals at 1%
  - No-deposit deals:   always 1%, excluded from total

Run from dmg-deals root:
  python scripts/recalc_booker_payouts.py
"""

import urllib.request
import urllib.parse
import json

SUPABASE_URL = "https://ujyrpsiszyyhsbafosog.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqeXJwc2lzenl5aHNiYWZvc29nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU3NTEzMCwiZXhwIjoyMDk0MTUxMTMwfQ.2tgYpQagYW6Wy_uOAu7Y2NFxmTvEe54hk3LdU4wY0iI"

HEADERS = {
    "apikey": SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

CONTRACTOR_BASE = 15.5


def supabase_get(path: str, params: dict | None = None) -> list:
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=HEADERS, method="GET")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def supabase_patch(path: str, record_id: str, body: dict) -> dict:
    url = f"{SUPABASE_URL}/rest/v1/{path}?id=eq.{record_id}"
    data = json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, headers=HEADERS, method="PATCH")
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())
        return result[0] if result else {}


def calc_debbie_rate(total_turnover: float) -> float:
    if total_turnover > 1_000_000:
        return 0.02
    if total_turnover > 500_000:
        return 0.015
    return 0.01


def main():
    # 1. Find the active booker (Debbie)
    bookers = supabase_get("people", {
        "role": "in.(booker,both)",
        "active": "eq.true",
        "select": "id,name",
        "order": "created_at",
        "limit": "1",
    })
    if not bookers:
        print("No active booker found.")
        return

    booker = bookers[0]
    print(f"Booker: {booker['name']} ({booker['id']})")

    # 2. Fetch all non-cancelled DVC deals for this booker
    deals = supabase_get("deals", {
        "booker_id": f"eq.{booker['id']}",
        "product": "eq.DVC",
        "status": "neq.cancelled",
        "select": "id,deal_date,deposit_type,deal_value,points,net_excl_vat,consultant_payout,drip_remaining_payout,booker_rate,booker_payout,dmg_net",
    })
    print(f"Found {len(deals)} non-cancelled DVC deals")

    # 3. Calculate total non-no-deposit turnover
    total_turnover = sum(
        (d.get("deal_value") or 0)
        for d in deals
        if d["deposit_type"] != "no_deposit"
    )
    flat_rate = calc_debbie_rate(total_turnover)
    print(f"Total non-no-deposit turnover: R{total_turnover:,.0f}")
    print(f"Flat rate: {flat_rate * 100:.1f}%\n")

    # 4. Apply flat rate to all deals
    for deal in deals:
        is_drip = deal["deposit_type"] == "no_deposit"
        points = deal.get("points") or 0
        contractor_base = points * CONTRACTOR_BASE

        new_rate   = 0.01 if is_drip else flat_rate
        new_payout = contractor_base * new_rate

        net_excl_vat      = deal.get("net_excl_vat") or 0
        consultant_payout = deal.get("consultant_payout") or 0
        drip_remaining    = deal.get("drip_remaining_payout") or 0
        new_dmg_net       = net_excl_vat - consultant_payout - drip_remaining - new_payout

        old_rate   = deal.get("booker_rate") or 0
        old_payout = deal.get("booker_payout") or 0
        changed    = abs(old_rate - new_rate) > 0.0001 or abs(old_payout - new_payout) > 0.01

        print(
            f"  {deal['deal_date']}  {deal['deposit_type']:15s}  "
            f"rate: {old_rate*100:.1f}% -> {new_rate*100:.1f}%  "
            f"payout: R{old_payout:>8,.2f} -> R{new_payout:>8,.2f}  "
            f"{'UPDATING' if changed else 'no change'}"
        )

        if changed:
            supabase_patch("deals", deal["id"], {
                "booker_rate":   new_rate,
                "booker_payout": round(new_payout, 2),
                "dmg_net":       round(new_dmg_net, 2),
            })

    print("\nDone.")


if __name__ == "__main__":
    main()
