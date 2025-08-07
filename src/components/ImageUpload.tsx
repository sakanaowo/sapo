"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { XIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
    onChange: (url: string) => void;
    value: string;
    endpoint: "productImageUploader";
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
                console.log("Upload complete:", res); // Log này sẽ hiện trong browser
                onChange(res?.[0].url);
            }}
            onUploadError={(error: Error) => {
                console.log("Upload error:", error); // Log này cũng hiện trong browser
                toast.error("Failed to upload image");
            }}
            onUploadBegin={() => {
                console.log("Upload started"); // Log khi bắt đầu upload
            }}
        />
    );
}
export default ImageUpload;