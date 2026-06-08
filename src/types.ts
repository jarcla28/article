/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Article {
  title: string;
  subtitle: string;
  content: string; // Markdown content
  author: string;
  authorRole: string;
  authorAvatar: string;
  publishedDate: string;
  category: string;
  tags: string[];
  readTime?: string;
  draftLabel?: string;
  volumeLabel?: string;
}

export type FontSize = "sm" | "base" | "md" | "lg" | "xl";
export type FontFamily = "serif" | "sans" | "dyslexic";

export interface VisualPreferences {
  fontSize: FontSize;
  fontFamily: FontFamily;
  highContrast: boolean;
  showFocusGuide: boolean;
  isAutosaveEnabled: boolean;
}
