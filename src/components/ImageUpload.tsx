"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";

interface CustomImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    disabled?: boolean;
    maxSizeMB?: number;
    acceptedTypes?: string[];
}

export default function ImageUpload({
    value,
    onChange,
    disabled = false,
    maxSizeMB = 4, // Match with UploadThing config
    acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
}: CustomImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UploadThing hook
    const { startUpload } = useUploadThing("postImage", {
        onClientUploadComplete: (res) => {
            if (res && res[0]) {
                onChange(res[0].url);
                toast.success("Tải ảnh thành công!");
            }
            setIsLoading(false);
        },
        onUploadError: (error) => {
            console.error("Upload error:", error);
            toast.error(`Tải ảnh thất bại: ${error.message}`);
            setIsLoading(false);
        },
    });

    const validateFile = (file: File): boolean => {
        // Check file type
        if (!acceptedTypes.includes(file.type)) {
            toast.error(`Chỉ hỗ trợ file: ${acceptedTypes.map(type => type.split('/')[1]).join(', ')}`);
            return false;
        }

        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            toast.error(`Kích thước file không được vượt quá ${maxSizeMB}MB`);
            return false;
        }

        return true;
    };

    const handleFileUpload = async (file: File) => {
        if (!validateFile(file)) return;

        setIsLoading(true);
        try {
            // Use UploadThing to upload the file
            await startUpload([file]);
            // Note: onClientUploadComplete callback will handle success
            // and onUploadError will handle errors
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Tải ảnh thất bại. Vui lòng thử lại!");
            setIsLoading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (disabled || isLoading) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled && !isLoading) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    const handleRemove = () => {
        onChange("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const openFileDialog = () => {
        if (!disabled && !isLoading) {
            fileInputRef.current?.click();
        }
    };

    // If there's already an image
    if (value) {
        return (
            <div className="relative group">
                <div className="relative w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <Image
                        src={value}
                        alt="Uploaded image"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />

                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={openFileDialog}
                            disabled={disabled || isLoading}
                            className="bg-white/90 hover:bg-white text-gray-900"
                        >
                            <Upload className="h-4 w-4 mr-1" />
                            Thay đổi
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleRemove}
                            disabled={disabled || isLoading}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Xóa
                        </Button>
                    </div>
                </div>

                {/* Hidden file input */}
                <Input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedTypes.join(",")}
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={disabled || isLoading}
                />
            </div>
        );
    }

    // Upload area
    return (
        <div
            className={`
        relative w-full h-48 border-2 border-dashed rounded-lg transition-colors cursor-pointer
        ${isDragging
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400 bg-gray-50/50"
                }
        ${disabled || isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}
      `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={openFileDialog}
        >
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                {isLoading ? (
                    <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                        <p className="text-sm text-gray-600">Đang tải ảnh...</p>
                    </>
                ) : (
                    <>
                        <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
                        <p className="text-sm font-medium text-gray-900 mb-1">
                            {isDragging ? "Thả ảnh vào đây" : "Tải ảnh lên"}
                        </p>
                        <p className="text-xs text-gray-600 mb-3">
                            Kéo thả hoặc nhấn để chọn ảnh
                        </p>
                        <p className="text-xs text-gray-500">
                            Hỗ trợ: JPG, PNG, WebP, GIF (tối đa {maxSizeMB}MB)
                        </p>
                    </>
                )}
            </div>

            {/* Hidden file input */}
            <Input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes.join(",")}
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled || isLoading}
            />
        </div>
    );
}
