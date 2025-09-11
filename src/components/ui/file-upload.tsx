// src/components/ui/file-upload.tsx
"use client";

import * as React from "react";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface FileUploadProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onFileChange: (file: File | null) => void;
  label?: string;
  dataAiHint?: string;
  initialFile?: File | string;
}

export function FileUpload({ onFileChange, label, className, dataAiHint, initialFile, ...props }: FileUploadProps) {
  const [file, setFile] = React.useState<File | null>(initialFile instanceof File ? initialFile : null);
  const [preview, setPreview] = React.useState<string | null>(typeof initialFile === 'string' ? initialFile : null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (initialFile) {
      if (initialFile instanceof File) {
        setFile(initialFile);
        if (initialFile.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => setPreview(reader.result as string);
          reader.readAsDataURL(initialFile);
        }
      } else {
        setPreview(initialFile); // Assuming it's a URL
        // Cannot reconstruct file object from URL
        setFile(null);
      }
    }
  }, [initialFile]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    onFileChange(selectedFile);

    if (selectedFile) {
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null); // Not an image, no preview
      }
    } else {
      setPreview(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreview(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset the input
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      {!file && !preview ? (
         <div
          className="flex items-center justify-center w-full p-4 border-2 border-dashed rounded-lg cursor-pointer border-input hover:border-primary transition-colors bg-background"
          onClick={() => fileInputRef.current?.click()}
          data-ai-hint={dataAiHint || "file upload"}
        >
          <div className="text-center">
            <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-semibold text-primary">Click or drag</span> to upload
            </p>
            <Input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              {...props}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center p-2 space-x-3 border rounded-lg border-input bg-card">
          {(preview && file?.type.startsWith("image/")) || (preview && typeof initialFile === 'string') ? (
            <img src={preview} alt="File preview" data-ai-hint="image preview" className="object-cover w-12 h-12 rounded-md" />
          ) : (
            <div className="flex items-center justify-center w-12 h-12 rounded-md bg-muted">
                <FileIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{file?.name || 'File Uploaded'}</p>
            {file && <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>}
          </div>
          <Button variant="ghost" size="icon" onClick={handleRemoveFile} aria-label="Remove file">
            <X className="w-5 h-5 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  );
}
