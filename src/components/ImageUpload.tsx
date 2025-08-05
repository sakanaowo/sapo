// "use client";

// import { UploadDropzone } from "@uploadthing/react";
// import { OurFileRouter } from "@/app/api/uploadthing/core";
// import { toast } from "sonner";
// import { Button } from "@/components/ui/button";
// import { X, Loader2 } from "lucide-react";
// import Image from "next/image";
// import { useState } from "react";

// interface UploadThingImageProps {
//     value?: string;
//     onChange: (url: string) => void;
//     onRemove: () => void;
//     disabled?: boolean;
//     className?: string;
// }

// export function UploadThingImage({
//     value,
//     onChange,
//     onRemove,
//     disabled = false,
//     className = ""
// }: UploadThingImageProps) {
//     const [isUploading, setIsUploading] = useState(false);

//     if (value) {
//         return (
//             <div className={`relative group ${className}`}>
//                 <div className="relative aspect-square border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-gray-50">
//                     <Image
//                         src={value}
//                         alt="Product preview"
//                         fill
//                         className="object-cover"
//                     />
//                     <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
//                         <Button
//                             type="button"
//                             variant="destructive"
//                             size="sm"
//                             className="h-8 w-8 rounded-full p-0"
//                             onClick={onRemove}
//                             disabled={disabled || isUploading}
//                         >
//                             <X className="h-4 w-4" />
//                         </Button>
//                     </div>
//                     {isUploading && (
//                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
//                             <Loader2 className="h-8 w-8 text-white animate-spin" />
//                         </div>
//                     )}
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className={className}>
//             <UploadDropzone<OurFileRouter, "productImageUploader">
//                 endpoint="productImageUploader"
//                 onClientUploadComplete={(res) => {
//                     if (res?.[0]) {
//                         onChange(res[0].url);
//                         toast.success("Upload ảnh thành công!");
//                         setIsUploading(false);
//                     }
//                 }}
//                 onUploadError={(error: Error) => {
//                     console.error("Upload error:", error);
//                     toast.error(`Upload thất bại: ${error.message}`);
//                     setIsUploading(false);
//                 }}
//                 onUploadBegin={() => {
//                     setIsUploading(true);
//                     toast.info("Đang tải ảnh lên...");
//                 }}
//                 onUploadProgress={(progress) => {
//                     // Optional: show progress
//                     console.log("Upload progress:", progress);
//                 }}
//                 disabled={disabled || isUploading}
//                 appearance={{
//                     container: "border-2 border-dashed border-blue-300 bg-blue-50/30 hover:border-blue-400 transition-colors",
//                     uploadIcon: "text-blue-600",
//                     label: "text-blue-600 font-medium hover:text-blue-700",
//                     allowedContent: "text-blue-500 text-sm",
//                     button: "bg-blue-600 hover:bg-blue-700 text-white transition-colors ut-ready:bg-blue-600 ut-uploading:bg-blue-400",
//                 }}
//                 content={{
//                     label: isUploading ? "Đang tải lên..." : "Chọn ảnh hoặc kéo thả vào đây",
//                     allowedContent: "Ảnh (tối đa 8MB)",
//                     button: isUploading ? "Đang tải..." : "Chọn ảnh",
//                 }}
//             />
//         </div>
//     );
// }
"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { XIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
    onChange: (url: string) => void;
    value: string;
    endpoint: "postImage";
}

function ImageUpload({ endpoint, onChange, value }: ImageUploadProps) {
    if (value) {
        return (
            <div className="relative size-40">
                <img src={value} alt="Upload" className="rounded-md size-40 object-cover" />
                <button
                    onClick={() => onChange("")}
                    className="absolute top-0 right-0 p-1 bg-red-500 rounded-full shadow-sm"
                    type="button"
                >
                    <XIcon className="h-4 w-4 text-white" />
                </button>
            </div>
        );
    }
    return (
        <UploadDropzone
            endpoint={endpoint}
            onClientUploadComplete={(res) => {
                onChange(res?.[0].url);
            }}
            onUploadError={(error: Error) => {
                console.log(error);
                toast.error("Failed to upload image");
            }}
        />
    );
}
export default ImageUpload;