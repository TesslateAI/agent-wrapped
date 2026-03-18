import { captureElementAsBlob } from "./image-export"

export async function shareWrapped(element: HTMLElement): Promise<void> {
  try {
    const blob = await captureElementAsBlob(element)
    const file = new File([blob], "agent-wrapped.png", { type: "image/png" })

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "My Agent Wrapped",
        text: "Check out my coding agent stats!",
        files: [file],
      })
    } else {
      // Fallback: download the image
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = "agent-wrapped.png"
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    }
  } catch (error) {
    if ((error as Error).name !== "AbortError") {
      console.error("Share failed:", error)
      throw new Error("Failed to share. Please try downloading instead.")
    }
  }
}
