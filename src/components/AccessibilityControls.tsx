/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Type, 
  Eye, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Play, 
  Pause, 
  Square,
  BookOpen, 
  Settings,
  HelpCircle,
  Baseline
} from "lucide-react";
import { VisualPreferences, FontSize, FontFamily } from "../types";

interface AccessibilityControlsProps {
  preferences: VisualPreferences;
  onUpdatePreferences: (prefs: Partial<VisualPreferences>) => void;
  articleContent: string;
}

export default function AccessibilityControls({
  preferences,
  onUpdatePreferences,
  articleContent
}: AccessibilityControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [ttsState, setTtsState] = useState<"stopped" | "playing" | "paused">("stopped");
  const [synth, setSynth] = useState<SpeechSynthesis | null>(
    typeof window !== "undefined" ? window.speechSynthesis : null
  );
  const [activeUtterance, setActiveUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  // Strip markdown tags to extract clean readable text
  const getReadableText = () => {
    return articleContent
      .replace(/<[^>]*>/g, "") // strip HTML
      .replace(/!\[.*?\]\(.*?\)/g, "") // strip images
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // link text only
      .replace(/[*#_~`>|-]/g, "") // strip markdown symbols
      .replace(/\s+/g, " ")
      .trim();
  };

  const handleStartSpeaking = () => {
    if (!synth) return;
    synth.cancel(); // Stop any pending speech

    const textToSpeak = getReadableText();
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    utterance.onend = () => {
      setTtsState("stopped");
      setActiveUtterance(null);
    };

    utterance.onerror = () => {
      setTtsState("stopped");
      setActiveUtterance(null);
    };

    setActiveUtterance(utterance);
    setTtsState("playing");
    synth.speak(utterance);
  };

  const handlePauseSpeaking = () => {
    if (!synth) return;
    if (ttsState === "playing") {
      synth.pause();
      setTtsState("paused");
    }
  };

  const handleResumeSpeaking = () => {
    if (!synth) return;
    if (ttsState === "paused") {
      synth.resume();
      setTtsState("playing");
    }
  };

  const handleStopSpeaking = () => {
    if (!synth) return;
    synth.cancel();
    setTtsState("stopped");
    setActiveUtterance(null);
  };

  const fontSizes: { value: FontSize; label: string; desc: string }[] = [
    { value: "sm", label: "Small", desc: "15px body" },
    { value: "base", label: "Default", desc: "18px body" },
    { value: "md", label: "Medium", desc: "20px body" },
    { value: "lg", label: "Large", desc: "24px body" },
    { value: "xl", label: "Extra Large", desc: "28px body" }
  ];

  const fontFamilies: { value: FontFamily; label: string; desc: string }[] = [
    { value: "serif", label: "Intellectual Serif", desc: "Crimson Pro (Scholarly & Warm)" },
    { value: "sans", label: "Dignified Sans-Serif", desc: "Inter (High Pixel Density)" },
    { value: "dyslexic", label: "Reader-Friendly", desc: "Rounded (Enhanced Spacing) " }
  ];

  return (
    <div id="accessibility-hud" className="relative">
      {/* HUD Trigger Button */}
      <button
        id="acc-toggle-hud"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded bg-brand-sidebar border border-brand-border text-brand-primary font-semibold text-xs hover:bg-brand-subtle transition shadow-brand-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 font-label uppercase tracking-wider"
        aria-label="Accessibility settings"
        aria-expanded={isOpen}
      >
        <Baseline className="w-4 h-4 text-brand-primary animate-pulse" />
        <span className="sm:inline hidden">Settings</span>
      </button>

      {/* Floating Panel dropdown */}
      {isOpen && (
        <div 
          id="acc-dropdown-panel"
          className="absolute right-0 mt-2 w-80 bg-brand-sidebar border-2 border-brand-border rounded shadow-brand max-h-[85vh] overflow-y-auto z-50 p-4 font-serif text-brand-text motion-preset-fade"
        >
          <div className="flex items-center justify-between border-b border-brand-border pb-3 mb-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 font-label uppercase tracking-widest text-[#C9A962]">
              <Settings className="w-4 h-4 text-brand-primary" />
              Settings
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-brand-muted-text hover:underline hover:text-brand-primary focus:outline-none font-label uppercase tracking-wider"
            >
              Close
            </button>
          </div>

          {/* Section: Text Size */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-brand-primary uppercase tracking-[0.12em] font-label mb-2 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5" />
              Scale Sizing
            </label>
            <div className="grid grid-cols-5 gap-1 bg-brand-bg rounded p-1 border border-brand-border">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  id={`btn-fontsize-${size.value}`}
                  onClick={() => onUpdatePreferences({ fontSize: size.value })}
                  className={`py-1.5 rounded text-xs font-bold transition focus:outline-none ${
                    preferences.fontSize === size.value
                      ? "bg-brand-primary text-brand-bg"
                      : "text-brand-text hover:bg-brand-subtle"
                  }`}
                  title={`${size.label} (${size.desc})`}
                >
                  {size.value === "sm" && "A"}
                  {size.value === "base" && "aA"}
                  {size.value === "md" && "Aa"}
                  {size.value === "lg" && "AA"}
                  {size.value === "xl" && "AA+"}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-brand-muted-text mt-1.5 italic">
              Currently utilizing {fontSizes.find(f => f.value === preferences.fontSize)?.label} text-sizing.
            </p>
          </div>

          {/* Section: Main Typography */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-brand-primary uppercase tracking-[0.12em] font-label mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Syllabary Typeface
            </label>
            <div className="flex flex-col gap-1.5">
              {fontFamilies.map((fam) => (
                <button
                  key={fam.value}
                  id={`btn-fontfam-${fam.value}`}
                  onClick={() => onUpdatePreferences({ fontFamily: fam.value })}
                  className={`flex items-center justify-between text-left p-2 rounded border text-xs transition ${
                    preferences.fontFamily === fam.value
                      ? "border-brand-primary bg-brand-subtle font-semibold"
                      : "border-brand-border hover:bg-brand-bg/50"
                  }`}
                >
                  <div>
                    <span 
                      className={`block text-xs ${
                        fam.value === "serif" ? "font-serif" : fam.value === "dyslexic" ? "font-dyslexia" : "font-sans font-medium"
                      }`}
                    >
                      {fam.label}
                    </span>
                    <span className="block text-[10px] text-brand-muted-text mt-0.5">{fam.desc}</span>
                  </div>
                  {preferences.fontFamily === fam.value && (
                    <span className="text-[9px] bg-brand-primary text-brand-bg px-2 py-0.5 rounded font-label lowercase tracking-wider font-semibold">Active</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Assistive Overlays */}
          <div className="mb-5 border-t border-brand-border pt-4">
            <label className="block text-xs font-semibold text-brand-accent uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Reading Overlays
            </label>
            
            <div className="flex flex-col gap-2">
              {/* Focus guide rule line */}
              <label className="relative flex items-center justify-between rounded-lg border border-brand-border p-2 bg-brand-bg/20 cursor-pointer hover:bg-brand-bg/50 transition">
                <div className="flex flex-col">
                  <span className="text-xs font-medium">Focus Reading Anchor</span>
                  <span className="text-[10px] text-brand-accent">Horizontal eye-level assistance line</span>
                </div>
                <input
                  id="acc-cb-focus-guide"
                  type="checkbox"
                  checked={preferences.showFocusGuide}
                  onChange={(e) => onUpdatePreferences({ showFocusGuide: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-brand-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-brand-bg after:border-brand-border after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-primary relative"></div>
              </label>

              {/* High Contrast */}
              <label className="relative flex items-center justify-between rounded-lg border border-brand-border p-2 bg-brand-bg/20 cursor-pointer hover:bg-brand-bg/50 transition">
                <div className="flex flex-col">
                  <span className="text-xs font-medium">High Contrast Rendering</span>
                  <span className="text-[10px] text-brand-accent">Maximum readability (dark on background)</span>
                </div>
                <input
                  id="acc-cb-high-contrast"
                  type="checkbox"
                  checked={preferences.highContrast}
                  onChange={(e) => onUpdatePreferences({ highContrast: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-brand-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-brand-bg after:border-brand-border after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-primary relative"></div>
              </label>
            </div>
          </div>

          {/* Section: Screen Reader TTS engine */}
          <div className="border-t border-brand-border pt-4">
            <h4 className="text-xs font-semibold text-brand-accent uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-brand-accent" />
              Auditory Broadcaster (TTS)
            </h4>
            
            {synth === null ? (
              <p className="text-[11px] text-red-700 font-medium">
                Speech Synthesis API is unavailable or blocked in this browser sandbox.
              </p>
            ) : (
              <div className="bg-brand-bg rounded-lg border border-brand-border p-2.5">
                <span className="block text-[10px] font-semibold text-brand-accent mb-2 uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand-accent" />
                  Natural Text Reader
                </span>
                
                <div className="flex items-center gap-1.5 justify-center">
                  {ttsState === "stopped" ? (
                    <button
                      id="tts-btn-play"
                      onClick={handleStartSpeaking}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 bg-brand-primary text-white rounded text-xs hover:bg-brand-accent transition focus:outline-none py-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Listen
                    </button>
                  ) : (
                    <>
                      {ttsState === "playing" ? (
                        <button
                          id="tts-btn-pause"
                          onClick={handlePauseSpeaking}
                          className="flex items-center justify-center gap-1 px-2.5 py-1.5 border border-brand-border text-brand-primary rounded text-xs hover:bg-brand-subtle transition focus:outline-none"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          Pause
                        </button>
                      ) : (
                        <button
                          id="tts-btn-resume"
                          onClick={handleResumeSpeaking}
                          className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-brand-primary text-white rounded text-xs hover:bg-brand-accent transition focus:outline-none font-semibold"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Resume
                        </button>
                      )}
                      
                      <button
                        id="tts-btn-stop"
                        onClick={handleStopSpeaking}
                        className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-red-850 border border-brand-border text-red-700 bg-red-50 hover:bg-red-100 rounded text-xs transition focus:outline-none"
                      >
                        <Square className="w-3.5 h-3.5 fill-red-700" />
                        Stop
                      </button>
                    </>
                  )}
                </div>
                
                {ttsState !== "stopped" && (
                  <div className="mt-2.5 flex items-center justify-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
                    </span>
                    <span className="text-[10px] text-brand-accent animate-pulse font-medium">
                      Reading article aloud...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
