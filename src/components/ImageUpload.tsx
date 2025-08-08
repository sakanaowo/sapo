"use client";

import { UploadDropzone } from "@/lib/uploadthing";
import { XIcon } from "lucide-react";
import { toast } from "sonner";
import "@uploadthing/react/styles.css";
import Image from "next/image";
import "@uploadthing/react/styles.css";

interface ImageUploadProps {
    onChange: (url: string) => void;
    value: string;
    endpoint: "postImage";
}

function ImageUpload({ endpoint, onChange, value }: ImageUploadProps) {
    if (value) {
        return (
            <div className="relative w-full h-auto">
                <Image
                    src={value}
                    alt="Upload"
                    className="rounded-md object-cover"
                    width={400}
                    height={400}
                />

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