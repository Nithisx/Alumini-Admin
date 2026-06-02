import React, { useState, useCallback, useRef, useEffect } from "react"
import Cropper from "react-easy-crop"
import { X, ZoomIn, ZoomOut, RotateCw, Check, Loader } from "lucide-react"

/**
 * Generates a cropped image blob from a source image URL and crop area.
 */
const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      const ctx = canvas.getContext("2d")

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Canvas toBlob failed"))
        },
        "image/jpeg",
        0.92
      )
    }
    image.onerror = (err) => reject(err)
    image.src = imageSrc
  })
}

/**
 * ImageCropModal — a premium image crop & resize modal.
 *
 * Props:
 *   isOpen       : boolean
 *   imageSrc     : string (data URL or blob URL of the chosen file)
 *   aspectRatio  : number (e.g. 1 for square profile, 16/5 for cover)
 *   cropShape    : "round" | "rect" (default "rect")
 *   title        : string (e.g. "Crop Profile Photo")
 *   onClose      : () => void
 *   onCropDone   : (croppedBlob: Blob, croppedPreviewUrl: string) => void
 */
const ImageCropModal = ({
  isOpen,
  imageSrc,
  aspectRatio = 1,
  cropShape = "rect",
  title = "Crop Image",
  onClose,
  onCropDone,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [processing, setProcessing] = useState(false)

  // Reset state when new image opens
  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
      setCroppedAreaPixels(null)
      setProcessing(false)
    }
  }, [isOpen, imageSrc])

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

  // Escape to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleDone = async () => {
    if (!croppedAreaPixels || !imageSrc) return
    setProcessing(true)
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
      const previewUrl = URL.createObjectURL(blob)
      onCropDone(blob, previewUrl)
    } catch (err) {
      console.error("Crop failed:", err)
    } finally {
      setProcessing(false)
    }
  }

  if (!isOpen || !imageSrc) return null

  return (
    <div className="image-crop-overlay" role="dialog" aria-label={title}>
      <div className="image-crop-modal">
        {/* Header */}
        <div className="image-crop-header">
          <h3 className="image-crop-title">{title}</h3>
          <button
            onClick={onClose}
            className="image-crop-close-btn"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crop area */}
        <div className="image-crop-area">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            cropShape={cropShape}
            showGrid={true}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Controls */}
        <div className="image-crop-controls">
          {/* Zoom */}
          <div className="image-crop-control-row">
            <ZoomOut className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="image-crop-slider"
            />
            <ZoomIn className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>

          {/* Rotation */}
          <div className="image-crop-control-row">
            <RotateCw className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="image-crop-slider"
            />
            <span className="text-xs text-gray-400 min-w-[2rem] text-right">
              {rotation}°
            </span>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="image-crop-footer">
          <button onClick={onClose} className="image-crop-cancel-btn">
            Cancel
          </button>
          <button
            onClick={handleDone}
            disabled={processing}
            className="image-crop-done-btn"
          >
            {processing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Processing…</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Apply Crop</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageCropModal
