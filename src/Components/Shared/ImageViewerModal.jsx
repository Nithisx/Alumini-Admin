import React, { useEffect } from "react"
import { X } from "lucide-react"

/**
 * ImageViewerModal — a premium full-screen image viewer overlay.
 *
 * Props:
 *   isOpen   : boolean
 *   imageUrl : string  — the URL to display
 *   altText  : string  — alt attribute (defaults to "Photo")
 *   onClose  : () => void
 */
const ImageViewerModal = ({ isOpen, imageUrl, altText = "Photo", onClose }) => {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen || !imageUrl) return null

  return (
    <div
      className="image-viewer-overlay"
      onClick={onClose}
      role="dialog"
      aria-label="Image viewer"
    >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="image-viewer-close-btn"
        aria-label="Close image viewer"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Image container — stop click propagation so clicking the image doesn't close */}
      <div
        className="image-viewer-content"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={altText}
          className="image-viewer-img"
          draggable={false}
        />
      </div>
    </div>
  )
}

export default ImageViewerModal
