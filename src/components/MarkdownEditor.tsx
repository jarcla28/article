/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3, 
  Quote, 
  List, 
  ListOrdered, 
  Link, 
  Image, 
  Grid3X3,
  HelpCircle,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  Minimize2,
  BookOpen,
  Calendar,
  Clock,
  Columns,
  Eye,
  Type,
  Tag,
  PenTool,
  Sparkles
} from "lucide-react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Article, VisualPreferences } from "../types";

interface MarkdownEditorProps {
  article: Article;
  onChangeArticle: (updated: Article) => void;
  onResetToDefault: () => void;
  onClose: () => void;
  initialViewMode?: EditorViewMode;
  preferences: VisualPreferences;
}

type EditorViewMode = "editor" | "split" | "preview";

export default function MarkdownEditor({
  article,
  onChangeArticle,
  onResetToDefault,
  onClose,
  initialViewMode = "split",
  preferences
}: MarkdownEditorProps) {
  const [viewMode, setViewMode] = useState<EditorViewMode>(initialViewMode);
  const [isEditingBody, setIsEditingBody] = useState(false);
  
  // Align viewMode state if initialViewMode prop changes
  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode]);

  const [showCheatSheet, setShowCheatSheet] = useState(false);

  const getTypographyClass = () => {
    if (preferences.fontFamily === "dyslexic") return "font-dyslexia";
    if (preferences.fontFamily === "sans") return "font-reader-sans";
    return "font-serif";
  };

  const getFontSizeClass = () => {
    switch (preferences.fontSize) {
      case "sm": return "text-sm leading-relaxed";
      case "md": return "text-lg leading-relaxed";
      case "lg": return "text-xl leading-loose";
      case "xl": return "text-2xl leading-loose";
      case "base":
      default:
        return "text-base leading-relaxed";
    }
  };
  const [dragActive, setDragActive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Statistics calculation
  const getCharCount = () => article.content.length;
  const getWordCount = () => {
    const text = article.content.trim();
    if (!text) return 0;
    return text.split(/\s+/).length;
  };
  const getReadingTime = () => {
    const words = getWordCount();
    return Math.max(1, Math.ceil(words / 220)); // average reading speed
  };

  // Synchronize layout scroll behavior if desired (optional)
  const previewScrollRef = useRef<HTMLDivElement>(null);

  const insertMarkdown = (syntaxBefore: string, syntaxAfter: string = "", placeholderData: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(startPos, endPos) || placeholderData;
    const replacement = syntaxBefore + selectedText + syntaxAfter;

    const updatedValue = text.substring(0, startPos) + replacement + text.substring(endPos);
    
    onChangeArticle({
      ...article,
      content: updatedValue
    });

    // Reset cursor focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        startPos + syntaxBefore.length,
        startPos + syntaxBefore.length + selectedText.length
      );
    }, 50);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const parseMarkdownFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const resultText = event.target?.result;
      if (typeof resultText === "string") {
        let parsedTitle = article.title;
        let parsedSubtitle = article.subtitle;
        let mainContent = resultText;

        const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
        const match = resultText.match(fmRegex);
        if (match) {
          const frontmatter = match[1];
          mainContent = match[2];
          
          frontmatter.split("\n").forEach(line => {
            const parts = line.split(":");
            if (parts.length >= 2) {
              const key = parts[0].trim().toLowerCase();
              const val = parts.slice(1).join(":").trim().replace(/^["']|["']$/g, "");
              if (key === "title") parsedTitle = val;
              if (key === "subtitle") parsedSubtitle = val;
            }
          });
        }

        onChangeArticle({
          ...article,
          title: parsedTitle,
          subtitle: parsedSubtitle,
          content: mainContent
        });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".md") || file.name.endsWith(".txt")) {
        parseMarkdownFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      parseMarkdownFile(e.target.files[0]);
    }
  };

  const handleExportMarkdown = () => {
    const fullFileContent = 
`---
title: "${article.title.replace(/"/g, '\\"')}"
subtitle: "${article.subtitle.replace(/"/g, '\\"')}"
author: "${article.author}"
category: "${article.category}"
date: "${article.publishedDate}"
---

${article.content}`;

    const blob = new Blob([fullFileContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `archive-${article.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="classical-manuscript-workspace" className="bg-[#1C1714] text-[#E8DFD4] rounded border-2 border-[#4A3F35] shadow-brand flex flex-col h-full overflow-hidden ornate-frame relative">
      
      {/* 1. Header Toolbar Console (Command Deck) */}
      <div className="bg-[#251E19] px-4 py-3 border-b border-[#4A3F35] flex flex-col gap-3 sm:flex-row sm:items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-[#C9A962] text-[#1C1714] rounded">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-label uppercase tracking-widest text-white">Manuscript Station</h2>
          </div>
        </div>

        {/* View Mode Selectors for layout switches */}
        <div className="flex items-center gap-1.5 bg-[#1C1714] border border-[#4A3F35] p-0.5 rounded">
          <button
            onClick={() => setViewMode("editor")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-label uppercase tracking-wider transition ${
              viewMode === "editor" 
                ? "bg-[#C9A962] text-[#1C1714] font-bold" 
                : "text-[#9C8B7A] hover:bg-[#251E19]"
            }`}
            title="Draft view only"
          >
            <Type className="h-3 w-3" />
            <span>Draft</span>
          </button>
          
          <button
            onClick={() => setViewMode("split")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-label uppercase tracking-wider transition ${
              viewMode === "split" 
                ? "bg-[#C9A962] text-[#1C1714] font-bold" 
                : "text-[#9C8B7A] hover:bg-[#251E19]"
            }`}
            title="Side-by-side desk"
          >
            <Columns className="h-3 w-3" />
            <span>Split Desk</span>
          </button>

          <button
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-label uppercase tracking-wider transition ${
              viewMode === "preview" 
                ? "bg-[#C9A962] text-[#1C1714] font-bold" 
                : "text-[#9C8B7A] hover:bg-[#251E19]"
            }`}
            title="Rendered specimen preview"
          >
            <Eye className="h-3 w-3" />
            <span>Preview</span>
          </button>
        </div>

        {/* Essential workspace tools */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              if (window.confirm("Revert this manuscript back to the default archival treatise? All edited text will be lost.")) {
                onResetToDefault();
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 border border-[#4A3F35] rounded text-[10px] font-label uppercase tracking-widest text-[#9C8B7A] hover:bg-[#8B2635] hover:text-[#E8DFD4] hover:border-[#8B2635] transition"
            title="Revert to initial layout"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Revert</span>
          </button>

          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1 px-2.5 py-1 border border-[#4A3F35] rounded text-[10px] font-label uppercase tracking-widest text-[#9C8B7A] hover:bg-[#251E19] hover:text-[#C9A962] transition"
            title="Export manuscript scroll (.md)"
          >
            <Download className="h-3 w-3" />
            <span>Export</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 border border-[#4A3F35] rounded text-[10px] font-label uppercase tracking-widest text-[#9C8B7A] hover:bg-[#251E19] hover:text-[#C9A962] transition pointer-events-auto"
            title="Upload classical markdown document"
          >
            <Upload className="h-3 w-3" />
            <span>Import</span>
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".md,.txt"
            className="hidden"
          />

          <button
            onClick={onClose}
            className="brass-btn flex items-center gap-1 px-3 py-1 rounded text-[10px] font-label uppercase tracking-widest font-bold shadow-brand-sm"
            title="Return to library desk"
          >
            <Minimize2 className="h-3 w-3" />
            <span>Close Desk</span>
          </button>
        </div>
      </div>

      {/* 2. Style Formatting Command Bar (Always visible at the top as requested) */}
      <div className="bg-[#251E19]/90 border-b border-[#4A3F35] px-4 py-2 flex items-center justify-between gap-4 flex-wrap z-10 sticky top-0">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => insertMarkdown("**", "**", "bold text")}
            className="p-1.5 hover:bg-[#1C1714] text-[#C9A962] rounded focus:outline-none transition-colors border border-transparent hover:border-[#4A3F35]/40"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown("*", "*", "emphasized text")}
            className="p-1.5 hover:bg-[#1C1714] text-[#C9A962] rounded focus:outline-none transition-colors border border-transparent hover:border-[#4A3F35]/40"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          
          <span className="w-[1px] h-4 bg-[#4A3F35] mx-1"></span>
          
          <button
            type="button"
            onClick={() => insertMarkdown("# ", "", "Proclamation Title")}
            className="p-1.5 hover:bg-[#1C1714] text-[#C9A962] rounded focus:outline-none transition-colors border border-transparent hover:border-[#4A3F35]/40"
            title="Heading 1 (Treatise Section)"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown("## ", "", "Subdivision Heading")}
            className="p-1.5 hover:bg-[#1C1714] text-[#C9A962] rounded focus:outline-none transition-colors border border-transparent hover:border-[#4A3F35]/40"
            title="Heading 2 (Volume Chapter)"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown("### ", "", "Minor Segment heading")}
            className="p-1.5 hover:bg-[#1C1714] text-[#C9A962] rounded focus:outline-none transition-colors border border-transparent hover:border-[#4A3F35]/40"
            title="Heading 3 (Minor Segment)"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          
          <span className="w-[1px] h-4 bg-[#4A3F35] mx-1"></span>
          
          <button
            type="button"
            onClick={() => insertMarkdown("> ", "", "Scholarly citation or quotation block.")}
            className="p-1.5 hover:bg-[#1C1714] text-[#C9A962] rounded focus:outline-none transition-colors border border-transparent hover:border-[#4A3F35]/40"
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </button>
          
          <button
            type="button"
            onClick={() => insertMarkdown("- ", "", "Bullet lists item")}
            className="p-1.5 hover:bg-[#1C1714] text-[#C9A962] rounded focus:outline-none transition-colors border border-transparent hover:border-[#4A3F35]/40"
            title="Unordered List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertMarkdown("1. ", "", "Chronological list index")}
            className="p-1.5 hover:bg-[#1C1714] text-[#C9A962] rounded focus:outline-none transition-colors border border-transparent hover:border-[#4A3F35]/40"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>

          <span className="w-[1px] h-4 bg-[#4A3F35] mx-1"></span>

          <button
            type="button"
            onClick={() => insertMarkdown("[", "](https://example.org)", "scholarly reference links")}
            className="p-1.5 hover:bg-[#1C1714] text-[#C9A962] rounded focus:outline-none transition-colors border border-transparent hover:border-[#4A3F35]/40"
            title="Insert Link"
          >
            <Link className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => insertMarkdown("![Aged Portrait Title](https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600)", "", "")}
            className="p-1.5 hover:bg-[#1C1714] text-[#C9A962] rounded focus:outline-none transition-colors border border-transparent hover:border-[#4A3F35]/40"
            title="Insert Botanical illustration or Photo"
          >
            <Image className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => insertMarkdown(
              "\n| Taxonomic Grade | Nomenclature | Characteristics |\n| :--- | :--- | :--- |\n| Core Plantae | Quercus alba | White Oak Hardwood |\n| Core Plantae | Sequoia sempervirens | Giant Coastal Redwood |\n",
              "",
              ""
            )}
            className="p-1.5 hover:bg-[#1C1714] text-[#C9A962] rounded focus:outline-none transition-colors border border-transparent hover:border-[#4A3F35]/40"
            title="Insert Chronology Table"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>

          <span className="w-[1px] h-4 bg-[#4A3F35] mx-1"></span>

          {/* Special additions */}
          <button
            type="button"
            onClick={() => insertMarkdown("\n---\n", "", "")}
            className="p-1.5 hover:bg-[#1C1714] text-[#C9A962] rounded focus:outline-none tracking-widest text-xs font-bold transition-colors border border-transparent hover:border-[#4A3F35]/40"
            title="Ornate Divider Line"
          >
            ✦
          </button>

          <button
            type="button"
            onClick={() => insertMarkdown('<span class="drop-cap">', "</span>", "T")}
            className="px-2 py-0.5 hover:bg-[#1C1714] text-[#C9A962] rounded focus:outline-none text-[10px] font-label font-bold transition-colors border border-transparent hover:border-[#4A3F35]/40"
            title="Illuminated Drop Cap"
          >
            DROP CAP
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowCheatSheet(!showCheatSheet)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] tracking-wider uppercase font-label transition ${
            showCheatSheet ? "bg-[#1C1714] text-[#C9A962] font-bold" : "text-[#9C8B7A] hover:bg-[#1C1714]"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Script Glossary</span>
        </button>
      </div>

      {/* 3. Main Split Workstation (Double Scroll Desk) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden min-h-0 bg-[#1C1714]">
        
        {/* Scroll I: The Classical Parchment Draft (Editor Panel) */}
        <div 
          className={`h-full overflow-y-auto flex flex-col border-r border-[#4A3F35] relative ${
            viewMode === "editor" 
              ? "lg:col-span-12" 
              : viewMode === "preview" 
              ? "hidden" 
              : showCheatSheet 
              ? "lg:col-span-4" 
              : "lg:col-span-6"
          } transition-all duration-300 bg-[#251E19]/30 p-4 sm:p-6`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {/* Scroll container designed EXACTLY like the formal ArticleView */}
          <div className="w-full max-w-2xl mx-auto bg-[#251E19] border-2 border-[#4A3F35] rounded p-6 sm:p-10 shadow-brand flex flex-col min-h-[100%] transition-transform duration-250 hover:border-[#C9A962]/30 relative ornate-frame">
            
            {/* Context Header */}
            <div className="flex items-center justify-between gap-3 border-b border-[#4A3F35]/60 pb-3 mb-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C9A962]" />
                <input
                  type="text"
                  value={article.category}
                  onChange={(e) => onChangeArticle({ ...article, category: e.target.value })}
                  placeholder="CATEGORY..."
                  className="bg-transparent border-b border-transparent hover:border-[#4A3F35] focus:border-[#C9A962] px-1 py-0.5 text-[11px] uppercase tracking-[0.2em] font-label text-[#C9A962] focus:outline-none w-32"
                />
              </div>
              <input
                type="text"
                value={article.draftLabel !== undefined ? article.draftLabel : "Draft Manuscript I"}
                onChange={(e) => onChangeArticle({ ...article, draftLabel: e.target.value })}
                placeholder="DRAFT LABEL"
                className="bg-transparent text-[#9C8B7A] text-[10px] text-right uppercase border-b border-transparent hover:border-[#4A3F35] focus:border-[#C9A962] focus:outline-none w-36 font-label tracking-widest"
              />
            </div>

            {/* In-Situ Article Titles (No generic form inputs!) */}
            <header className="mb-8 text-left space-y-3">
              <input
                type="text"
                value={article.volumeLabel !== undefined ? article.volumeLabel : "Volume I \u00B7 Script Draft"}
                onChange={(e) => onChangeArticle({ ...article, volumeLabel: e.target.value })}
                placeholder="VOLUME LABEL"
                className="block bg-transparent text-[#C9A962] text-[10px] uppercase tracking-[0.3em] border-b border-transparent hover:border-[#4A3F35] focus:border-[#C9A962] focus:outline-none w-full font-label mb-2 font-semibold"
              />
              
              <input
                type="text"
                value={article.title}
                onChange={(e) => onChangeArticle({ ...article, title: e.target.value })}
                placeholder="PROCLAIM A NEW TREATISE TITLE..."
                className="w-full bg-transparent border-b border-transparent hover:border-[#4A3F35] focus:border-[#C9A962] font-display text-2xl sm:text-3xl text-white tracking-tight leading-tight outline-none focus:ring-0 mb-3 break-words"
              />

              <textarea
                value={article.subtitle}
                onChange={(e) => onChangeArticle({ ...article, subtitle: e.target.value })}
                placeholder="Give your manuscript an evocative, descriptive sub-headline synopsis..."
                rows={2}
                className="w-full bg-transparent border-b border-transparent hover:border-[#4A3F35] focus:border-[#C9A962] font-serif text-sm sm:text-base text-[#9C8B7A] leading-relaxed italic outline-none resize-none focus:ring-0 break-words"
              />
            </header>

            {/* In-Situ Byline stack */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-y border-[#4A3F35] text-xs font-serif text-[#9C8B7A] mb-6">
              <div className="flex items-center gap-3">
                <img 
                  src={article.authorAvatar} 
                  alt={article.author}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded border border-[#4A3F35] object-cover sepia-[0.3]" 
                />
                <div>
                  <input
                    type="text"
                    value={article.author}
                    onChange={(e) => onChangeArticle({ ...article, author: e.target.value })}
                    placeholder="SCHOLAR IDENTITY..."
                    className="block bg-transparent border-b border-transparent hover:border-[#4A3F35] focus:border-[#C9A962] text-xs font-label uppercase tracking-wider text-white font-bold max-w-sm focus:outline-none"
                  />
                  <input
                    type="text"
                    value={article.authorRole}
                    onChange={(e) => onChangeArticle({ ...article, authorRole: e.target.value })}
                    placeholder="AFFILIATION / COHORT..."
                    className="block bg-transparent border-b border-transparent hover:border-[#4A3F35] focus:border-[#C9A962] text-[10px] text-[#9C8B7A] italic mt-0.5 w-full focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-[9px] tracking-widest font-label uppercase text-[#9C8B7A]">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#C9A962]" />
                  <input
                    type="text"
                    value={article.publishedDate}
                    onChange={(e) => onChangeArticle({ ...article, publishedDate: e.target.value })}
                    className="bg-transparent text-white w-20 text-[9px] text-center border-b border-transparent focus:border-[#C9A962] focus:outline-none"
                  />
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#C9A962]" />
                  <input
                    type="text"
                    value={article.readTime !== undefined ? article.readTime : `${getReadingTime()} min read`}
                    onChange={(e) => onChangeArticle({ ...article, readTime: e.target.value })}
                    placeholder="E.G. 4 min read"
                    className="bg-transparent text-white w-20 text-[9px] text-center border-b border-transparent focus:border-[#C9A962] focus:outline-none font-semibold uppercase text-center"
                  />
                </span>
              </div>
            </div>

            {/* Primary Interactive Markdown Textarea - looks like direct printed page */}
            <div className="flex-1 flex flex-col relative">
              <textarea
                id="script-draft-textarea"
                ref={textareaRef}
                value={article.content}
                onChange={(e) => onChangeArticle({ ...article, content: e.target.value })}
                placeholder="Pour your timeless botanical science or historical findings onto this ledger..."
                className={`w-full flex-1 bg-transparent text-[#E8DFD4] focus:outline-none leading-relaxed resize-none overflow-y-visible py-2 caret-[#C9A962] ${getTypographyClass()} ${getFontSizeClass()} break-words`}
                style={{ minHeight: "350px", border: "none" }}
              />

              {/* Tags Field positioned aesthetically inside the bottom block */}
              <div className="mt-8 border-t border-[#4A3F35]/40 pt-4 flex items-center gap-2 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-[#C9A962]" />
                <span className="text-[10px] uppercase font-label text-[#9C8B7A] mr-1">Classification Indices:</span>
                <input
                  type="text"
                  value={article.tags.join(", ")}
                  onChange={(e) => {
                    const tagList = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
                    onChangeArticle({...article, tags: tagList});
                  }}
                  className="bg-transparent hover:bg-[#1C1714] focus:bg-[#1C1714] border border-[#4A3F35] rounded text-[10px] px-2 py-0.5 text-[#C9A962] focus:outline-none w-48 font-mono"
                  placeholder="comma, separated, list"
                />
              </div>
            </div>

            {/* Drag & Drop Overlay inside the scroll */}
            {dragActive && (
              <div id="drag-drop-feedback" className="absolute inset-0 bg-[#1C1714]/95 flex flex-col items-center justify-center border-4 border-dashed border-[#C9A962] pointer-events-none rounded z-30">
                <Upload className="w-16 h-16 text-[#C9A962] animate-bounce mb-3" />
                <p className="font-semibold text-lg text-white font-label tracking-wider uppercase">Ingest Document Scroll</p>
                <p className="text-xs text-[#9C8B7A] mt-1 font-serif italic">Accepts standard .md or .txt documents</p>
              </div>
            )}
          </div>
        </div>

        {/* Scroll II: The Divine Live Preview (Rendered View Board) */}
        <div 
          ref={previewScrollRef}
          className={`h-full overflow-y-auto flex flex-col ${
            viewMode === "preview" 
              ? "lg:col-span-12" 
              : viewMode === "editor" 
              ? "hidden" 
              : showCheatSheet 
              ? "lg:col-span-4" 
              : "lg:col-span-6"
          } transition-all duration-300 bg-[#1C1714] p-4 sm:p-6 border-l border-[#4A3F35]/60`}
        >
          {/* Real parchment-look rendering board mimicking ArticleView exactly */}
          <div className="w-full max-w-2xl mx-auto bg-[#251E19] border-2 border-[#4A3F35] rounded p-6 sm:p-10 shadow-brand flex flex-col min-h-[100%] transition-transform duration-250 relative ornate-frame">
            
            {/* Header info bar */}
            <div className="flex items-center justify-between gap-4 border-b border-[#4A3F35]/60 pb-3 mb-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C9A962]" />
                <input
                  type="text"
                  value={article.category}
                  onChange={(e) => onChangeArticle({ ...article, category: e.target.value })}
                  placeholder="CATEGORY..."
                  className="bg-transparent text-xs uppercase font-semibold tracking-[0.2em] text-[#C9A962] font-label border-b border-transparent hover:border-[#4A3F35] focus:border-[#C9A962] focus:outline-none w-36 px-0.5"
                />
              </div>
              <div className="text-[10px] uppercase font-label tracking-widest text-[#9C8B7A] flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-[#C9A962] animate-pulse" />
                <span>Live Specimen Update</span>
              </div>
            </div>

            {/* Classical Headings */}
            <header className="mb-8 text-left space-y-3">
              <input
                type="text"
                value={article.volumeLabel !== undefined ? article.volumeLabel : "Volume I \u00B7 Treatise I Specimen"}
                onChange={(e) => onChangeArticle({ ...article, volumeLabel: e.target.value })}
                placeholder="VOLUME LABEL"
                className="block bg-transparent text-[#C9A962] text-[10px] uppercase tracking-[0.3em] border-b border-transparent hover:border-[#4A3F35] focus:border-[#C9A962] focus:outline-none w-full font-label mb-2 font-semibold"
              />
              <input
                type="text"
                value={article.title}
                onChange={(e) => onChangeArticle({ ...article, title: e.target.value })}
                placeholder="PROCLAIM A NEW TREATISE TITLE..."
                className="w-full bg-transparent border-b border-transparent hover:border-[#4A3F35] focus:border-[#C9A962] font-display text-2xl sm:text-3xl md:text-4xl font-normal text-white tracking-tight leading-tight outline-none py-1 focus:ring-0 mb-3 break-words"
              />
              <textarea
                value={article.subtitle}
                onChange={(e) => onChangeArticle({ ...article, subtitle: e.target.value })}
                placeholder="Give your manuscript an evocative, descriptive sub-headline synopsis..."
                rows={2}
                className="w-full bg-transparent border-b border-transparent hover:border-[#4A3F35] focus:border-[#C9A962] font-serif text-sm sm:text-base text-[#9C8B7A] leading-relaxed italic outline-none resize-none focus:ring-0 break-words"
              />
            </header>

            {/* Live Byline Stack */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-y border-[#4A3F35] text-xs font-serif text-[#9C8B7A] mb-6">
              <div className="flex items-center gap-3">
                <img 
                  src={article.authorAvatar} 
                  alt={article.author}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded border border-[#4A3F35] object-cover sepia-[0.3]" 
                />
                <div>
                  <input
                    type="text"
                    value={article.author}
                    onChange={(e) => onChangeArticle({ ...article, author: e.target.value })}
                    placeholder="SCHOLAR IDENTITY..."
                    className="block bg-transparent border-b border-transparent hover:border-[#4A3F35] focus:border-[#C9A962] text-[11px] font-label uppercase tracking-wider text-white font-bold focus:outline-none w-48"
                  />
                  <input
                    type="text"
                    value={article.authorRole}
                    onChange={(e) => onChangeArticle({ ...article, authorRole: e.target.value })}
                    placeholder="AFFILIATION / COHORT..."
                    className="block bg-transparent border-b border-transparent hover:border-[#4A3F35] focus:border-[#C9A962] text-[10px] text-[#9C8B7A] italic mt-0.5 w-64 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 text-[9px] tracking-widest font-label uppercase">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#C9A962]" />
                  <input
                    type="text"
                    value={article.publishedDate}
                    onChange={(e) => onChangeArticle({ ...article, publishedDate: e.target.value })}
                    className="bg-transparent text-white w-20 text-[9px] text-center border-b border-transparent focus:border-[#C9A962] focus:outline-none font-semibold text-center"
                  />
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#C9A962]" />
                  <input
                    type="text"
                    value={article.readTime !== undefined ? article.readTime : `${getReadingTime()} min read`}
                    onChange={(e) => onChangeArticle({ ...article, readTime: e.target.value })}
                    placeholder="E.G. 4 min read"
                    className="bg-transparent text-white w-20 text-[9px] text-center border-b border-transparent focus:border-[#C9A962] focus:outline-none font-semibold uppercase text-center"
                  />
                </span>
              </div>
            </div>

            {/* Live Markdown Rendered content box */}
            {isEditingBody ? (
              <div className="flex-1 flex flex-col min-h-[400px] mt-4">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#4A3F35]/40">
                  <span className="text-[10px] font-mono text-[#C9A962] tracking-wider uppercase font-semibold">Editing Manuscript Body Inline</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingBody(false)}
                    className="font-label text-[9px] tracking-widest uppercase bg-[#C9A962] text-[#1C1714] px-2 py-0.5 rounded font-bold hover:bg-white transition"
                  >
                    Done
                  </button>
                </div>
                <textarea
                  value={article.content}
                  onChange={(e) => onChangeArticle({ ...article, content: e.target.value })}
                  placeholder="Pour your timeless botanical science or historical findings onto this ledger..."
                  className={`w-full flex-1 bg-transparent text-[#E8DFD4] focus:outline-none leading-relaxed resize-none overflow-y-visible py-2 caret-[#C9A962] border-none ${getTypographyClass()} ${getFontSizeClass()} break-words`}
                  style={{ minHeight: "400px" }}
                  autoFocus
                />
              </div>
            ) : (
              <div 
                className={`markdown-body text-base text-[#E8DFD4] leading-relaxed flex-1 ${getTypographyClass()} ${getFontSizeClass()} hover:bg-[#3D332B]/10 rounded p-2 transition cursor-pointer group relative border border-transparent hover:border-[#4A3F35]/40`}
                onClick={() => setIsEditingBody(true)}
                title="Click to edit body content directly"
              >
                {/* Visual hover assist overlay */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#C9A962] text-[#1C1714] font-label text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded shadow-sm pointer-events-none z-10">
                  Click to Edit Inline
                </div>
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="font-display text-xl sm:text-2xl font-normal tracking-wide text-[#C9A962] mt-8 mb-4 border-b border-[#4A3F35]/50 pb-1 break-words" {...props} />,
                    h2: ({node, ...props}) => <h2 className="font-display text-lg sm:text-xl font-normal tracking-wide text-[#C9A962] mt-7 mb-3 break-words" {...props} />,
                    h3: ({node, ...props}) => <h3 className="font-display text-base sm:text-lg font-normal tracking-wide text-[#C9A962] mt-5 mb-2 break-words" {...props} />,
                    p: ({node, children, ...props}) => {
                      const hasImage = node?.children?.some(
                        (child: any) => child.tagName === "img" || (child.type === "element" && child.tagName === "img")
                      );
                      if (hasImage) {
                        return <div className="my-6 flex flex-col items-center w-full">{children}</div>;
                      }
                      return <p className="mb-4 leading-relaxed text-[#E8DFD4]/95 break-words" {...props}>{children}</p>;
                    },
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#C9A962] bg-[#3D332B]/40 pl-4 py-2 pr-3 my-4 text-[#E8DFD4] italic rounded-r text-sm break-words" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1 text-[#E8DFD4]/90 text-sm" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-[#E8DFD4]/90 text-sm" {...props} />,
                    a: ({node, ...props}) => <a className="text-[#C9A962] underline underline-offset-4 hover:text-white transition-colors break-all" {...props} />,
                    table: ({node, ...props}) => <div className="overflow-x-auto my-4 border border-[#4A3F35] rounded bg-[#251E19] shadow-brand-sm"><table className="w-full text-left border-collapse text-xs" {...props} /></div>,
                    th: ({node, ...props}) => <th className="bg-[#3D332B] py-2 px-3 font-semibold font-label border-b border-[#4A3F35] text-[#C9A962] text-[10px] uppercase tracking-wider" {...props} />,
                    td: ({node, ...props}) => <td className="py-2 px-3 border-b border-[#4A3F35]/60 text-[#E8DFD4]/90 font-serif text-[11px] break-words" {...props} />,
                    img: ({node, src, alt, ...props}) => (
                      <span className="block w-full text-center">
                        <img src={src} alt={alt} referrerPolicy="no-referrer" className="arch-top-media sepia-image border border-[#4A3F35] shadow-brand max-h-[300px] w-full object-cover" />
                        {alt && <span className="text-[10px] text-[#9C8B7A] italic mt-1.5 text-center px-4 leading-normal font-serif break-words block">{alt}</span>}
                      </span>
                    ),
                    hr: ({node, ...props}) => <div className="ornate-divider" aria-hidden="true" />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-[#C9A962]" {...props} />
                  }}
                >
                  {article.content}
                </Markdown>
              </div>
            )}

            {/* Live rendered tags list */}
            <div className="mt-8 border-t border-[#4A3F35]/50 pt-4 flex items-center gap-2 flex-wrap">
              {article.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="text-[9px] font-label font-bold bg-[#3D332B] text-[#C9A962] px-2.5 py-0.5 rounded uppercase tracking-wider border border-[#4A3F35]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll III: Command Glossary Cheat Sheet (Toggled panel) */}
        {showCheatSheet && (
          <div 
            id="academic-glossary-panel"
            className="lg:col-span-4 bg-[#251E19] border-l border-[#4A3F35] p-4 flex flex-col h-full overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-[#4A3F35] pb-2 mb-3">
              <span className="font-semibold text-xs text-[#C9A962] flex items-center gap-1.5 uppercase tracking-wider font-label animate-pulse">
                <HelpCircle className="w-4 h-4 text-[#C9A962]" />
                Scripting Codes
              </span>
              <button
                type="button"
                onClick={() => setShowCheatSheet(false)}
                className="text-[10px] hover:underline text-[#9C8B7A] hover:text-white focus:outline-none font-label tracking-wider uppercase"
              >
                Dismiss
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs font-serif text-[#9C8B7A]">
              <div>
                <h4 className="font-bold text-white font-label uppercase tracking-wider text-[9px] mb-1">Volume Headings</h4>
                <code className="block bg-[#1C1714] border border-[#4A3F35] rounded p-1 mb-1 font-mono text-[#E8DFD4] text-[10px]"># Treatise Section title</code>
                <code className="block bg-[#1C1714] border border-[#4A3F35] rounded p-1 mb-1 font-mono text-[#E8DFD4] text-[10px]">## Chapter heading</code>
                <code className="block bg-[#1C1714] border border-[#4A3F35] rounded p-1 font-mono text-[#E8DFD4] text-[10px]">### Subsection index</code>
              </div>

              <div>
                <h4 className="font-bold text-white font-label uppercase tracking-wider text-[9px] mb-1">Illuminated Typeface</h4>
                <div className="space-y-1">
                  <p className="font-mono bg-[#1C1714] border border-[#4A3F35] rounded p-1 text-[10px] text-[#E8DFD4]">**Bold text**</p>
                  <p className="font-mono bg-[#1C1714] border border-[#4A3F35] rounded p-1 text-[10px] text-[#E8DFD4]">*Italic text*</p>
                  <p className="font-mono bg-[#1C1714] border border-[#4A3F35] rounded p-1 text-[10px] text-[#E8DFD4]">~~Strike-lines~~</p>
                  <p className="font-mono bg-[#1C1714] border border-[#4A3F35] rounded p-1 text-[10px] text-[#E8DFD4]">&lt;span className="drop-cap"&gt;A&lt;/span&gt;</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white font-label uppercase tracking-wider text-[9px] mb-1">Citations</h4>
                <code className="block bg-[#1C1714] border border-[#4A3F35] p-1 rounded font-mono text-[#E8DFD4] text-[10px]">&gt; Classical citation block</code>
              </div>

              <div>
                <h4 className="font-bold text-white font-label uppercase tracking-wider text-[9px] mb-1">Taxonomy Tables</h4>
                <pre className="bg-[#1C1714] border border-[#4A3F35] p-1 rounded text-[10px] leading-tight overflow-x-auto font-mono text-[#E8DFD4]">
{`| Item  | Grade |
| :---  | :---  |
| Oak   | White |`}
                </pre>
              </div>

              <div>
                <h4 className="font-bold text-white font-label uppercase tracking-wider text-[9px] mb-1">References</h4>
                <code className="block bg-[#1C1714] border border-[#4A3F35] p-1 rounded mb-1 font-mono text-[#E8DFD4] text-[10px]">[Label](http://...)</code>
                <code className="block bg-[#1C1714] border border-[#4A3F35] p-1 rounded font-mono text-[#E8DFD4] text-[10px]">![Alt Label](image_url)</code>
              </div>
            </div>
            
            <div className="border-t border-[#4A3F35] pt-2 mt-2 text-[9px] text-[#9C8B7A] italic">
              Changes auto-sync to local files instantly.
            </div>
          </div>
        )}
      </div>

      {/* 4. Active Stats Footer */}
      <div className="bg-[#251E19] px-4 py-2 border-t border-[#4A3F35] flex items-center justify-between text-[11px] text-[#9C8B7A] z-10 font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <span>Characters: <strong className="text-[#C9A962]">{getCharCount()}</strong></span>
          <span>Words: <strong className="text-[#C9A962]">{getWordCount()}</strong></span>
          <span>Read Duration: <strong className="text-[#C9A962]">~{getReadingTime()} min</strong></span>
        </div>
        
        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded font-label uppercase tracking-widest text-[9px] font-semibold text-[#C9A962] bg-[#1C1714] border border-[#4A3F35]">
          <CheckCircle className="w-3 h-3 text-[#C9A962] animate-pulse" />
          <span>Script Synchronized</span>
        </div>
      </div>
    </div>
  );
}
