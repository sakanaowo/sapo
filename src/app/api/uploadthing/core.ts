// import { createUploadthing, type FileRouter } from "uploadthing/next";
// import { UploadThingError } from "uploadthing/server";
// import { currentUser } from "@clerk/nextjs/server";

// const f = createUploadthing();

// export const ourFileRouter = {
//     productImageUploader: f({
//         image: {
//             maxFileSize: "8MB",
//             maxFileCount: 1,
//         },
//     })
//         // eslint-disable-next-line @typescript-eslint/no-unused-vars
//         .middleware(async ({ req }) => {
//             const user = await currentUser();

//             if (!user) {
//                 throw new UploadThingError("Unauthorized - Please login to upload images");
//             }

//             return {
//                 userId: user.id,
//                 username: user.username,
//                 uploadedAt: new Date().toISOString()
//             };
//         })
//         .onUploadComplete(async ({ metadata, file }) => {
//             console.log("Product image upload complete:", {
//                 userId: metadata.userId,
//                 username: metadata.username,
//                 fileUrl: file.url,
//                 fileName: file.name,
//                 fileSize: file.size,
//                 uploadedAt: metadata.uploadedAt
//             });

//             return {
//                 uploadedBy: metadata.userId,
//                 fileUrl: file.url,
//                 message: "Upload successful!"
//             };
//         }),
// } satisfies FileRouter;

// export type OurFileRouter = typeof ourFileRouter;

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
    // define routes for different upload types
    postImage: f({
        image: {
            maxFileSize: "8MB",
            maxFileCount: 1,
        },
    })
        .middleware(async () => {
            // this code runs on your server before upload
            const { userId } = await auth();
            if (!userId) throw new Error("Unauthorized");

            // whatever is returned here is accessible in onUploadComplete as `metadata`
            return { userId };
        })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .onUploadComplete(async ({ metadata, file }) => {
            try {
                return { fileUrl: file.url };
            } catch (error) {
                console.error("Error in onUploadComplete:", error);
                throw error;
            }
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;