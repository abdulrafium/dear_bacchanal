import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

// FileRouter for your app
export const ourFileRouter = {
  // Image uploader for book pages
  bookImageUploader: f({
    image: {
      maxFileSize: "32MB",
      maxFileCount: 4,
    },
  })
    .middleware(async ({ req }) => {
      // You can add authentication here if needed
      // For now, we'll allow all uploads

      // Return metadata to be available in onUploadComplete
      return {
        userId: "user",
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on your server after upload
      console.log("Upload complete for user:", metadata.userId);
      console.log("File info:", file);

      // Return data to be sent to the client
      return { uploadedBy: metadata.userId };
    }),

  // PDF uploader for the entire book
  bookPdfUploader: f({
    pdf: {
      maxFileSize: "128MB",
      maxFileCount: 2,
    },
  })
    .middleware(async ({ req }) => {
      return {
        userId: "user",
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Book PDF uploaded for user:", metadata.userId);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Sticker uploader for global catalog
  stickerUploader: f({
    image: {
      maxFileSize: "16MB",
      maxFileCount: 100,
    },
  })
    .middleware(async () => {
      // Allow general uploads for admin stickers right now
      return { userId: "admin" };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;