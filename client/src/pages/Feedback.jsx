import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { Star } from "lucide-react";

export default function Feedback() {
  const [username, setUsername] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!username.trim() || rating === 0 || !content.trim()) {
      setError("Please provide your name, a star rating, and a review.");
      return;
    }

    setIsSubmitting(true);
    try {
      await API.post("/testimonials", { username, rating, content });
      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      setError("Failed to submit feedback. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative z-10 font-sans">
      <div className="w-full max-w-md bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[24px] p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Leave a Review</h1>
          <p className="text-zinc-400 text-sm">
            What do you think of Sora? Your feedback will be displayed on our landing page!
          </p>
        </div>

        {success ? (
          <div className="bg-[#d2dbbd]/10 border border-[#d2dbbd]/30 rounded-xl p-6 text-center">
            <h3 className="text-[#d2dbbd] font-medium text-lg mb-2">Thank you!</h3>
            <p className="text-zinc-400 text-sm">Your testimonial has been published. Redirecting to home...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Your Name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-[#d2dbbd]/50 focus:border-[#d2dbbd] text-white transition-all outline-none placeholder:text-zinc-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={`transition-colors ${
                        star <= (hoverRating || rating)
                          ? "fill-[#d2dbbd] text-[#d2dbbd]"
                          : "fill-transparent text-zinc-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Review</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="The technical lobby was incredibly responsive..."
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl focus:ring-2 focus:ring-[#d2dbbd]/50 focus:border-[#d2dbbd] text-white transition-all outline-none placeholder:text-zinc-600 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#d2dbbd] hover:bg-[#c1caa7] text-black font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isSubmitting ? "Publishing..." : "Publish Testimonial"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
