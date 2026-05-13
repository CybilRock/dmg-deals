import TopBar from "@/components/layout/TopBar"
import { createAdminClient } from "@/lib/supabase/admin"
import Link from "next/link"
import { notFound } from "next/navigation"
import EditPersonForm from "./EditPersonForm"

export const dynamic = "force-dynamic"

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: person } = await supabase.from("people").select("*").eq("id", id).single()
  if (!person) notFound()

  return (
    <>
      <TopBar
        title={`Edit — ${person.name}`}
        action={<Link href={`/people/${id}`} className="text-xs text-[#a8a8a8] hover:text-[#f5f5f5]">← Cancel</Link>}
      />
      <div className="flex-1 overflow-auto p-6">
        <EditPersonForm person={person} />
      </div>
    </>
  )
}
