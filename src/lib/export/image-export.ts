import { toPng } from "html-to-image"

export async function captureElementAsImage(
  element: HTMLElement,
  filename: string = "agent-wrapped.png"
): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      quality: 0.95,
      pixelRatio: 2,
      backgroundColor: "#0a0a0a",
    })

    const link = document.createElement("a")
    link.download = filename
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error("Failed to capture image:", error)
    throw new Error("Failed to generate image. Please try again.")
  }
}

export async function captureElementAsBlob(
  element: HTMLElement
): Promise<Blob> {
  const dataUrl = await toPng(element, {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: "#0a0a0a",
  })
  const res = await fetch(dataUrl)
  return res.blob()
}
