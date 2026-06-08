/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Bookmark, 
  Share2, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Check, 
  HelpCircle,
  Hash,
  ArrowRight,
  Eye,
  BookmarkCheck,
  BookOpen
} from "lucide-react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Article, VisualPreferences } from "../types";

interface ArticleViewProps {
  article: Article;
  preferences: VisualPreferences;
  onEditClick: () => void;
}

export default function ArticleView({ 
  article, 
  preferences, 
  onEditClick 
}: ArticleViewProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareNotification, setShowShareNotification] = useState(false);
  const [guideLineTop, setGuideLineTop] = useState(250);
  const [wordCount, setWordCount] = useState(0);
  const articleRef = useRef<HTMLDivElement>(null);

  // Load and save bookmark state
  useEffect(() => {
    const savedBookmark = localStorage.getItem("article_bookmarked");
    if (savedBookmark === "true") {
      setIsBookmarked(true);
    }
  }, []);

  // Recalculate word count for meta info
  useEffect(() => {
    const text = article.content.trim();
    if (!text) {
      setWordCount(0);
      return;
    }
    const words = text.split(/\s+/).length;
    setWordCount(words);
  }, [article.content]);

  const toggleBookmark = () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    localStorage.setItem("article_bookmarked", String(nextState));
  };

  const handleShare = () => {
    const pageUrl = window.location.href;
    navigator.clipboard.writeText(pageUrl).then(() => {
      setShowShareNotification(true);
      setTimeout(() => setShowShareNotification(false), 2500);
    }).catch(() => {
      // Fallback
      alert("Article path copied to clipboard!");
    });
  };

  // Mouse tracking for focus guide overlay
  useEffect(() => {
    if (!preferences.showFocusGuide || !articleRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = articleRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate relative position inside the article card
        const relativeY = e.clientY - rect.top;
        if (relativeY >= 0 && relativeY <= rect.height) {
          setGuideLineTop(relativeY);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [preferences.showFocusGuide]);

  const estimatedReadingTime = Math.max(1, Math.ceil(wordCount / 220));

  // Determine typeface rules based on preferences
  const getTypographyClass = () => {
    if (preferences.fontFamily === "dyslexic") return "font-dyslexia";
    if (preferences.fontFamily === "sans") return "font-reader-sans";
    return "font-serif";
  };

  // Determine font size rules
  const getFontSizeClass = () => {
    switch (preferences.fontSize) {
      case "sm": return "text-sm sm:text-base leading-relaxed";
      case "md": return "text-lg sm:text-xl leading-relaxed";
      case "lg": return "text-xl sm:text-2xl leading-loose";
      case "xl": return "text-2xl sm:text-3xl leading-loose";
      case "base":
      default:
        return "text-base sm:text-lg leading-relaxed";
    }
  };

  return (
    <article 
      ref={articleRef}
      className={`relative mx-auto bg-brand-sidebar border-2 border-brand-border rounded shadow-brand hover:border-brand-primary/50 transition-all duration-300 min-h-0 ornate-frame p-6 sm:p-10 md:p-14 ${
        preferences.highContrast ? "border-black border-2 bg-white text-black" : ""
      }`}
    >
      {/* Visual Assistance Focus Guide Bar */}
      {preferences.showFocusGuide && (
        <div 
          id="focus-reading-guide-line"
          className="absolute left-0 right-0 h-[3px] bg-brand-primary/65 shadow-[0_0_8px_rgba(201,169,98,0.85)] pointer-events-none transition-all duration-75 z-20"
          style={{ top: `${guideLineTop}px` }}
        />
      )}

      {/* Header Info Banner Tag */}
      <div className="flex items-center justify-between gap-4 border-b border-brand-border/60 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-brand-primary" />
          <span className="text-xs uppercase font-semibold tracking-[0.2em] text-brand-primary font-label">
            {article.category || "General Publication"}
          </span>
        </div>

        {/* Floating actions */}
        <div className="flex items-center gap-2">
          <button
            id="article-btn-bookmark"
            onClick={toggleBookmark}
            className={`p-2 rounded border transition-all duration-200 focus:outline-none ${
              isBookmarked 
                ? "bg-brand-primary border-brand-primary text-brand-bg scale-105" 
                : "border-brand-border text-brand-muted-text hover:bg-brand-subtle hover:text-brand-text"
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Save article for later"}
            aria-label="Add bookmark"
          >
            {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>

          <button
            id="article-btn-share"
            onClick={handleShare}
            className="p-2 border border-brand-border rounded text-brand-muted-text hover:bg-brand-subtle hover:text-brand-text transition-all focus:outline-none relative"
            title="Copy URL citation link"
            aria-label="Share article link"
          >
            <Share2 className="w-4 h-4" />
            
            {/* Click copied popover */}
            {showShareNotification && (
              <span id="copied-notification" className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-brand-primary text-brand-bg text-[10px] px-2.5 py-1 rounded font-label tracking-wider shadow-brand">
                Citational link copied
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Primary Article Title Headings */}
      <header className="mb-8 text-left">
        <span className="block text-[10px] uppercase tracking-[0.3em] text-brand-primary font-label mb-2">
          {article.volumeLabel || "Volume I \u00B7 Treatise I"}
        </span>
        <h1 
          id="article-layout-title"
          className="font-display text-3xl sm:text-4xl md:text-5xl font-normal text-brand-text tracking-tight leading-tight mb-4 break-words w-full"
        >
          {article.title}
        </h1>
        
        <p 
          id="article-layout-subtitle"
          className="font-serif text-base sm:text-lg md:text-xl text-brand-muted-text font-light leading-relaxed mb-6 italic break-words w-full"
        >
          {article.subtitle}
        </p>

        {/* Author details card matching physical manuscript stack */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-brand-border text-xs font-serif text-brand-muted-text">
          <div className="flex items-center gap-3">
            <img 
              src={article.authorAvatar} 
              alt={article.author}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded border border-brand-border object-cover sepia-[0.3] hover:sepia-0 transition duration-300" 
            />
            <div>
              <span id="article-meta-author" className="block font-bold text-brand-text font-label text-xs uppercase tracking-wider">{article.author}</span>
              <span id="article-meta-role" className="block text-[11px] text-brand-muted-text leading-normal max-w-md italic mt-0.5">{article.authorRole}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-brand-border/40 font-label text-[10px] tracking-widest uppercase">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-primary" />
              <strong id="article-meta-date" className="font-semibold text-brand-text">{article.publishedDate}</strong>
            </span>

            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-primary" />
              <strong id="article-meta-readtime" className="font-semibold text-brand-text">{article.readTime || `${estimatedReadingTime} min read`}</strong>
            </span>
          </div>
        </div>
      </header>

      {/* Article Content Area */}
      <div 
        id="article-scroll-container"
        className="flex-1 overflow-y-auto pr-1"
      >
        <div className={`markdown-body ${getTypographyClass()} ${getFontSizeClass()}`}>
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              h1: ({node, ...props}) => <h1 className="font-display text-2xl sm:text-3xl font-normal tracking-wide text-brand-primary mt-8 mb-4 border-b border-brand-border/60 pb-1 break-words" {...props} />,
              h2: ({node, ...props}) => <h2 className="font-display text-xl sm:text-2xl font-normal tracking-wide text-brand-primary mt-7 mb-3 break-words" {...props} />,
              h3: ({node, ...props}) => <h3 className="font-display text-lg sm:text-xl font-normal tracking-wide text-brand-primary mt-5 mb-2 break-words" {...props} />,
              p: ({node, children, ...props}) => {
                const hasImage = node?.children?.some(
                  (child: any) => child.tagName === "img" || (child.type === "element" && child.tagName === "img")
                );
                if (hasImage) {
                  return <div className="my-8 flex flex-col items-center w-full">{children}</div>;
                }
                return <p className="mb-6 leading-relaxed text-brand-text/95 break-words" {...props}>{children}</p>;
              },
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-brand-primary bg-brand-subtle/40 pl-5 py-3 pr-4 my-6 text-brand-text italic rounded-r text-base sm:text-lg break-words" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 space-y-2 text-brand-text/90" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-6 space-y-2 text-brand-text/90" {...props} />,
              a: ({node, ...props}) => <a className="text-brand-primary underline underline-offset-4 hover:text-brand-accent transition-colors font-semibold break-all" {...props} />,
              table: ({node, ...props}) => <div className="overflow-x-auto my-6 border border-brand-border rounded bg-brand-sidebar shadow-brand-sm"><table className="w-full text-left border-collapse text-xs sm:text-sm" {...props} /></div>,
              th: ({node, ...props}) => <th className="bg-brand-subtle py-3 px-4 font-bold font-label border-b border-brand-border text-brand-primary text-xs uppercase tracking-wider" {...props} />,
              td: ({node, ...props}) => <td className="py-2.5 px-4 border-b border-brand-border/60 text-brand-text/90 font-serif text-xs sm:text-sm break-words" {...props} />,
              img: ({node, src, alt, ...props}) => (
                <span className="block w-full text-center">
                  <img src={src} alt={alt} referrerPolicy="no-referrer" className="arch-top-media sepia-image border border-brand-border shadow-brand max-h-[480px] w-full object-cover" />
                  {alt && <span className="text-xs text-brand-muted-text italic mt-2 text-center px-4 leading-normal font-serif break-words block">{alt}</span>}
                </span>
              ),
              hr: ({node, ...props}) => <div className="ornate-divider" aria-hidden="true" />,
              strong: ({node, ...props}) => <strong className="font-semibold text-brand-primary" {...props} />
            }}
          >
            {article.content}
          </Markdown>
        </div>

        {/* Footer Category Tag Pile */}
        <div className="mt-10 pt-6 border-t border-brand-border/60 flex flex-wrap gap-2">
          {article.tags?.map((tag, idx) => (
            <span 
              key={idx} 
              className="text-[10px] font-label font-bold bg-brand-subtle text-brand-primary px-3 py-1 rounded uppercase tracking-[0.15em] border border-brand-border/40"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
