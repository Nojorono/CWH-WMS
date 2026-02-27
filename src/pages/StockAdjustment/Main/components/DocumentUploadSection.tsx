import React from "react";
import {
  FaFileAlt,
  FaTrash,
  FaCloudUploadAlt,
  FaExternalLinkAlt,
} from "react-icons/fa";

interface DocumentUploadSectionProps {
  documentUrls: string[];
  isDetailMode: boolean;
  isUploading: boolean;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDelete: (url: string) => void;
}

const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
  documentUrls,
  isDetailMode,
  isUploading,
  onFileUpload,
  onFileDelete,
}) => {
  return (
    <div className="flex items-start mb-6">
      <label className="w-32 font-bold pt-2">Dokumen</label>
      <div className="flex-1">
        {documentUrls.length === 0 && isDetailMode && (
          <span className="text-gray-400 italic pt-2 block">
            Tidak ada dokumen dilampirkan
          </span>
        )}

        {!isDetailMode && (
          <div className="relative mb-2">
            <input
              type="file"
              onChange={onFileUpload}
              className="hidden"
              id="file-upload"
              multiple
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className={`flex items-center justify-center gap-2 w-max px-4 py-2 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                isUploading ? "opacity-50" : "border-gray-300 text-gray-600"
              }`}
            >
              <FaCloudUploadAlt className="text-xl" />
              {isUploading
                ? "Uploading..."
                : "Click to upload document (Max 2MB)"}
            </label>
          </div>
        )}

        {documentUrls.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {documentUrls.map((url, idx) => (
              <div
                key={url}
                className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-md w-max"
              >
                <FaFileAlt className="text-blue-500 text-lg" />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 font-medium hover:underline flex items-center gap-1"
                >
                  Document {idx + 1}
                  <FaExternalLinkAlt className="text-[10px]" />
                </a>
                {!isDetailMode && (
                  <button
                    type="button"
                    onClick={() => onFileDelete(url)}
                    className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                    title="Hapus file"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUploadSection;
