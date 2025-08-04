// import { createUploadthing, type FileRouter } from "uploadthing/next";
// import { UploadThingError } from "uploadthing/server";
// import { currentUser } from "@/actions/user.action";

// const f = createUploadthing();

// // Real auth function
// const auth = async (req: Request) => {
//     try {
//         const user = await currentUser();
//         return user;
//     } catch (error) {
//         console.error("Auth error in uploadthing:", error);
//         return null;
//     }
// };

// // FileRouter for your app, can contain multiple FileRoutes
// export const ourFileRouter = {
//     // Product image uploader
//     productImageUploader: f({
//         image: {
//             maxFileSize: "8MB",
//             maxFileCount: 1,
//         },
//     })
//         .middleware(async ({ req }) => {
//             // This code runs on your server before upload
//             const user = await auth(req);

//             // If you throw, the user will not be able to upload
//             if (!user) {
//                 throw new UploadThingError("Unauthorized - Please login to upload images");
//             }

//             // Whatever is returned here is accessible in onUploadComplete as `metadata`
//             return {
//                 userId: user.adminId.toString(),
//                 username: user.username,
//                 uploadedAt: new Date().toISOString()
//             };
//         })
//         .onUploadComplete(async ({ metadata, file }) => {
//             // This code RUNS ON YOUR SERVER after upload
//             console.log("Product image upload complete:", {
//                 userId: metadata.userId,
//                 username: metadata.username,
//                 fileUrl: file.url,
//                 fileName: file.name,
//                 fileSize: file.size,
//                 uploadedAt: metadata.uploadedAt
//             });

//             // Log to database if needed (optional)
//             // await logUpload({ userId: metadata.userId, fileUrl: file.url });

//             // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
//             return {
//                 uploadedBy: metadata.userId,
//                 fileUrl: file.url,
//                 message: "Upload successful!"
//             };
//         }),

//     // Avatar uploader (for future use)
//     avatarUploader: f({
//         image: {
//             maxFileSize: "2MB",
//             maxFileCount: 1,
//         },
//     })
//         .middleware(async ({ req }) => {
//             const user = await auth(req);

//             if (!user) {
//                 throw new UploadThingError("Unauthorized");
//             }

//             return { userId: user.adminId.toString() };
//         })
//         .onUploadComplete(async ({ metadata, file }) => {
//             console.log("Avatar upload complete for userId:", metadata.userId);
//             console.log("file url", file.url);

//             return { uploadedBy: metadata.userId };
//         }),
// } satisfies FileRouter;

// export type OurFileRouter = typeof ourFileRouter;

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { currentUser } from "@clerk/nextjs/server";

const f = createUploadthing();

export const ourFileRouter = {
    productImageUploader: f({
        image: {
            maxFileSize: "8MB",
            maxFileCount: 1,
        },
    })
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .middleware(async ({ req }) => {
            const user = await currentUser();

            if (!user) {
                throw new UploadThingError("Unauthorized - Please login to upload images");
            }

            return {
                userId: user.id,
                username: user.username,
                uploadedAt: new Date().toISOString()
            };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            console.log("Product image upload complete:", {
                userId: metadata.userId,
                username: metadata.username,
                fileUrl: file.url,
                fileName: file.name,
                fileSize: file.size,
                uploadedAt: metadata.uploadedAt
            });

            return {
                uploadedBy: metadata.userId,
                fileUrl: file.url,
                message: "Upload successful!"
            };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;