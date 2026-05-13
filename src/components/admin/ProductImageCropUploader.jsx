import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";

function createImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);

    image.src = src;
  });
}

async function getCroppedImageBlob(imageSrc, croppedAreaPixels) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Не вдалося підготувати зображення.");
  }

  canvas.width = 1200;
  canvas.height = 1200;

  context.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Не вдалося обрізати зображення."));
          return;
        }

        resolve(blob);
      },
      "image/webp",
      0.86
    );
  });
}

async function uploadProductImage(file) {
  const formData = new FormData();

  formData.append("image", file);

  const response = await fetch("/api/admin/uploads/product-image", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || "Не вдалося завантажити зображення."
    );
  }

  return data;
}

export default function ProductImageCropUploader({
  value = "",
  onChange,
  disabled = false,
}) {
  const fileInputRef = useRef(null);

  const [sourceImage, setSourceImage] = useState("");
  const [sourceFileName, setSourceFileName] = useState("");
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    return () => {
      if (sourceImage) {
        URL.revokeObjectURL(sourceImage);
      }
    };
  }, [sourceImage]);

  useEffect(() => {
    if (!sourceImage) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sourceImage]);

  const onCropComplete = useCallback((_, nextCroppedAreaPixels) => {
    setCroppedAreaPixels(nextCroppedAreaPixels);
  }, []);

  function openFileDialog() {
    if (disabled || isUploading) return;

    fileInputRef.current?.click();
  }

  function closeCropper() {
    if (sourceImage) {
      URL.revokeObjectURL(sourceImage);
    }

    setSourceImage("");
    setSourceFileName("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setErrorMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Оберіть файл зображення.");
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setErrorMessage("Файл завеликий. Максимум 6 МБ.");
      return;
    }

    if (sourceImage) {
      URL.revokeObjectURL(sourceImage);
    }

    setSourceImage(URL.createObjectURL(file));
    setSourceFileName(file.name || "product-image");
    setErrorMessage("");
  }

  async function uploadCroppedImage() {
    if (!sourceImage || !croppedAreaPixels) return;

    setIsUploading(true);
    setErrorMessage("");

    try {
      const blob = await getCroppedImageBlob(sourceImage, croppedAreaPixels);

      const file = new File([blob], "product-image.webp", {
        type: "image/webp",
      });

      const response = await uploadProductImage(file);

      if (!response.imageUrl) {
        throw new Error("Backend не повернув посилання на зображення.");
      }

      onChange(response.imageUrl);
      closeCropper();
    } catch (error) {
      setErrorMessage(error?.message || "Не вдалося завантажити зображення.");
    } finally {
      setIsUploading(false);
    }
  }

  const cropperModal =
    sourceImage &&
    createPortal(
      <div
        className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/60 p-3 backdrop-blur-md"
        onClick={() => {
          if (!isUploading) closeCropper();
        }}
      >
        <div
          className="eg-glass flex h-[92dvh] w-[92vw] max-w-[980px] flex-col overflow-hidden rounded-[1.6rem] bg-white/95 shadow-[0_30px_80px_rgba(0,0,0,0.28)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="shrink-0 border-b border-stone-200 bg-white/95 px-5 py-3 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                  Обрізка фото
                </p>

                <h3 className="mt-0.5 text-2xl font-black text-stone-950">
                  Підготуйте фото товару
                </h3>

                <p className="mt-1 truncate text-xs text-stone-500">
                  {sourceFileName}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCropper}
                disabled={isUploading}
                className="eg-icon-button flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-xl font-black text-stone-600 hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ×
              </button>
            </div>
          </div>

          <div className="modal-scrollbar min-h-0 flex-1 overflow-y-auto bg-stone-50/60 p-4">
            <div className="grid min-h-full gap-4 lg:grid-cols-[1fr_280px]">
              <div className="relative min-h-[420px] overflow-hidden rounded-[1.4rem] bg-stone-950 shadow-inner lg:min-h-0">
                <Cropper
                  image={sourceImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  showGrid={true}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <aside className="flex flex-col gap-3">
                <div className="rounded-[1.4rem] bg-white/85 p-4 ring-1 ring-stone-100">
                  <p className="text-sm font-black text-stone-950">
                    Масштаб
                  </p>

                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                    className="mt-4 w-full accent-emerald-900"
                  />

                  <p className="mt-2 text-xs leading-5 text-stone-500">
                    Перетягніть фото всередині області та налаштуйте масштаб.
                    Після завантаження зображення стане квадратним WebP.
                  </p>
                </div>

                {errorMessage && (
                  <p className="rounded-[1.2rem] bg-red-50 px-4 py-3 text-sm font-bold text-red-700 ring-1 ring-red-100">
                    {errorMessage}
                  </p>
                )}

                <div className="mt-auto rounded-[1.4rem] bg-white/85 p-3 ring-1 ring-stone-100">
                  <div className="grid gap-2">
                    <button
                      type="button"
                      onClick={uploadCroppedImage}
                      disabled={isUploading}
                      className="eg-button eg-sweep rounded-xl bg-emerald-900 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                    >
                      {isUploading ? "Завантажуємо..." : "Завантажити фото"}
                    </button>

                    <button
                      type="button"
                      onClick={closeCropper}
                      disabled={isUploading}
                      className="eg-button rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-black text-stone-900 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Скасувати
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid gap-3 lg:grid-cols-[128px_1fr]">
        <button
          type="button"
          onClick={openFileDialog}
          disabled={disabled || isUploading}
          className="group overflow-hidden rounded-[1.35rem] bg-stone-100 text-left ring-1 ring-stone-200 transition hover:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {value ? (
            <img
              src={value}
              alt="Фото товару"
              className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-32 items-center justify-center px-4 text-center text-xs font-black uppercase tracking-wide text-stone-400">
              Фото товару
            </div>
          )}
        </button>

        <div className="rounded-[1.35rem] bg-stone-50/90 p-3 ring-1 ring-stone-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black text-stone-950">
                Завантаження фото
              </p>

              <p className="mt-1 text-xs leading-5 text-stone-500">
                Оберіть фото, обріжте під квадратну картку товару, і посилання
                автоматично підставиться в поле.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={openFileDialog}
                disabled={disabled || isUploading}
                className="eg-button rounded-xl bg-emerald-900 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Обрати фото
              </button>

              {value && (
                <button
                  type="button"
                  onClick={() => onChange("")}
                  disabled={disabled || isUploading}
                  className="eg-button rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-black text-stone-900 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Очистити
                </button>
              )}
            </div>
          </div>

          {errorMessage && !sourceImage && (
            <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700 ring-1 ring-red-100">
              {errorMessage}
            </p>
          )}
        </div>
      </div>

      {cropperModal}
    </div>
  );
}