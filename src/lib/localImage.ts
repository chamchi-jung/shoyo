export type LocalImageFile = {
  dataUrl: string;
  name: string;
};

const MAX_IMAGE_EDGE = 1600;
const JPEG_QUALITY = 0.82;

export function isLocalImageDataUrl(value: string) {
  return value.startsWith("data:image/");
}

function readImageAsDataUrl(file: File): Promise<LocalImageFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve({ dataUrl: reader.result, name: file.name });
        return;
      }

      reject(new Error("이미지를 읽지 못했습니다."));
    };
    reader.onerror = () => reject(new Error("이미지를 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지를 읽지 못했습니다."));
    };
    image.src = objectUrl;
  });
}

async function readCompressedImageFile(file: File): Promise<LocalImageFile> {
  if (file.type === "image/svg+xml") {
    return readImageAsDataUrl(file);
  }

  const image = await loadImageElement(file);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return readImageAsDataUrl(file);
  }

  canvas.width = width;
  canvas.height = height;
  context.fillStyle = "#f6edd8";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return {
    dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY),
    name: file.name
  };
}

export function readImageFile(file: File | undefined): Promise<LocalImageFile | null> {
  if (!file) {
    return Promise.resolve(null);
  }

  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("이미지 파일만 선택할 수 있습니다."));
  }

  return readCompressedImageFile(file);
}

export async function readImageFiles(files: FileList | null | undefined) {
  const images = await Promise.all(Array.from(files ?? []).map((file) => readImageFile(file)));

  return images.filter((image): image is LocalImageFile => Boolean(image));
}
