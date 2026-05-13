"use client"

import { createContext, useContext } from "react"

interface SidebarCtxType {
  open: boolean
  toggle: () => void
  close: () => void
}

export const SidebarCtx = createContext<SidebarCtxType | null>(null)
export const useSidebarCtx = () => useContext(SidebarCtx)
