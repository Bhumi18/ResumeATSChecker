import { useCallback, useRef, useState } from 'react';
import { formatSize } from '../lib/utils';

interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isHovered, setIsHovered] = useState(false);
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
    <div
      className="w-full gradient-border transition-all duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxShadow: isHovered ? '0 20px 40px -10px rgba(0, 0, 0, 0.15)' : 'none',
        transform: isHovered ? 'scale(1.01)' : 'scale(1)',
      }}
    >
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
        className={`upload-zone rounded-2xl p-8 relative overflow-hidden ${isDragActive ? 'drag-active' : ''}`}
      >
        {/* Animated background gradient */}
        <div
          className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.02) 0%, transparent 50%, rgba(17, 24, 39, 0.02) 100%)',
            backgroundSize: '200% 200%',
            animation: isDragActive ? 'gradient-shift 2s ease infinite' : 'none',
            opacity: isDragActive || isHovered ? 1 : 0,
          }}
        />

        {/* Pulsing border effect when dragging */}
        {isDragActive && (
          <div className="absolute inset-0 rounded-2xl border-2 border-gray-600 animate-pulse pointer-events-none" />
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".doc,.docx"
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="space-y-4 cursor-pointer relative z-10">
          {file ? (
            <div
              className="uploader-selected-file animate-in fade-in slide-in-from-bottom-4 duration-500"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="p-3 bg-green-100 rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-3"
                style={{
                  boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)',
                }}
              >
                <svg className="size-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex items-center space-x-3 flex-1 ml-3">
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
                className="p-2 cursor-pointer rounded-lg transition-all duration-300 hover:bg-red-100 hover:scale-125 hover:rotate-12 group"
                onClick={clearSelectedFile}
              >
                <svg
                  className="w-5 h-5 text-ink-400 group-hover:text-red-500 transition-colors duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="py-4">
              <div
                className={`mx-auto w-20 h-20 flex items-center justify-center mb-4 rounded-full transition-all duration-500 ${
                  isDragActive ? 'bg-gray-200' : 'bg-gray-100'
                }`}
                style={{
                  transform: isDragActive ? 'scale(1.2) rotate(10deg)' : isHovered ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: isDragActive ? '0 0 30px rgba(17, 24, 39, 0.2)' : 'none',
                }}
              >
                <svg
                  className={`w-10 h-10 transition-all duration-500 ${
                    isDragActive ? 'text-ink-700' : 'text-ink-400'
                  }`}
                  style={{
                    transform: isDragActive ? 'translateY(-5px)' : 'translateY(0)',
                    animation: isDragActive ? 'float 1s ease-in-out infinite' : 'none',
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <p
                className={`text-lg transition-all duration-300 ${
                  isDragActive ? 'text-ink-800 scale-105' : 'text-ink-500'
                }`}
              >
                <span className="font-semibold text-ink-700 hover:text-ink-900 transition-colors cursor-pointer">
                  Click to upload
                </span>{' '}
                or drag and drop
              </p>
              <p className="text-lg text-ink-400 mt-1">Word Document (.doc, .docx)</p>
              <p className="text-sm text-ink-400 mt-2">Max size: {formatSize(maxFileSize)}</p>
              {errorMessage && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300 shake">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-700 font-medium">
                      {errorMessage}
                    </p>
                  </div>
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
