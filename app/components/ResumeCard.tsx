import type { JSX } from "react";
import { Link } from "react-router";
import ScoreCircle from "./ScoreCircle";
import type { Resume } from "../../types/index.d";

const ResumeCard: ({
  resume: { id, companyName, jobTitle, jobDescription, status, createdAt, feedback, imagePath },
}: {
  resume: Resume;
}) => JSX.Element = ({
  resume: { id, companyName, jobTitle, jobDescription, status, createdAt, feedback, imagePath },
}: {
  resume: Resume;
}) => {
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
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' };
      case 'analyzing':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Analyzing...' };
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' };
      case 'failed':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Unknown' };
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
    <Link
      to={`/analyze/${id}`}
      className="resume-card animate-in fade-in duration-1000 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}>
            {statusBadge.label}
          </span>
          {createdAt && (
            <span className="text-xs text-gray-500">
              {formatDate(createdAt)}
            </span>
          )}
        </div>
        <div className="flex-shrink-0">
          <ScoreCircle score={feedback.overallScore} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="!text-black font-bold break-words text-xl group-hover:text-blue-600 transition-colors">
          {companyName || 'No Company'}
        </h2>
        <h3 className="text-base break-words text-gray-600 font-medium">
          {jobTitle || 'No Job Title'}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-3 mt-1 leading-relaxed">
          {truncateDescription(jobDescription)}
        </p>
      </div>

      {/* Quick Stats */}
      {status === 'completed' && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-600">ATS: {feedback.ATS.score}%</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-600">Content: {feedback.content.score}%</span>
            </div>
          </div>
          <div className="text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
            View Details →
          </div>
        </div>
      )}
    </Link>
  );
};

export default ResumeCard;
