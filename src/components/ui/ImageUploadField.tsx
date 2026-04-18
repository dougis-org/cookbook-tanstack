import { Camera, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  ACCEPTED_RECIPE_IMAGE_TYPES,
  MAX_RECIPE_IMAGE_UPLOAD_SIZE_BYTES,
  MAX_RECIPE_IMAGE_UPLOAD_SIZE_MB,
  isAllowedRecipeImageFile,
} from "@/lib/recipe-image-upload";

export interface ImageUploadFieldProps {
  value: string | null;
  initialUrl?: string | null;
  onUpload: (url: string, fileId: string) => void;
  onRemove: () => void;
}

type UploadResponse = {
  url: string;
  fileId: string;
};

async function deleteUpload(fileId: string) {
  await fetch(`/api/upload/${fileId}`, { method: "DELETE", keepalive: true });
}

export default function ImageUploadField({
  value,
  initialUrl = null,
  onUpload,
  onRemove,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFileId, setPendingFileId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!value || value === initialUrl) {
      setPendingFileId(null);
    }
  }, [initialUrl, value]);

  const uploadFile = async (file: File) => {
    if (file.size > MAX_RECIPE_IMAGE_UPLOAD_SIZE_BYTES) {
      setError(`File must be under ${MAX_RECIPE_IMAGE_UPLOAD_SIZE_MB} MB`);
      return;
    }

    if (!isAllowedRecipeImageFile(file)) {
      setError("File must be a JPEG, PNG, WebP, or GIF image");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      if (pendingFileId) {
        try {
          await deleteUpload(pendingFileId);
        } catch (deleteError) {
          console.error("Failed to delete previous pending upload:", deleteError);
        }
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          typeof body?.error === "string" ? body.error : "Upload failed",
        );
      }

      const body = (await response.json()) as UploadResponse;
      setPendingFileId(body.fileId);
      onUpload(body.url, body.fileId);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed",
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      void uploadFile(file);
    }
  };

  const handleRemove = async () => {
    const fileId = pendingFileId;
    setPendingFileId(null);
    setError(null);

    if (fileId) {
      try {
        await deleteUpload(fileId);
      } catch (deleteError) {
        console.error("Failed to delete pending upload:", deleteError);
      }
    }

    onRemove();
  };

  return (
    <div className="space-y-3">
      <div className="relative min-h-52 overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-700 transition dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
        {value ? (
          <img
            src={value}
            alt="Recipe image preview"
            className="h-52 w-full object-cover"
          />
        ) : (
          <div className="flex h-52 flex-col items-center justify-center gap-3 px-4 text-center">
            {uploading ? (
              <>
                <Loader2
                  className="h-8 w-8 animate-spin text-cyan-600 dark:text-cyan-400"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium">Uploading...</span>
              </>
            ) : (
              <>
                <Camera
                  className="h-9 w-9 text-cyan-600 dark:text-cyan-400"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium">Click to upload</span>
              </>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_RECIPE_IMAGE_TYPES}
          aria-label={value ? "Change recipe image" : "Click to upload"}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={uploading}
          onChange={handleFileChange}
        />
      </div>

      {value ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            Change
          </button>
          <button
            type="button"
            className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
            onClick={() => void handleRemove()}
            disabled={uploading}
          >
            Remove
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
