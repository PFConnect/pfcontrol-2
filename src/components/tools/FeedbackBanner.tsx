import { useState } from 'react';
import { Star, Check, X, MessageCircle } from 'lucide-react';
import { submitFeedback } from '../../utils/fetch/feedback';
import Button from '../common/Button';
import Toast from '../common/Toast';

interface FeedbackBannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackBanner({
  isOpen,
  onClose,
}: FeedbackBannerProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) return;

    try {
      setIsSubmitting(true);
      await submitFeedback(rating, comment.trim() || undefined);
      setIsSubmitted(true);

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      document.cookie = `feedback_submitted=true; expires=${expiryDate.toUTCString()}; path=/`;

      setTimeout(() => {
        onClose();
        setTimeout(() => {
          setRating(0);
          setHoveredRating(0);
          setComment('');
          setShowComment(false);
          setIsSubmitted(false);
          setIsSubmitting(false);
        }, 300);
      }, 1500);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setToast({
        message: 'Failed to submit feedback. Please try again later.',
        type: 'error',
      });
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting || isSubmitted) return;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    document.cookie = `feedback_dismissed=true; expires=${expiryDate.toUTCString()}; path=/`;

    onClose();
    setTimeout(() => {
      setRating(0);
      setHoveredRating(0);
      setComment('');
      setShowComment(false);
    }, 300);
  };

  if (!isOpen) return null;

  const DesktopFeedback = () => (
    <div className="fixed bottom-4 z-40 w-1/3 left-1/2 transform -translate-x-1/2">
      <div className="relative">
        <div
          className="transition-all duration-300 ease-in-out"
          style={{
            maxHeight: isSubmitted ? '60px' : showComment ? '300px' : '120px',
          }}
        >
          <div className={showComment && !isSubmitted ? 'space-y-3' : ''}>
            {/* Main feedback section */}
            <div className="backdrop-blur-lg border-2 rounded-3xl px-6 py-0 h-24 flex flex-row items-center justify-between bg-zinc-900/80 border-zinc-700/50">
              {isSubmitted ? (
                <div className="flex items-center justify-center space-x-2 w-full">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-white text-sm font-medium">
                    Thanks for your feedback!
                  </span>
                </div>
              ) : (
                <div className="flex flex-row items-center justify-between w-full">
                  {/* Left */}
                  <div className="flex flex-col justify-center text-left mt-1">
                    <span className="text-white text-md font-medium mb-1">
                      How's your experience?
                    </span>
                    <span className="text-zinc-400 text-xs mb-2">
                      You can leave a comment with the chat icon.
                    </span>
                  </div>

                  {/* Middle */}
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={`star-${star}`}
                        type="button"
                        className="transition-all duration-200 hover:scale-110"
                        onClick={() => setRating(star)}
                        disabled={isSubmitting}
                        tabIndex={0}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors duration-200 ${
                            star <= rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-zinc-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Right */}
                  <div className="flex justify-end items-center space-x-3">
                    <button
                      onClick={() => setShowComment(!showComment)}
                      className="w-8 h-8 rounded-full backdrop-blur-lg border bg-zinc-900/80 border-zinc-700/50 flex items-center justify-center transition-all duration-300 ease-in-out hover:bg-zinc-800/80"
                      disabled={isSubmitting}
                      aria-label="Add comment"
                    >
                      <MessageCircle className="h-5 w-5 text-zinc-400" />
                    </button>

                    <Button
                      onClick={handleSubmit}
                      disabled={rating === 0 || isSubmitting}
                      size="icon"
                      className="w-8 h-8 flex items-center justify-center"
                      aria-label="Submit feedback"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-5 h-5 text-green-400" />
                      )}
                    </Button>

                    <button
                      onClick={handleClose}
                      className="text-zinc-400 hover:text-white transition-colors"
                      disabled={isSubmitting}
                      aria-label="Close feedback"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {showComment && !isSubmitted && (
              <div className="backdrop-blur-lg border-2 rounded-2xl px-4 py-3 bg-zinc-900/80 border-zinc-700/50">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-zinc-400" />
                    <label className="text-md text-zinc-300 font-medium">
                      Tell us more (optional)
                    </label>
                  </div>
                  <div className="relative">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value.slice(0, 500))}
                      placeholder="What did you like? What could we improve?"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:border-zinc-700 focus:outline-none resize-none text-md"
                      rows={4}
                      maxLength={500}
                      disabled={isSubmitting}
                    />
                    <div className="absolute right-6 bottom-5 text-xs text-zinc-500 pointer-events-none">
                      {comment.length}/500
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const MobileFeedback = () => (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4">
      <div className="relative">
        <div
          className="transition-all duration-300 ease-in-out"
          style={{
            maxHeight: isSubmitted ? '80px' : showComment ? '350px' : '160px',
          }}
        >
          <div className={showComment && !isSubmitted ? 'space-y-3' : ''}>
            {/* Main feedback section */}
            <div className="backdrop-blur-lg border-2 rounded-3xl px-4 py-4 bg-zinc-900/80 border-zinc-700/50 space-y-4">
              {isSubmitted ? (
                <div className="flex items-center justify-center space-x-2 w-full">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-white text-sm font-medium">
                    Thanks for your feedback!
                  </span>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-center relative">
                    <span className="text-white text-md font-medium">
                      How's your experience?
                    </span>
                    <button
                      onClick={handleClose}
                      className="absolute right-0 text-zinc-400 hover:text-white transition-colors"
                      disabled={isSubmitting}
                      aria-label="Close feedback"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Stars */}
                  <div className="flex justify-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={`star-${star}`}
                        type="button"
                        className="transition-all duration-200 hover:scale-110"
                        onClick={() => setRating(star)}
                        disabled={isSubmitting}
                        tabIndex={0}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors duration-200 ${
                            star <= rating
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-zinc-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-center items-center space-x-3">
                    <button
                      onClick={() => setShowComment(!showComment)}
                      className="w-10 h-10 rounded-full backdrop-blur-lg border bg-zinc-900/80 border-zinc-700/50 flex items-center justify-center transition-all duration-300 ease-in-out hover:bg-zinc-800/80"
                      disabled={isSubmitting}
                      aria-label="Add comment"
                    >
                      <MessageCircle className="h-5 w-5 text-zinc-400" />
                    </button>

                    <Button
                      onClick={handleSubmit}
                      disabled={rating === 0 || isSubmitting}
                      size="icon"
                      className="w-10 h-10 flex items-center justify-center"
                      aria-label="Submit feedback"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-5 h-5 text-green-400" />
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {showComment && !isSubmitted && (
              <div className="backdrop-blur-lg border-2 rounded-2xl px-4 py-3 bg-zinc-900/80 border-zinc-700/50">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-zinc-400" />
                    <label className="text-sm text-zinc-300 font-medium">
                      Tell us more (optional)
                    </label>
                  </div>
                  <div className="relative">
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value.slice(0, 500))}
                      placeholder="What did you like? What could we improve?"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:border-zinc-700 focus:outline-none resize-none text-sm"
                      rows={4}
                      maxLength={500}
                      disabled={isSubmitting}
                    />
                    <div className="absolute right-3 bottom-2 text-xs text-zinc-500 pointer-events-none">
                      {comment.length}/500
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:block">
        <DesktopFeedback />
      </div>

      <div className="block md:hidden">
        <MobileFeedback />
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
