"use client"

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react"
import type { TraceData, AnalysisResult } from "@/lib/types"

type Status = "idle" | "uploading" | "parsing" | "analyzing" | "ready" | "error"

export interface WrappedState {
  status: Status
  files: File[]
  traceData: TraceData | null
  analysisResult: AnalysisResult | null
  error: string | null
}

type WrappedAction =
  | { type: "SET_FILES"; files: File[] }
  | { type: "SET_STATUS"; status: Status }
  | { type: "SET_TRACE_DATA"; data: TraceData }
  | { type: "SET_ANALYSIS_RESULT"; result: AnalysisResult }
  | { type: "SET_ERROR"; error: string }
  | { type: "RESET" }

const initialState: WrappedState = {
  status: "idle",
  files: [],
  traceData: null,
  analysisResult: null,
  error: null,
}

function wrappedReducer(state: WrappedState, action: WrappedAction): WrappedState {
  switch (action.type) {
    case "SET_FILES":
      return { ...state, files: action.files, status: "uploading", error: null }
    case "SET_STATUS":
      return { ...state, status: action.status }
    case "SET_TRACE_DATA":
      return { ...state, traceData: action.data, status: "analyzing" }
    case "SET_ANALYSIS_RESULT":
      return { ...state, analysisResult: action.result, status: "ready" }
    case "SET_ERROR":
      return { ...state, error: action.error, status: "error" }
    case "RESET":
      return initialState
    default:
      return state
  }
}

interface WrappedContextValue {
  state: WrappedState
  setFiles: (files: File[]) => void
  setStatus: (status: Status) => void
  setTraceData: (data: TraceData) => void
  setAnalysisResult: (result: AnalysisResult) => void
  setError: (error: string) => void
  reset: () => void
}

const WrappedContext = createContext<WrappedContextValue | null>(null)

function createActions(dispatch: Dispatch<WrappedAction>): Omit<WrappedContextValue, "state"> {
  return {
    setFiles: (files: File[]) => dispatch({ type: "SET_FILES", files }),
    setStatus: (status: Status) => dispatch({ type: "SET_STATUS", status }),
    setTraceData: (data: TraceData) => dispatch({ type: "SET_TRACE_DATA", data }),
    setAnalysisResult: (result: AnalysisResult) =>
      dispatch({ type: "SET_ANALYSIS_RESULT", result }),
    setError: (error: string) => dispatch({ type: "SET_ERROR", error }),
    reset: () => dispatch({ type: "RESET" }),
  }
}

export function WrappedProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wrappedReducer, initialState)
  const actions = createActions(dispatch)

  return (
    <WrappedContext.Provider value={{ state, ...actions }}>
      {children}
    </WrappedContext.Provider>
  )
}

export function useWrapped(): WrappedContextValue {
  const context = useContext(WrappedContext)
  if (!context) {
    throw new Error("useWrapped must be used within a WrappedProvider")
  }
  return context
}
