// src/components/ui/file-upload.tsx
"use client";

import * as React from "react";
import { UploadCloud, File as FileIcon, X } from "lucide-react";
import { Input } from "./input";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface FileUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onFileChange: (file: File | null) => void;
  label?: string;
  dataAiHint?: string;
}

export function FileUpload({ onFileChange, label = "Upload a file", className, dataAiHint, ...props }: FileUploadProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      {!file ? (
         <div
          className="flex items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer border-input hover:border-primary transition-colors bg-background"
          onClick={() => fileInputRef.current?.click()}
          data-ai-hint={dataAiHint || "file upload"}
        >
          <div className="text-center">
            <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">Supported formats: PDF, JPG, PNG, DOCX (Max 5MB)</p>
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
        <div className="flex items-center p-3 space-x-3 border rounded-lg border-input bg-card">
          {preview ? (
            <img src={preview} alt="File preview" data-ai-hint="image preview" className="object-cover w-16 h-16 rounded-md" />
          ) : (
            <FileIcon className="w-12 h-12 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRemoveFile} aria-label="Remove file">
            <X className="w-5 h-5 text-destructive" />
          </Button>
        </div>
      )}
    </div>
  );
}
