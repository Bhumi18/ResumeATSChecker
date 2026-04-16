import type { JSX, ReactNode } from "react";
import { Link } from "react-router";
import { useState } from "react";
import ScoreCircle from "./ScoreCircle";
import type { Resume } from "../../types/index.d";

const ResumeCard: ({
  resume: { id, companyName, jobTitle, jobDescription, status, createdAt, feedback, imagePath },
  index,
  footerActions,
}: {
  resume: Resume;
  index?: number;
  footerActions?: ReactNode;
}) => JSX.Element = ({
  resume: { id, companyName, jobTitle, jobDescription, status, createdAt, feedback, imagePath },
  index = 0,
  footerActions,
}: {
  resume: Resume;
  index?: number;
  footerActions?: ReactNode;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Handle mouse move for 3D tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x, y });
  };

  // Truncate description to ~150 characters
  const truncateDescription = (text: string | undefined, maxLength: number = 150) => {
    if (!text) return "No description provided";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "...";
  };

  // Get status badge styling
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed', glow: 'rgba(34, 197, 94, 0.3)' };
      case 'analyzing':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Analyzing...', glow: 'rgba(59, 130, 246, 0.3)' };
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending', glow: 'rgba(234, 179, 8, 0.3)' };
      case 'failed':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed', glow: 'rgba(239, 68, 68, 0.3)' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Unknown', glow: 'rgba(107, 114, 128, 0.3)' };
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const statusBadge = getStatusBadge(status);

  return (
    <div
      className="resume-card group border border-gray-200 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      onMouseMove={handleMouseMove}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${mousePosition.y * -8}deg) rotateY(${mousePosition.x * 8}deg) translateY(-8px) scale(1.02)`
          : 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)',
        transition: 'all 0.3s cubic-bezier(0.03, 0.98, 0.52, 0.99)',
        boxShadow: isHovered
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 30px rgba(17, 24, 39, 0.1)'
          : '0 1px 3px rgba(0, 0, 0, 0.1)',
        animationDelay: `${index * 0.1}s`,
      }}
    >
      {/* Animated gradient overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none"
        style={{
          opacity: isHovered ? 0.05 : 0,
          background: `radial-gradient(circle at ${(mousePosition.x + 0.5) * 100}% ${(mousePosition.y + 0.5) * 100}%, rgba(17, 24, 39, 0.1), transparent 50%)`,
        }}
      />

      {/* Shine effect on hover */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.4) 45%, rgba(255, 255, 255, 0.2) 50%, transparent 55%)',
          transform: isHovered ? 'translateX(100%)' : 'translateX(-100%)',
        }}
      />

      <Link to={`/analyze/${id}`} className="block relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${statusBadge.bg} ${statusBadge.text}`}
              style={{
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isHovered ? `0 0 15px ${statusBadge.glow}` : 'none',
              }}
            >
              {status === 'analyzing' && (
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1.5 animate-pulse" />
              )}
              {statusBadge.label}
            </span>
            {createdAt && (
              <span className="text-xs text-ink-400 transition-all duration-300 group-hover:text-ink-600">
                {formatDate(createdAt)}
              </span>
            )}
          </div>
          <div className="flex-shrink-0 transition-all duration-500">
            <ScoreCircle score={feedback.overallScore} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2
            className="text-ink-900 font-bold break-words text-xl transition-all duration-300 group-hover:text-ink-700"
            style={{
              transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
            }}
          >
            {companyName || 'No Company'}
          </h2>
          <h3
            className="text-base break-words text-ink-500 font-medium transition-all duration-300 group-hover:text-ink-700"
            style={{
              transform: isHovered ? 'translateX(6px)' : 'translateX(0)',
              transitionDelay: '0.05s',
            }}
          >
            {jobTitle || 'No Job Title'}
          </h3>
          <p
            className="text-sm text-ink-400 line-clamp-3 mt-1 leading-relaxed transition-all duration-300 group-hover:text-ink-500"
            style={{
              transform: isHovered ? 'translateX(8px)' : 'translateX(0)',
              transitionDelay: '0.1s',
            }}
          >
            {truncateDescription(jobDescription)}
          </p>
        </div>

        {/* Quick Stats */}
        {status === 'completed' && (
          <div
            className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs transition-all duration-300"
            style={{
              borderColor: isHovered ? 'rgba(17, 24, 39, 0.1)' : undefined,
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-300"
                style={{
                  background: isHovered ? 'rgba(17, 24, 39, 0.05)' : 'transparent',
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                <svg className="w-4 h-4 text-ink-400 transition-colors duration-300 group-hover:text-ink-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                <span className="text-ink-500 transition-colors duration-300 group-hover:text-ink-700 font-medium">ATS: {feedback.ATS.score}%</span>
              </div>
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-300"
                style={{
                  background: isHovered ? 'rgba(17, 24, 39, 0.05)' : 'transparent',
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  transitionDelay: '0.05s',
                }}
              >
                <svg className="w-4 h-4 text-ink-400 transition-colors duration-300 group-hover:text-ink-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-ink-500 transition-colors duration-300 group-hover:text-ink-700 font-medium">Content: {feedback.content.score}%</span>
              </div>
            </div>
            <div
              className="text-ink-700 font-medium flex items-center gap-1 transition-all duration-300 group-hover:text-ink-900"
              style={{
                transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
              }}
            >
              <span>View</span>
              <svg
                className="w-4 h-4 transition-all duration-300"
                style={{
                  transform: isHovered ? 'translateX(6px)' : 'translateX(0)',
                }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}
      </Link>

      {footerActions && (
        <div className="relative z-10 mt-3 border-t border-gray-100 pt-3 flex justify-end">
          {footerActions}
        </div>
      )}
    </div>
  );
};

export default ResumeCard;
