"use client"

import { useState } from "react"
import Sidebar from "./Sidebar"
import { SidebarCtx } from "./SidebarContext"

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const toggle = () => setOpen((v) => !v)
  const close  = () => setOpen(false)

  return (
    <SidebarCtx.Provider value={{ open, toggle, close }}>
      <div className="flex h-full relative">
        {open && (
          <div
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={close}
          />
        )}
        <div
          className={`fixed inset-y-0 left-0 z-30 lg:static lg:z-auto transition-transform duration-200 ${
            open ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
        >
          <Sidebar />
        </div>
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0d0d0d] min-w-0">
          {children}
        </main>
      </div>
    </SidebarCtx.Provider>
  )
}
