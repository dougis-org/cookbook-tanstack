export const MAX_RECIPE_IMAGE_UPLOAD_SIZE_MB = 10
export const MAX_RECIPE_IMAGE_UPLOAD_SIZE_BYTES =
  MAX_RECIPE_IMAGE_UPLOAD_SIZE_MB * 1024 * 1024

export const ALLOWED_RECIPE_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const

export const ACCEPTED_RECIPE_IMAGE_TYPES = ALLOWED_RECIPE_IMAGE_MIME_TYPES.join(",")

const ALLOWED_RECIPE_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
]

export function isAllowedRecipeImageFile(file: Pick<File, "name" | "type">) {
  const normalizedType = file.type.toLowerCase()

  if (
    ALLOWED_RECIPE_IMAGE_MIME_TYPES.includes(
      normalizedType as (typeof ALLOWED_RECIPE_IMAGE_MIME_TYPES)[number],
    )
  ) {
    return true
  }

  const normalizedName = file.name.toLowerCase()
  return (
    !normalizedType &&
    ALLOWED_RECIPE_IMAGE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension))
  )
}
