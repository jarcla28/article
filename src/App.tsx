/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Edit3, 
  Columns, 
  HelpCircle,
  TrendingUp,
  Award,
  Globe,
  Settings,
  Flame,
  LayoutGrid,
  Lock
} from "lucide-react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { Article, VisualPreferences } from "./types";
import { DEFAULT_ARTICLE } from "./data";
import ArticleView from "./components/ArticleView";
import MarkdownEditor from "./components/MarkdownEditor";
import AccessibilityControls from "./components/AccessibilityControls";

const STORAGE_PREFS_KEY = "reader_visual_preferences";

const DEFAULT_PREFS: VisualPreferences = {
  fontSize: "base",
  fontFamily: "serif",
  highContrast: false,
  showFocusGuide: false,
  isAutosaveEnabled: true
};

export default function App() {
  const [article, setArticle] = useState<Article>(DEFAULT_ARTICLE);
  const [preferences, setPreferences] = useState<VisualPreferences>(DEFAULT_PREFS);
  const [layoutMode, setLayoutMode] = useState<"read" | "edit">("read");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state on mount and subscribe to Firestore for global real-time synchronization
  useEffect(() => {
    // 1. Load local visual preferences
    try {
      const savedPrefs = localStorage.getItem(STORAGE_PREFS_KEY);
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    } catch (e) {
      console.error("Local Storage is inaccessible or restricted in this environment:", e);
    }

    // 2. Establish a live real-time subscription to our Firestore document
    const articleDocRef = doc(db, "articles", "main_article");
    const unsubscribeSnapshot = onSnapshot(
      articleDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setArticle(snapshot.data() as Article);
          setIsInitialized(true);
        } else {
          // Document does not exist in Firestore yet. Initialize/seed it with default content.
          console.log("No global article found in cloud. Seeding default manuscript...");
          setDoc(articleDocRef, DEFAULT_ARTICLE)
            .then(() => {
              setArticle(DEFAULT_ARTICLE);
              setIsInitialized(true);
            })
            .catch((error) => {
              handleFirestoreError(error, OperationType.WRITE, "articles/main_article");
              // Fallback to default in case of write permission error
              setArticle(DEFAULT_ARTICLE);
              setIsInitialized(true);
            });
        }
      },
      (error) => {
        console.error("Failed to subscribe to Firestore, falling back to local default:", error);
        // Fallback to local default so the app remains fully functional and doesn't get stuck loading
        setArticle(DEFAULT_ARTICLE);
        setIsInitialized(true);
      }
    );

    return () => {
      unsubscribeSnapshot();
    };
  }, []);

  // Save article modifications globally to Firestore
  const handleUpdateArticle = async (updatedArticle: Article) => {
    setArticle(updatedArticle);
    const articleDocRef = doc(db, "articles", "main_article");
    try {
      await setDoc(articleDocRef, updatedArticle);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "articles/main_article");
    }
  };

  // Reset to static eco-science article template in the cloud
  const handleResetToDefault = async () => {
    const articleDocRef = doc(db, "articles", "main_article");
    try {
      const cloned = JSON.parse(JSON.stringify(DEFAULT_ARTICLE));
      setArticle(cloned);
      await setDoc(articleDocRef, cloned);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "articles/main_article");
    }
  };

  // Save visual option changes
  const handleUpdatePreferences = (updatedPrefs: Partial<VisualPreferences>) => {
    setPreferences(prev => {
      const merged = { ...prev, ...updatedPrefs };
      try {
        localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(merged));
      } catch (e) {
        console.error("Saved preferences writing failure:", e);
      }
      return merged;
    });
  };

  // Helper values for active styling
  const containerStyle = preferences.highContrast 
    ? "bg-white text-black min-h-screen relative" 
    : "bg-brand-bg text-brand-text min-h-screen relative";

  const bannerStyle = preferences.highContrast
    ? "border-b-2 border-black py-4 bg-white"
    : "border-b border-brand-border py-4 bg-brand-sidebar/95 backdrop-blur-md sticky top-0 z-40 shadow-brand-sm transition-colors duration-250";

  return (
    <div className={`${containerStyle} flex flex-col font-serif antialiased pb-12`}>
      {/* Academia Atmosphere Overlays */}
      {!preferences.highContrast && (
        <>
          <div className="paper-texture-overlay" />
          <div className="vignette-overlay" />
        </>
      )}

      {/* Top Professional Navigation Brand Headline banner */}
      <header className={bannerStyle} role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Magazine Brand Title Section */}
          <div className="flex items-center gap-3">
            <span className="p-2 bg-brand-primary text-brand-bg rounded font-label font-bold text-sm shadow-brand-sm border border-brand-primary/20 hover:scale-105 transition duration-300">
              IV
            </span>
            <div className="text-left font-serif">
              <span className="block font-label text-base md:text-lg font-bold text-brand-primary tracking-normal uppercase engraved-text">
                the number four
              </span>
              <span className="block text-[8px] md:text-[9px] text-brand-muted-text tracking-[0.25em] uppercase font-label mt-0.5">
                jareth clayton &middot; william mehija &middot; Est. 2026
              </span>
            </div>
          </div>

          {/* Core Interactive Layout & Accessibility controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mode Selector pills */}
            <div className="hidden sm:flex items-center gap-1 bg-brand-sidebar p-0.5 rounded border border-brand-border shadow-brand-sm">
              <button
                id="btn-layout-read"
                onClick={() => setLayoutMode("read")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-label uppercase tracking-wider font-semibold transition ${
                  layoutMode === "read" 
                    ? "bg-brand-primary text-brand-bg shadow-brand-sm font-bold" 
                    : "text-brand-muted-text hover:bg-brand-subtle hover:text-brand-text"
                }`}
                title="Strict reader publication layout"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Read
              </button>

              <button
                id="btn-layout-edit"
                onClick={() => setLayoutMode("edit")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-label uppercase tracking-wider font-semibold transition ${
                  layoutMode === "edit" 
                    ? "bg-brand-primary text-brand-bg shadow-brand-sm font-bold" 
                    : "text-brand-muted-text hover:bg-brand-subtle hover:text-brand-text"
                }`}
                title="Full-page focused markdown text editor"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit
              </button>
            </div>

            {/* Mobile-Friendly Toggle Mode buttons */}
            <div className="flex sm:hidden items-center bg-brand-sidebar p-0.5 rounded border border-brand-border">
              <button
                id="mobile-btn-read"
                onClick={() => setLayoutMode("read")}
                className={`p-1.5 rounded transition ${
                  layoutMode === "read" ? "bg-brand-primary text-brand-bg" : "text-brand-muted-text"
                }`}
                title="Read publication"
              >
                <BookOpen className="w-4 h-4" />
              </button>
              <button
                id="mobile-btn-edit"
                onClick={() => setLayoutMode("edit")}
                className={`p-1.5 rounded transition ${
                  layoutMode === "edit" ? "bg-brand-primary text-brand-bg" : "text-brand-muted-text"
                }`}
                title="Modify draft"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            <AccessibilityControls
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
              articleContent={article.content}
            />
          </div>
        </div>
      </header>

      {/* Main content grid displaying viewports under layout modes */}
      <main id="app-publication-workspace" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6" role="main">
        {!isInitialized ? (
          <div className="flex flex-col items-center justify-center py-24 text-brand-accent font-sans animate-pulse">
            <TrendingUp className="w-8 h-8 animate-bounce mb-3 text-brand-accent" />
            <span className="text-sm font-semibold tracking-wide">Archival Manuscript Loading...</span>
          </div>
        ) : (
          <div className="h-full">
            
            {/* Read Mode: Single beautifully-centered editorial layout */}
            {layoutMode === "read" && (
              <div 
                id="reader-view-container"
                className="max-w-[760px] mx-auto animate-preset-fade"
              >
                <ArticleView
                  article={article}
                  preferences={preferences}
                  onEditClick={() => setLayoutMode("edit")}
                />
              </div>
            )}

            {/* Edit Mode: Unified workstation layout */}
            {layoutMode === "edit" && (
              <div 
                id="editor-view-container"
                className="max-w-7xl mx-auto h-[calc(100vh-140px)] min-h-[560px]"
              >
                {!isUnlocked ? (
                  <div className="flex items-center justify-center h-full w-full max-w-lg mx-auto py-12 px-6">
                    <div className="bg-[#1C1714] text-[#E8DFD4] rounded-lg border-2 border-[#4A3F35] shadow-brand ornate-frame p-8 text-center relative overflow-hidden w-full">
                      <div className="paper-texture-overlay opacity-30" />
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="p-4 bg-[#C9A962] text-[#1C1714] rounded-full mb-4 shadow-brand-sm">
                          <Lock className="w-8 h-8" />
                        </div>
                        
                        <h2 className="font-display font-bold text-xl md:text-2xl text-white uppercase tracking-widest leading-tight mb-2">
                          Archival Station Locked
                        </h2>
                        <p className="text-xs text-[#9C8B7A] font-serif max-w-sm leading-relaxed mb-6">
                          Article editing is locked. Please enter soy password-iendo to use :3:3:3
                        </p>

                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (passwordInput.trim() === "mastermanipulator") {
                              setIsUnlocked(true);
                              setPasswordError("");
                            } else {
                              setPasswordError("Authority passcode rejected. Access denied.");
                            }
                          }}
                          className="w-full space-y-4"
                        >
                          <div className="relative">
                            <input
                              type="password"
                              placeholder="Passcode..."
                              value={passwordInput}
                              onChange={(e) => {
                                setPasswordInput(e.target.value);
                                if (passwordError) setPasswordError("");
                              }}
                              className="w-full px-4 py-2.5 bg-[#251E19] text-[#E8DFD4] placeholder-[#5C4F43] rounded border border-[#4A3F35] text-sm text-center tracking-[0.25em] font-mono focus:outline-none focus:ring-1 focus:ring-[#C9A962] transition"
                              autoFocus
                            />
                          </div>

                          {passwordError && (
                            <p className="text-rose-400 text-xs font-semibold tracking-wide animate-pulse">
                              {passwordError}
                            </p>
                          )}

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-[#C9A962] text-[#1C1714] rounded font-label text-xs uppercase tracking-wider font-bold shadow-brand-sm hover:bg-[#D9B972] transition cursor-pointer"
                          >
                            Authenticate Access
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                ) : (
                  <MarkdownEditor
                    article={article}
                    onChangeArticle={handleUpdateArticle}
                    onResetToDefault={handleResetToDefault}
                    onClose={() => setLayoutMode("read")}
                    initialViewMode="editor"
                    preferences={preferences}
                  />
                )}
              </div>
            )}

          </div>
        )}
      </main>

      {/* Decorative Editorial Footer */}
      <footer className="mt-12 text-center text-[10px] font-mono text-brand-accent/75 max-w-2xl mx-auto px-4 sm:px-6">
        <p className="border-t border-brand-border/40 pt-4 leading-relaxed">
          ts is soooooooooooooooooooooooo cool and totally 100% human made rawr ex dee@!! ahaha
          meow meow meow meow (slowed + reverb)
        </p>
        <p className="mt-1">
          &copy; 1996 - {new Date().getFullYear()} xxxx name xd. No rights reserved.
        </p>
      </footer>
    </div>
  );
}
