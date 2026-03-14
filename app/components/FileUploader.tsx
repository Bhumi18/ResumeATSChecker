import { useCallback, useRef, useState } from 'react';
import { formatSize } from '../lib/utils';

interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const maxFileSize = 20 * 1024 * 1024; // 20MB in bytes

  const validateFile = useCallback((selectedFile: File): string | null => {
    const fileName = selectedFile.name.toLowerCase();

    if (fileName.endsWith('.pdf')) {
      return 'PDF files are not supported. Please upload a Word document (.doc or .docx)';
    }

    const isWordDocument = fileName.endsWith('.doc') || fileName.endsWith('.docx');
    if (!isWordDocument) {
      return 'Invalid file type. Please upload a Word document (.doc or .docx)';
    }

    if (selectedFile.size > maxFileSize) {
      return `File is too large. Maximum size is ${formatSize(maxFileSize)}.`;
    }

    return null;
  }, [maxFileSize]);

  const selectFile = useCallback((selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setErrorMessage('');
      onFileSelect?.(null);
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setFile(null);
      setErrorMessage(validationError);
      onFileSelect?.(null);
      return;
    }

    setFile(selectedFile);
    setErrorMessage('');
    onFileSelect?.(selectedFile);
  }, [onFileSelect, validateFile]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0] || null);
  }, [selectFile]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);

    selectFile(event.dataTransfer.files?.[0] || null);
  }, [selectFile]);

  const clearSelectedFile = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setFile(null);
    setErrorMessage('');
    onFileSelect?.(null);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [onFileSelect]);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div className="w-full gradient-border">
      <div
        onClick={openFilePicker}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragActive(false);
        }}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openFilePicker();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".doc,.docx"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className={`space-y-4 cursor-pointer transition-colors ${isDragActive ? 'opacity-90' : ''}`}>
          {file ? (
            <div className="uploader-selected-file" onClick={(e) => e.stopPropagation()}>
              <svg className="size-10 text-ink-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm font-medium text-ink-700 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-sm text-ink-500">
                    {formatSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                className="p-2 cursor-pointer"
                onClick={clearSelectedFile}
              >
                <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                <img src="/icons/info.svg" alt="upload" className="size-20" />
              </div>
              <p className="text-lg text-ink-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-lg text-ink-500">Word Document (.doc, .docx)</p>
              <p className="text-sm text-ink-400">Max size: {formatSize(maxFileSize)}</p>
              {errorMessage && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">
                    {`❌ ${errorMessage}`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
