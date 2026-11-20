"use client"

import { useRef, useState } from "react"
import { FileText, Upload, X } from "lucide-react"

import { fmtBytes, type UploadFile } from "@/lib/proto"
import { useProto } from "@/lib/store"
import { cn } from "@/lib/utils"

/**
 * Upload pieces shared by both forms in the drawer (optional context and the
 * information reply). States: uploading with progress, done, failed with
 * Retry, rejected (wrong type / too large) with Remove only.
 */
export function FileRow({
  file,
  locked,
  readOnly,
}: {
  file: UploadFile
  locked?: boolean
  readOnly?: boolean
}) {
  const removeFile = useProto((s) => s.removeFile)
  const retryFile = useProto((s) => s.retryFile)
  const failed = file.status === "error"

  return (
    <li
      className={cn(
        "flex flex-col gap-2 border px-3 py-2.5",
        failed ? "border-danger-dot bg-danger-bg" : "border-border-default bg-bg-base"
      )}
    >
      <div className="flex items-center gap-2.5">
        <FileText
          className={cn("size-4 shrink-0", failed ? "text-icon-danger" : "text-icon-secondary")}
          strokeWidth={1.75}
          aria-hidden
        />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-body-medium",
            failed ? "text-danger-text" : "text-text-primary"
          )}
        >
          {file.name}
        </span>
        <span className="shrink-0 text-body-small text-text-tertiary">{fmtBytes(file.size)}</span>
        {!readOnly && (
          <button
            type="button"
            disabled={locked}
            onClick={() => removeFile(file.id)}
            aria-label={`Remove ${file.name}`}
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center text-icon-secondary hover:text-icon-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {file.status === "uploading" && (
        <div
          role="progressbar"
          aria-label={`Uploading ${file.name}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={file.progress}
          className="h-1 w-full bg-bg-secondary"
        >
          <div
            className="h-full bg-brand-primary transition-[width] duration-150"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}

      {failed && (
        <div className="flex items-center justify-between gap-3 text-body-small text-danger-text">
          <span role="alert">{file.error}</span>
          {file.retryable && !locked && (
            <button
              type="button"
              onClick={() => retryFile(file.id)}
              className="cursor-pointer text-body-small-strong underline underline-offset-2 hover:no-underline"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </li>
  )
}

export function DropZone({ locked, label }: { locked: boolean; label: string }) {
  const addFiles = useProto((s) => s.addFiles)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const pick = () => inputRef.current?.click()

  return (
    <div
      role="button"
      tabIndex={locked ? -1 : 0}
      aria-disabled={locked}
      aria-label={`${label}. Drop files here or browse. PDF, JPG or PNG, up to 10MB each`}
      onClick={locked ? undefined : pick}
      onKeyDown={(e) => {
        if (locked) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          pick()
        }
      }}
      onDragOver={(e) => {
        if (locked) return
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!locked) addFiles(Array.from(e.dataTransfer.files))
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-1.5 border border-dashed px-4 py-6 text-center transition-colors",
        dragging ? "border-text-primary bg-bg-muted" : "border-border-strong bg-bg-subtle hover:bg-bg-muted",
        locked && "pointer-events-none opacity-60"
      )}
    >
      <Upload className="size-5 text-icon-secondary" strokeWidth={1.75} aria-hidden />
      <p className="text-body-medium text-text-primary">
        Drop files here or <span className="text-brand-text underline underline-offset-2">browse</span>
      </p>
      <p className="text-body-small text-text-tertiary">PDF, JPG or PNG, up to 10MB each</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        tabIndex={-1}
        aria-hidden
        className="hidden"
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []))
          e.target.value = ""
        }}
      />
    </div>
  )
}

/** Drop zone plus the list of attached files. */
export function FileField({ label, locked }: { label: string; locked: boolean }) {
  const files = useProto((s) => s.form.files)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-body-medium">
        <span className="text-text-primary">{label}</span>
        <span className="text-text-tertiary">Optional</span>
      </div>
      <DropZone locked={locked} label={label} />
      {files.length > 0 && (
        <ul className="mt-1 flex flex-col gap-2" aria-label="Attached files">
          {files.map((f) => (
            <FileRow key={f.id} file={f} locked={locked} />
          ))}
        </ul>
      )}
    </div>
  )
}
