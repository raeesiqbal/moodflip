"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/toast";
import styles from "./HeroSectionExact.module.css";
import { COUNSELOR_MOODS, CounselorPromptItem } from "@/data/moods";
import AdBanner from "@/components/AdBanner";
import {
  LonelyIcon,
  VulnerableIcon,
  DespairIcon,
  GuiltyIcon,
  DepressedIcon,
  HurtIcon,
  ScaredIcon,
  AnxiousIcon,
  InsecureIcon,
  WeakIcon,
  RejectedIcon,
  ThreatenedIcon,
  LetDownIcon,
  HumiliatedIcon,
  BitterIcon,
  MadIcon,
  AggressiveIcon,
  FrustratedIcon,
  DistantIcon,
  CriticalIcon,
  DisapprovingIcon,
  UncomfortableIcon,
  AwfulIcon,
  RepelledIcon,
  TiredIcon,
  StressedIcon,
  BusyIcon,
  BoredIcon,
} from "@/components/FeelingIcons";

export type MainMoodFamily = "Sad" | "Fearful" | "Angry" | "Disgusted" | "Bad";

const DAILY_MOOD_LIFT_LIMIT_MESSAGE = "You've saved today's 3 Mood Lifts. You can still use the free MoodFlip tool. You can save more Mood Lifts tomorrow.";

export const MAGNIFIC_CLOUDS: Record<MainMoodFamily, { src: string; alt: string }> = {
  Sad: { src: "/moods/clouds/purple/cloud-sad.png", alt: "Sad Purple Cartoon Cloud" },
  Fearful: { src: "/moods/clouds/purple/cloud-fearful.png", alt: "Fearful Purple Cartoon Cloud" },
  Angry: { src: "/moods/clouds/purple/cloud-angry.png", alt: "Angry Purple Cartoon Cloud" },
  Disgusted: { src: "/moods/clouds/purple/cloud-disgusted.png", alt: "Disgusted Purple Cartoon Cloud" },
  Bad: { src: "/moods/clouds/purple/cloud-bad.png", alt: "Bad Purple Cartoon Cloud" },
};

export interface ThirdLayerFeeling {
  id: string;
  name: string;
  targetMood: string;
  actionTitle: string;
  actionDesc: string;
  icon?: (props: { className?: string }) => React.ReactNode;
  iconSrc?: string;
  chips: string[];
}

export interface MoodFamilyConfig {
  name: MainMoodFamily;
  label: string;
  feelings: ThirdLayerFeeling[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CARTOON CLOUD ILLUSTRATIONS (INLINE SVG — Magnific cartoon style)
//    Each cloud has a rounded puffy body with bumps and an emotional expression.
//    Active state uses colour; inactive is soft grey/lavender.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// 1. CARTOON CLOUD ILLUSTRATIONS (OFFICIAL MAGNIFIC / FREEPIK CARTOON CLOUD COLLECTION)
// ─────────────────────────────────────────────────────────────────────────────

function SadCloudSvg({ className, isSelected }: { className?: string; isSelected?: boolean }) {
  const bodyFill = isSelected ? "#BFDBFE" : "#EBF4FE";
  const strokeColor = isSelected ? "#1D4ED8" : "#60A5FA";
  const shadowColor = isSelected ? "#93C5FD" : "#D0E4FA";
  const highlight = isSelected ? "#FFFFFF" : "#FFFFFF";

  return (
    <svg viewBox="0 0 140 102" className={className} style={{ width: "100%", height: "100%", display: "block", margin: "0 auto", overflow: "visible" }} xmlns="http://www.w3.org/2000/svg">
      {/* Rain Drops underneath (Active / Hover) */}
      <g className={styles.weatherEffect} fill="#3B82F6">
        <path className={styles.animRain} d="M 36,86 C 36,86 33,93 33,96 C 33,98.2 34.8,100 37,100 C 39.2,100 41,98.2 41,96 C 41,93 36,86 36,86 Z"/>
        <path className={styles.animRain} style={{ animationDelay: "0.2s" }} d="M 52,88 C 52,88 49,95 49,98 C 49,100.2 50.8,102 53,102 C 55.2,102 57,100.2 57,98 C 57,95 52,88 52,88 Z"/>
        <path className={styles.animRain} style={{ animationDelay: "0.45s" }} d="M 68,89 C 68,89 65,96 65,99 C 65,101.2 66.8,103 69,103 C 71.2,103 73,101.2 73,99 C 73,96 68,89 68,89 Z"/>
        <path className={styles.animRain} style={{ animationDelay: "0.15s" }} d="M 84,88 C 84,88 81,95 81,98 C 81,100.2 82.8,102 85,102 C 87.2,102 89,100.2 89,98 C 89,95 84,88 84,88 Z"/>
        <path className={styles.animRain} style={{ animationDelay: "0.35s" }} d="M 100,86 C 100,86 97,93 97,96 C 97,98.2 98.8,100 101,100 C 103.2,100 105,98.2 105,96 C 105,93 100,86 100,86 Z"/>
      </g>

      {/* Cloud Shadow Underlayer */}
      <path d="M 28,79 C 16,79 8,69 11,57 C 6,46 13,34 24,30 C 26,17 38,10 52,12 C 60,3 74,3 84,10 C 94,5 108,10 114,21 C 127,23 135,34 133,47 C 139,58 133,70 122,76 C 116,83 105,84 96,81 C 88,86 76,87 68,83 C 58,87 46,87 38,82 C 34,84 30,82 28,79 Z" fill={shadowColor}/>
      {/* Cloud Main Body */}
      <path d="M 28,75 C 16,75 8,65 11,53 C 6,42 13,30 24,26 C 26,13 38,6 52,8 C 60,-1 74,-1 84,6 C 94,1 108,6 114,17 C 127,19 135,30 133,43 C 139,54 133,66 122,72 C 116,79 105,80 96,77 C 88,82 76,83 68,79 C 58,83 46,83 38,78 C 34,80 30,78 28,75 Z" fill={bodyFill} stroke={strokeColor} strokeWidth="3.6" strokeLinejoin="round"/>
      
      {/* Highlights */}
      <path d="M 54,12 C 64,6 76,6 84,10 C 74,14 62,16 54,12 Z" fill={highlight} opacity="0.65"/>
      <ellipse cx="36" cy="22" rx="8" ry="4" fill={highlight} opacity="0.55" transform="rotate(-15 36 22)"/>

      {/* Kawaii Big Sad Eyes */}
      <ellipse cx="49" cy="46" rx="8" ry="9" fill="#0F172A"/>
      <ellipse cx="46.5" cy="42" rx="3.5" ry="4" fill="#FFFFFF"/>
      <circle cx="52.5" cy="49" r="1.8" fill="#FFFFFF"/>
      <path d="M 44,49 Q 49,53 54,49" stroke="#60A5FA" strokeWidth="1.8" fill="none" strokeLinecap="round"/>

      <ellipse cx="85" cy="46" rx="8" ry="9" fill="#0F172A"/>
      <ellipse cx="82.5" cy="42" rx="3.5" ry="4" fill="#FFFFFF"/>
      <circle cx="88.5" cy="49" r="1.8" fill="#FFFFFF"/>
      <path d="M 80,49 Q 85,53 90,49" stroke="#60A5FA" strokeWidth="1.8" fill="none" strokeLinecap="round"/>

      {/* Sad high arched eyebrows */}
      <path d="M 42,32 Q 49,27 57,35" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M 92,32 Q 85,27 77,35" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" fill="none"/>

      {/* Blushing pink cheeks */}
      <ellipse cx="33" cy="54" rx="6" ry="3.8" fill="#F472B6" opacity={isSelected ? 0.85 : 0.65}/>
      <ellipse cx="101" cy="54" rx="6" ry="3.8" fill="#F472B6" opacity={isSelected ? 0.85 : 0.65}/>

      {/* Quivering sad downturned mouth */}
      <path d="M 61,61 Q 67,54 73,61" stroke="#0F172A" strokeWidth="3.2" strokeLinecap="round" fill="none"/>

      {/* Weeping Streaming Tears (Active / Hover) */}
      <g className={styles.weatherEffect} fill="#2563EB">
        <path className={styles.animTear} d="M 49,54 C 47,59 44,65 44,68 C 44,71.5 46.2,74 49,74 C 51.8,74 54,71.5 54,68 C 54,65 51,59 49,54 Z"/>
        <path className={styles.animTear} style={{ animationDelay: "0.35s" }} d="M 85,54 C 83,59 80,65 80,68 C 80,71.5 82.2,74 85,74 C 87.8,74 90,71.5 90,68 C 90,65 87,59 85,54 Z"/>
      </g>
    </svg>
  );
}

function FearfulCloudSvg({ className, isSelected }: { className?: string; isSelected?: boolean }) {
  const bodyFill = isSelected ? "#DDD6FE" : "#F4F0FD";
  const strokeColor = isSelected ? "#6D28D9" : "#A78BFA";
  const shadowColor = isSelected ? "#C4B5FD" : "#E4DBFA";
  const highlight = isSelected ? "#FFFFFF" : "#FFFFFF";

  return (
    <svg viewBox="0 0 140 82" className={className} style={{ width: "100%", height: "100%", display: "block", margin: "0 auto", overflow: "visible" }} xmlns="http://www.w3.org/2000/svg">
      {/* Cold Sweat Drops on Brow (Active / Hover - NO LIGHTNING!) */}
      <g className={styles.weatherEffect} fill="#3B82F6">
        <path className={styles.animSweat} d="M 115,26 C 115,26 111,32 111,35 C 111,37.2 112.8,39 115,39 C 117.2,39 119,37.2 119,35 C 119,32 115,26 115,26 Z"/>
        <path className={styles.animSweat} style={{ animationDelay: "0.55s" }} d="M 23,28 C 23,28 19,34 19,37 C 19,39.2 20.8,41 23,41 C 25.2,41 27,39.2 27,37 C 27,34 23,28 23,28 Z"/>
      </g>

      <g className={isSelected ? styles.animShiver : ""}>
        {/* Cloud Shadow Underlayer */}
        <path d="M 28,79 C 16,79 8,69 11,57 C 6,46 13,34 24,30 C 26,17 38,10 52,12 C 60,3 74,3 84,10 C 94,5 108,10 114,21 C 127,23 135,34 133,47 C 139,58 133,70 122,76 C 116,83 105,84 96,81 C 88,86 76,87 68,83 C 58,87 46,87 38,82 C 34,84 30,82 28,79 Z" fill={shadowColor}/>
        {/* Cloud Main Body */}
        <path d="M 28,75 C 16,75 8,65 11,53 C 6,42 13,30 24,26 C 26,13 38,6 52,8 C 60,-1 74,-1 84,6 C 94,1 108,6 114,17 C 127,19 135,30 133,43 C 139,54 133,66 122,72 C 116,79 105,80 96,77 C 88,82 76,83 68,79 C 58,83 46,83 38,78 C 34,80 30,78 28,75 Z" fill={bodyFill} stroke={strokeColor} strokeWidth="3.6" strokeLinejoin="round"/>
        
        {/* Highlights */}
        <path d="M 54,12 C 64,6 76,6 84,10 C 74,14 62,16 54,12 Z" fill={highlight} opacity="0.65"/>
        <ellipse cx="36" cy="22" rx="8" ry="4" fill={highlight} opacity="0.55" transform="rotate(-15 36 22)"/>

        {/* Wide Scared Trembling Eyes */}
        <circle cx="50" cy="45" r="8.2" fill="#1E1B4B"/>
        <circle cx="47.2" cy="42" r="3.4" fill="#FFFFFF"/>
        <circle cx="53" cy="48.5" r="1.5" fill="#FFFFFF"/>

        <circle cx="84" cy="45" r="8.2" fill="#1E1B4B"/>
        <circle cx="81.2" cy="42" r="3.4" fill="#FFFFFF"/>
        <circle cx="87" cy="48.5" r="1.5" fill="#FFFFFF"/>

        {/* Nervous High Eyebrows */}
        <path d="M 43,29 Q 50,24 58,31" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <path d="M 91,29 Q 84,24 76,31" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" fill="none"/>

        {/* Blushing Cheeks */}
        <ellipse cx="34" cy="53" rx="5.5" ry="3.5" fill="#C084FC" opacity={isSelected ? 0.8 : 0.6}/>
        <ellipse cx="100" cy="53" rx="5.5" ry="3.5" fill="#C084FC" opacity={isSelected ? 0.8 : 0.6}/>

        {/* Scared Open Trembling O Mouth with pink tongue */}
        <ellipse cx="67" cy="58" rx="5.5" ry="7.5" fill="#1E1B4B"/>
        <ellipse cx="67" cy="61" rx="3.5" ry="3.8" fill="#F472B6"/>
      </g>
    </svg>
  );
}

function AngryCloudSvg({ className, isSelected }: { className?: string; isSelected?: boolean }) {
  const bodyFill = isSelected ? "#FECACA" : "#FEF2F2";
  const strokeColor = isSelected ? "#DC2626" : "#F87171";
  const shadowColor = isSelected ? "#FCA5A5" : "#FDD8D8";
  const highlight = isSelected ? "#FFFFFF" : "#FFFFFF";

  return (
    <svg viewBox="0 0 140 98" className={className} style={{ width: "100%", height: "100%", display: "block", margin: "0 auto", overflow: "visible" }} xmlns="http://www.w3.org/2000/svg">
      {/* ⚡ LIGHTNING BOLTS (ONLY ON ANGRY!) + Fast Storm Rain 💧 */}
      <g className={styles.weatherEffect}>
        {/* Left Lightning Bolt ⚡ */}
        <polygon className={styles.animLightning} points="19,10 7,28 17,26 5,46 25,23 15,25" fill="#FBBF24" stroke="#B91C1C" strokeWidth="1.6" strokeLinejoin="round"/>
        {/* Right Lightning Bolt ⚡ */}
        <polygon className={styles.animLightning} style={{ animationDelay: "0.35s" }} points="121,10 133,28 123,26 135,46 115,23 125,25" fill="#FBBF24" stroke="#B91C1C" strokeWidth="1.6" strokeLinejoin="round"/>

        {/* Fast Angled Storm Rain 🌧️ (Red Drops) */}
        <g fill="#DC2626">
          <path className={styles.animStormRain} d="M 38,84 C 38,84 34,91 34,94 C 34,96.2 35.8,98 38,98 C 40.2,98 42,96.2 42,94 C 42,91 38,84 38,84 Z"/>
          <path className={styles.animStormRain} style={{ animationDelay: "0.2s" }} d="M 57,87 C 57,87 53,94 53,97 C 53,99.2 54.8,101 57,101 C 59.2,101 61,99.2 61,97 C 61,94 57,87 57,87 Z"/>
          <path className={styles.animStormRain} style={{ animationDelay: "0.4s" }} d="M 77,87 C 77,87 73,94 73,97 C 73,99.2 74.8,101 77,101 C 79.2,101 81,99.2 81,97 C 81,94 77,87 77,87 Z"/>
          <path className={styles.animStormRain} style={{ animationDelay: "0.15s" }} d="M 96,84 C 96,84 92,91 92,94 C 92,96.2 93.8,98 96,98 C 98.2,98 100,96.2 100,94 C 100,91 96,84 96,84 Z"/>
        </g>
      </g>

      {/* Cloud Shadow Underlayer */}
      <path d="M 28,79 C 16,79 8,69 11,57 C 6,46 13,34 24,30 C 26,17 38,10 52,12 C 60,3 74,3 84,10 C 94,5 108,10 114,21 C 127,23 135,34 133,47 C 139,58 133,70 122,76 C 116,83 105,84 96,81 C 88,86 76,87 68,83 C 58,87 46,87 38,82 C 34,84 30,82 28,79 Z" fill={shadowColor}/>
      {/* Cloud Main Body */}
      <path d="M 28,75 C 16,75 8,65 11,53 C 6,42 13,30 24,26 C 26,13 38,6 52,8 C 60,-1 74,-1 84,6 C 94,1 108,6 114,17 C 127,19 135,30 133,43 C 139,54 133,66 122,72 C 116,79 105,80 96,77 C 88,82 76,83 68,79 C 58,83 46,83 38,78 C 34,80 30,78 28,75 Z" fill={bodyFill} stroke={strokeColor} strokeWidth="3.6" strokeLinejoin="round"/>
      
      {/* Highlights */}
      <path d="M 54,12 C 64,6 76,6 84,10 C 74,14 62,16 54,12 Z" fill={highlight} opacity="0.65"/>
      <ellipse cx="36" cy="22" rx="8" ry="4" fill={highlight} opacity="0.55" transform="rotate(-15 36 22)"/>

      {/* Slanted Sharp Angry Eyebrows */}
      <path d="M 43,31 L 62,40" stroke="#7F1D1D" strokeWidth="4.5" strokeLinecap="round"/>
      <path d="M 91,31 L 72,40" stroke="#7F1D1D" strokeWidth="4.5" strokeLinecap="round"/>

      {/* Glaring Sharp Angry Eyes */}
      <circle cx="53" cy="46" r="7.2" fill="#7F1D1D"/>
      <circle cx="51.2" cy="44.2" r="2.4" fill="#FFFFFF"/>

      <circle cx="81" cy="46" r="7.2" fill="#7F1D1D"/>
      <circle cx="79.2" cy="44.2" r="2.4" fill="#FFFFFF"/>

      {/* Angry Red Cheeks */}
      <ellipse cx="35" cy="54" rx="6" ry="3.5" fill="#EF4444" opacity={isSelected ? 0.85 : 0.65}/>
      <ellipse cx="99" cy="54" rx="6" ry="3.5" fill="#EF4444" opacity={isSelected ? 0.85 : 0.65}/>

      {/* Roaring angry mouth with sharp teeth */}
      <path d="M 57,58 Q 67,51 77,58 Q 67,67 57,58 Z" fill="#7F1D1D" stroke="#7F1D1D" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M 62,55 L 64,58 L 66,55" fill="#FFFFFF"/>
      <path d="M 68,55 L 70,58 L 72,55" fill="#FFFFFF"/>
    </svg>
  );
}

function DisgustedCloudSvg({ className, isSelected }: { className?: string; isSelected?: boolean }) {
  const bodyFill = isSelected ? "#BBF7D0" : "#F0FDF4";
  const strokeColor = isSelected ? "#16A34A" : "#4ADE80";
  const shadowColor = isSelected ? "#86EFAC" : "#DCFCE7";
  const highlight = isSelected ? "#FFFFFF" : "#FFFFFF";

  return (
    <svg viewBox="0 0 140 82" className={className} style={{ width: "100%", height: "100%", display: "block", margin: "0 auto", overflow: "visible" }} xmlns="http://www.w3.org/2000/svg">
      {/* Distressed Sick Droplets (Active / Hover - NO LIGHTNING!) */}
      <g className={styles.weatherEffect} fill="#16A34A">
        <path className={styles.animRain} d="M 46,84 C 46,84 43,90 43,92.5 C 43,94.5 44.5,96 46.5,96 C 48.5,96 50,94.5 50,92.5 C 50,90 46,84 46,84 Z"/>
        <path className={styles.animRain} style={{ animationDelay: "0.3s" }} d="M 67,86 C 67,86 64,92 64,94.5 C 64,96.5 65.5,98 67.5,98 C 69.5,98 71,96.5 71,94.5 C 71,92 67,86 67,86 Z"/>
        <path className={styles.animRain} style={{ animationDelay: "0.6s" }} d="M 88,84 C 88,84 85,90 85,92.5 C 85,94.5 86.5,96 88.5,96 C 90.5,96 92,94.5 92,92.5 C 92,90 88,84 88,84 Z"/>
      </g>

      <g className={isSelected ? styles.animQueasy : ""}>
        {/* Cloud Shadow Underlayer */}
        <path d="M 28,79 C 16,79 8,69 11,57 C 6,46 13,34 24,30 C 26,17 38,10 52,12 C 60,3 74,3 84,10 C 94,5 108,10 114,21 C 127,23 135,34 133,47 C 139,58 133,70 122,76 C 116,83 105,84 96,81 C 88,86 76,87 68,83 C 58,87 46,87 38,82 C 34,84 30,82 28,79 Z" fill={shadowColor}/>
        {/* Cloud Main Body */}
        <path d="M 28,75 C 16,75 8,65 11,53 C 6,42 13,30 24,26 C 26,13 38,6 52,8 C 60,-1 74,-1 84,6 C 94,1 108,6 114,17 C 127,19 135,30 133,43 C 139,54 133,66 122,72 C 116,79 105,80 96,77 C 88,82 76,83 68,79 C 58,83 46,83 38,78 C 34,80 30,78 28,75 Z" fill={bodyFill} stroke={strokeColor} strokeWidth="3.6" strokeLinejoin="round"/>
        
        {/* Highlights */}
        <path d="M 54,12 C 64,6 76,6 84,10 C 74,14 62,16 54,12 Z" fill={highlight} opacity="0.65"/>
        <ellipse cx="36" cy="22" rx="8" ry="4" fill={highlight} opacity="0.55" transform="rotate(-15 36 22)"/>

        {/* Kawaii Squinting > < Eyes */}
        <path d="M 43,40 L 55,45 L 43,50" stroke="#14532D" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M 91,40 L 79,45 L 91,50" stroke="#14532D" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>

        {/* Center furrowed brow lines */}
        <path d="M 63,36 L 67,41" stroke="#14532D" strokeWidth="2.4" strokeLinecap="round"/>
        <path d="M 71,36 L 67,41" stroke="#14532D" strokeWidth="2.4" strokeLinecap="round"/>

        {/* Sickly green flushed cheeks */}
        <ellipse cx="34" cy="54" rx="6" ry="3.5" fill="#4ADE80" opacity={isSelected ? 0.85 : 0.65}/>
        <ellipse cx="100" cy="54" rx="6" ry="3.5" fill="#4ADE80" opacity={isSelected ? 0.85 : 0.65}/>

        {/* Wavy cringe mouth with tongue sticking out 👅 */}
        <path d="M 57,59 Q 62,63 66,59 Q 70,55 75,60" stroke="#14532D" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
        <path d="M 64,60 C 64,67 69,67 69,60 Z" fill="#F43F5E" stroke="#14532D" strokeWidth="1.6"/>
      </g>
    </svg>
  );
}

function StressedCloudSvg({ className, isSelected }: { className?: string; isSelected?: boolean }) {
  const bodyFill = isSelected ? "#FEF08A" : "#FEFCE8";
  const strokeColor = isSelected ? "#CA8A04" : "#FACC15";
  const shadowColor = isSelected ? "#FDE047" : "#FEF9C3";
  const highlight = isSelected ? "#FFFFFF" : "#FFFFFF";

  return (
    <svg viewBox="0 0 140 82" className={className} style={{ width: "100%", height: "100%", display: "block", margin: "0 auto", overflow: "visible" }} xmlns="http://www.w3.org/2000/svg">
      {/* Dripping Exhaustion Sweat drop on brow (Active / Hover - NO LIGHTNING!) */}
      <g className={styles.weatherEffect} fill="#3B82F6">
        <path className={styles.animSweat} d="M 112,25 C 112,25 108,31 108,34 C 108,36.2 109.8,38 112,38 C 114.2,38 116,36.2 116,34 C 116,31 112,25 112,25 Z"/>
      </g>

      <g className={isSelected ? styles.animWeary : ""}>
        {/* Cloud Shadow Underlayer */}
        <path d="M 28,79 C 16,79 8,69 11,57 C 6,46 13,34 24,30 C 26,17 38,10 52,12 C 60,3 74,3 84,10 C 94,5 108,10 114,21 C 127,23 135,34 133,47 C 139,58 133,70 122,76 C 116,83 105,84 96,81 C 88,86 76,87 68,83 C 58,87 46,87 38,82 C 34,84 30,82 28,79 Z" fill={shadowColor}/>
        {/* Cloud Main Body */}
        <path d="M 28,75 C 16,75 8,65 11,53 C 6,42 13,30 24,26 C 26,13 38,6 52,8 C 60,-1 74,-1 84,6 C 94,1 108,6 114,17 C 127,19 135,30 133,43 C 139,54 133,66 122,72 C 116,79 105,80 96,77 C 88,82 76,83 68,79 C 58,83 46,83 38,78 C 34,80 30,78 28,75 Z" fill={bodyFill} stroke={strokeColor} strokeWidth="3.6" strokeLinejoin="round"/>
        
        {/* Highlights */}
        <path d="M 54,12 C 64,6 76,6 84,10 C 74,14 62,16 54,12 Z" fill={highlight} opacity="0.65"/>
        <ellipse cx="36" cy="22" rx="8" ry="4" fill={highlight} opacity="0.55" transform="rotate(-15 36 22)"/>

        {/* Droopy Heavy Tired Eyelids */}
        {/* Left Eye */}
        <path d="M 42,44 Q 50,38 58,44" stroke="#713F12" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
        <path d="M 44,44 Q 50,53 56,44 Z" fill="#713F12"/>
        <circle cx="50" cy="46.5" r="1.4" fill="#FFFFFF"/>
        {/* Right Eye */}
        <path d="M 76,44 Q 84,38 92,44" stroke="#713F12" strokeWidth="3.2" strokeLinecap="round" fill="none"/>
        <path d="M 78,44 Q 84,53 90,44 Z" fill="#713F12"/>
        <circle cx="84" cy="46.5" r="1.4" fill="#FFFFFF"/>

        {/* Tired downturned sleepy brows */}
        <path d="M 43,34 Q 50,37 57,33" stroke="#713F12" strokeWidth="2.6" strokeLinecap="round" fill="none"/>
        <path d="M 77,33 Q 84,37 91,34" stroke="#713F12" strokeWidth="2.6" strokeLinecap="round" fill="none"/>

        {/* Blushing peach cheeks */}
        <ellipse cx="34" cy="53" rx="6" ry="3.5" fill="#FBBF24" opacity={isSelected ? 0.85 : 0.65}/>
        <ellipse cx="100" cy="53" rx="6" ry="3.5" fill="#FBBF24" opacity={isSelected ? 0.85 : 0.65}/>

        {/* Sleepy weary yawn mouth with pink tongue */}
        <path d="M 61,56 Q 67,64 73,56 Z" fill="#713F12" stroke="#713F12" strokeWidth="1.8" strokeLinejoin="round"/>
        <ellipse cx="67" cy="59" rx="3.8" ry="2.2" fill="#F472B6"/>
      </g>
    </svg>
  );
}

// (28 Unique Feeling Icons are imported from @/components/FeelingIcons)

// Meditating Zen Lotus Mascot Badge (Exact Clone from Reference Screenshot)
function MeditatingZenIcon({ className }: { className?: string }) {
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Soft cream-sage circular badge background */}
      <circle cx="38" cy="38" r="36" fill="#EAE9E1" />
      
      {/* Ambient background particles */}
      <circle cx="20" cy="24" r="1.2" fill="#B0AFA6" />
      <circle cx="56" cy="23" r="1.2" fill="#B0AFA6" />
      <circle cx="54" cy="54" r="1.2" fill="#B0AFA6" />
      
      {/* Zen Meditating Figure */}
      {/* Head */}
      <circle cx="38" cy="20" r="5.5" stroke="#161C52" strokeWidth="2.2" fill="none" />
      
      {/* Torso & Neck */}
      <path d="M34 28.5c-2.5 3-4 6.5-4 11.5h16c0-5-1.5-8.5-4-11.5" stroke="#161C52" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      {/* Chest subtle accents */}
      <circle cx="36" cy="34" r="0.8" fill="#161C52" />
      <circle cx="40" cy="34" r="0.8" fill="#161C52" />
      
      {/* Arms resting on knees with open palms */}
      <path d="M30 33L23 40.5l4 5.5h3" stroke="#161C52" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M46 33L53 40.5l-4 5.5h-3" stroke="#161C52" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      {/* Cross-legged Lotus Base */}
      <path d="M26 46c-4 2-5 5.5-1.5 8 3.5 2.5 17 2.5 27 0 3.5-2.5 2.5-6-1.5-8" stroke="#161C52" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M29 51c5.5 2 12.5 2 18 0" stroke="#161C52" strokeWidth="2" strokeLinecap="round" fill="none" />
      
      {/* Left Leaf sprig (Green watercolor leaves) */}
      <path d="M19 40c-1-3.5-4.5-4.5-4.5-4.5s0 4.5 2.5 6.5c1.2 1 2 1 2 1" fill="#7E9A70" stroke="#5E7852" strokeWidth="0.8" />
      <path d="M18 43.5c-2.5 1-4.5-.5-4.5-.5s1 3.5 3.5 4c1.2.2 2-.5 2-.5" fill="#7E9A70" stroke="#5E7852" strokeWidth="0.8" />
      
      {/* Right Leaf sprig (Green watercolor leaves) */}
      <path d="M57 40c1-3.5 4.5-4.5 4.5-4.5s0 4.5-2.5 6.5c-1.2 1-2 1-2 1" fill="#7E9A70" stroke="#5E7852" strokeWidth="0.8" />
      <path d="M58 43.5c2.5 1 4.5-.5 4.5-.5s-1 3.5-3.5 4c-1.2.2-2-.5-2-.5" fill="#7E9A70" stroke="#5E7852" strokeWidth="0.8" />
    </svg>
  );
}

// Eucalyptus / Olive Branch Decorative SVG (Realistic watercolor leafy stem on the right of the card)
function BotanicalBranchSvg({ className }: { className?: string }) {
  return (
    <svg width="48" height="74" viewBox="0 0 48 74" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Stem */}
      <path d="M18 72C22 55 25 35 34 4" stroke="#687C5E" strokeWidth="1.8" strokeLinecap="round" />
      {/* Bottom Left Leaf */}
      <path d="M20 58C12 56 10 47 18 45C22 44 22 52 20 58Z" fill="#93A686" stroke="#5F7350" strokeWidth="0.8" />
      {/* Bottom Right Leaf */}
      <path d="M22 53C31 50 35 43 28 39C23 36 21 47 22 53Z" fill="#A4B797" stroke="#5F7350" strokeWidth="0.8" />
      {/* Mid Left Leaf */}
      <path d="M24 40C15 37 14 29 20 27C25 25 26 33 24 40Z" fill="#889C7B" stroke="#5F7350" strokeWidth="0.8" />
      {/* Mid Right Leaf */}
      <path d="M27 35C35 31 37 23 31 21C26 19 25 28 27 35Z" fill="#9EAF90" stroke="#5F7350" strokeWidth="0.8" />
      {/* Top Left Leaf */}
      <path d="M30 23C23 19 24 13 28 12C32 11 32 18 30 23Z" fill="#889C7B" stroke="#5F7350" strokeWidth="0.8" />
      {/* Top Right Leaf */}
      <path d="M32 18C38 14 39 8 35 7C31 6 31 13 32 18Z" fill="#A4B797" stroke="#5F7350" strokeWidth="0.8" />
      {/* Apex Tip Leaf */}
      <path d="M34 4C32 1 36 0 37 2C38 4 36 5 34 4Z" fill="#718663" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MOOD CONFIGS & FEELINGS HIERARCHY (EXACT 28 FEELINGS & 56 CHIPS PER FEELINGS WHEEL)
// ─────────────────────────────────────────────────────────────────────────────

export const MOOD_HIERARCHY: Record<MainMoodFamily, MoodFamilyConfig> = {
  Sad: {
    name: "Sad",
    label: "Sad",
    feelings: [
      { id: "lonely", name: "Lonely", targetMood: "Connected / Accepted", actionTitle: "60-second mood boost:", actionDesc: "Send a low-pressure message: “Thinking of you. Hope you’re okay.” No big explanation needed.", iconSrc: "/moods/pairs/Sad_Lonely.png", icon: LonelyIcon, chips: ["Isolated", "Abandoned"] },
      { id: "vulnerable", name: "Vulnerable", targetMood: "Protected & Safe", actionTitle: "60-sec Safe Haven Breath", actionDesc: "Place one hand on your chest, one on your belly. Breathe softly and remind yourself you are safe in this moment.", iconSrc: "/moods/pairs/Sad_Vulnerable.png", icon: VulnerableIcon, chips: ["Victimised", "Fragile"] },
      { id: "despair", name: "Despair", targetMood: "Hopeful & Anchored", actionTitle: "60-sec Grounding Anchor", actionDesc: "Feel the solid floor under your feet. Take three slow breaths, anchoring yourself into the present.", iconSrc: "/moods/pairs/Sad_Despair.png", icon: DespairIcon, chips: ["Grief", "Powerless"] },
      { id: "guilty", name: "Guilty", targetMood: "Forgiving & Light", actionTitle: "60-sec Compassionate Release", actionDesc: "Inhale gentleness, exhale self-blame. Acknowledge your humanity and give yourself grace.", iconSrc: "/moods/pairs/Sad_Guilty.png", icon: GuiltyIcon, chips: ["Remorseful", "Ashamed"] },
      { id: "depressed", name: "Depressed", targetMood: "Uplifted & Gentle", actionTitle: "60-sec Gentle Sun Breath", actionDesc: "Turn your face toward the light. Take four slow, spacious breaths to invite warmth back into your body.", iconSrc: "/moods/pairs/Sad_Depressed.png", icon: DepressedIcon, chips: ["Unseen", "Empty"] },
      { id: "hurt", name: "Hurt", targetMood: "Healing & Tender", actionTitle: "60-sec Heart-Healing Breath", actionDesc: "Gently place your hand over your heart. Breathe softly into the tenderness for 60 seconds.", iconSrc: "/moods/pairs/Sad_Hurt.png", icon: HurtIcon, chips: ["Embarrassed", "Disappointed"] },
    ],
  },
  Fearful: {
    name: "Fearful",
    label: "Fearful",
    feelings: [
      { id: "scared", name: "Scared", targetMood: "Safe & Grounded", actionTitle: "60-sec 5-4-3-2-1 Sensory Grounding", actionDesc: "Name 5 things you can see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.", iconSrc: "/moods/pairs/Fearful_Scared.png", icon: ScaredIcon, chips: ["Helpless", "Frightened"] },
      { id: "anxious", name: "Anxious", targetMood: "Centred & Calm", actionTitle: "60-sec Physiological Sigh", actionDesc: "Take two quick deep inhales through your nose, then one long slow exhale through your mouth.", iconSrc: "/moods/pairs/Fearful_Anxious.png", icon: AnxiousIcon, chips: ["Concerned", "Worried"] },
      { id: "insecure", name: "Insecure", targetMood: "Confident & Rooted", actionTitle: "60-sec Posture Power Shift", actionDesc: "Roll shoulders back, lift chest, take three expansive deep breaths of self-assurance.", iconSrc: "/moods/pairs/Fearful_Insecure.png", icon: InsecureIcon, chips: ["Inadequate", "Inferior"] },
      { id: "weak", name: "Weak", targetMood: "Capable & Resilient", actionTitle: "60-sec Strength Recall", actionDesc: "Recall one hard thing you successfully overcame in the past. You are stronger than this moment.", iconSrc: "/moods/pairs/Fearful_Weak.png", icon: WeakIcon, chips: ["Worthless", "Insignificant"] },
      { id: "rejected", name: "Rejected", targetMood: "Accepted & Valued", actionTitle: "60-sec Self-Validation Grounding", actionDesc: "Place both feet flat, inhale worthiness, and say: 'My value is intrinsic and unchanged.'", iconSrc: "/moods/pairs/Fearful_Rejected.png", icon: RejectedIcon, chips: ["Excluded", "Persecuted"] },
      { id: "threatened", name: "Threatened", targetMood: "Protected & Secure", actionTitle: "60-sec Boundary Visualization", actionDesc: "Visualize a warm, golden shield of calm safety surrounding your entire body.", iconSrc: "/moods/pairs/Fearful_Threatened.png", icon: ThreatenedIcon, chips: ["Nervous", "Exposed"] },
    ],
  },
  Angry: {
    name: "Angry",
    label: "Angry",
    feelings: [
      { id: "let_down", name: "Let down", targetMood: "Self-Sufficient & Free", actionTitle: "60-sec Expectation Release", actionDesc: "Inhale patience, exhale resentment. Focus only on what is within your personal control.", iconSrc: "/moods/pairs/Angry_Let_down.png", icon: LetDownIcon, chips: ["Betrayed", "Resentful"] },
      { id: "humiliated", name: "Humiliated", targetMood: "Dignified & Proud", actionTitle: "60-sec Inner Dignity Reset", actionDesc: "Stand tall. Your worth is never decided by external judgment or transient moments.", iconSrc: "/moods/pairs/Angry_Humiliated.png", icon: HumiliatedIcon, chips: ["Disrespected", "Ridiculed"] },
      { id: "bitter", name: "Bitter", targetMood: "Peaceful & Light", actionTitle: "60-sec Forgiveness Breath", actionDesc: "Bitterness hurts only you. Breathe out the poison, breathe in spacious freedom.", iconSrc: "/moods/pairs/Angry_Bitter.png", icon: BitterIcon, chips: ["Indignant", "Violated"] },
      { id: "mad", name: "Mad", targetMood: "Cooled & Clear", actionTitle: "60-sec Ice-Water Palm Reset", actionDesc: "Clench your fists tight for 5 seconds, then release completely with a long cooling breath.", iconSrc: "/moods/pairs/Angry_Mad.png", icon: MadIcon, chips: ["Furious", "Jealous"] },
      { id: "aggressive", name: "Aggressive", targetMood: "Channelled & Calm", actionTitle: "60-sec Energy Discharge", actionDesc: "Step away. Shake out your hands and arms vigorously to discharge excess cortisol.", iconSrc: "/moods/pairs/Angry_Aggressive.png", icon: AggressiveIcon, chips: ["Provoked", "Hostile"] },
      { id: "frustrated", name: "Frustrated", targetMood: "Patient & Focused", actionTitle: "60-sec Step-Back Pause", actionDesc: "Pause the task. Take 3 deep belly breaths and reframe: 'One single step at a time.'", iconSrc: "/moods/pairs/Angry_Frustrated.png", icon: FrustratedIcon, chips: ["Infuriated", "Annoyed"] },
      { id: "distant", name: "Distant", targetMood: "Reconnected & Warm", actionTitle: "60-sec Warm Touch Check-in", actionDesc: "Rub palms together until warm, place over your eyes, and take a deep restoring breath.", iconSrc: "/moods/pairs/Angry_Distant.png", icon: DistantIcon, chips: ["Withdrawn", "Numb"] },
      { id: "critical", name: "Critical", targetMood: "Appreciative & Kind", actionTitle: "60-sec 3-Gratitudes Shift", actionDesc: "Name 3 small things that went right today or 3 qualities you appreciate about yourself.", iconSrc: "/moods/pairs/Angry_Critical.png", icon: CriticalIcon, chips: ["Sceptical", "Dismissive"] },
    ],
  },
  Disgusted: {
    name: "Disgusted",
    label: "Disgusted",
    feelings: [
      { id: "disapproving", name: "Disapproving", targetMood: "Open & Neutral", actionTitle: "60-sec Perspective Expansion", actionDesc: "Inhale non-judgment. Allow others their journey while keeping your inner peace intact.", iconSrc: "/moods/pairs/Disgusted_Disapproving.png", icon: DisapprovingIcon, chips: ["Judgmental", "Condemned"] },
      { id: "uncomfortable", name: "Uncomfortable", targetMood: "At Ease & Grounded", actionTitle: "60-sec Gentle Reset Breath", actionDesc: "Take 3 calming breaths, releasing tension from your chest and shoulders.", iconSrc: "/moods/pairs/Disgusted_Uncomfortable.png", icon: UncomfortableIcon, chips: ["Appalled", "Revolted"] },
      { id: "awful", name: "Awful", targetMood: "Restored & Renewed", actionTitle: "60-sec Fresh Air Inhale", actionDesc: "Step outside or open a window. Take 5 deep breaths of crisp fresh air into your lungs.", iconSrc: "/moods/pairs/Disgusted_Awful.png", icon: AwfulIcon, chips: ["Nauseated", "Detestable"] },
      { id: "repelled", name: "Repelled", targetMood: "Clean & Anchored", actionTitle: "60-sec Boundary Affirmation", actionDesc: "Visualize clear boundaries. You choose what energy to allow into your personal space.", iconSrc: "/moods/pairs/Disgusted_Repelled.png", icon: RepelledIcon, chips: ["Horrified", "Hesitant"] },
    ],
  },
  Bad: {
    name: "Bad",
    label: "Bad",
    feelings: [
      { id: "tired", name: "Tired", targetMood: "Energized & Rested", actionTitle: "60-sec Energy Palm Warmth", actionDesc: "Gently close your eyes, take 4 slow breaths, and give yourself permission to rest guilt-free.", iconSrc: "/moods/pairs/Bad_Tired.png", icon: TiredIcon, chips: ["Unfocused", "Sleepy"] },
      { id: "stressed", name: "Stressed", targetMood: "Decompressed", actionTitle: "60-sec Progressive Muscle Release", actionDesc: "Shrug shoulders to ears, hold 5s, drop them completely with a deep exhale.", iconSrc: "/moods/pairs/Bad_Stressed.png", icon: StressedIcon, chips: ["Out of control", "Overwhelmed"] },
      { id: "busy", name: "Busy", targetMood: "Present & Simple", actionTitle: "60-sec Monotask Pause", actionDesc: "Stop multitasking right now. Focus 100% of your attention on the single breath in front of you.", iconSrc: "/moods/pairs/Bad_Busy.png", icon: BusyIcon, chips: ["Rushed", "Pressured"] },
      { id: "bored", name: "Bored", targetMood: "Curious & Alive", actionTitle: "60-sec Curiosity Ignition", actionDesc: "Look around and notice 1 detail in your environment you have never paid attention to before.", iconSrc: "/moods/pairs/Bad_Bored.png", icon: BoredIcon, chips: ["Apathetic", "Indifferent"] },
    ],
  },
};

export const MAIN_MOOD_FAMILIES: MainMoodFamily[] = [
  "Sad",
  "Fearful",
  "Angry",
  "Disgusted",
  "Bad",
];

interface HeroSectionExactProps {
  onFlipTriggered?: (mood: string, feelings: string) => void;
  aiData?: {
    reframingQuote?: string;
    actionTitle?: string;
    actionSteps?: string[];
    scienceInsight?: string;
  } | null;
  aiLoading?: boolean;
}

export default function HeroSectionExact({
  onFlipTriggered,
  aiData,
  aiLoading = false,
}: HeroSectionExactProps) {
  // State
  const [selectedMood, setSelectedMood] = useState<MainMoodFamily>("Sad");
  const [selectedFeelingId, setSelectedFeelingId] = useState<string>("lonely");
  const [selectedChip, setSelectedChip] = useState<string>("Isolated");
  const [isFlipping, setIsFlipping] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [saveModalMessage, setSaveModalMessage] = useState("");
  const [saveModalLinksToReport, setSaveModalLinksToReport] = useState(false);
  const [hasFlipped, setHasFlipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedForCurrentFlip, setIsSavedForCurrentFlip] = useState(false);
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);
  const [counselorMoods, setCounselorMoods] = useState<CounselorPromptItem[]>(COUNSELOR_MOODS);
  const [freeFlipCount, setFreeFlipCount] = useState<number>(0);
  const [actionRotationIndex, setActionRotationIndex] = useState<Record<string, number>>({});
  const [showSecondVisitPopup, setShowSecondVisitPopup] = useState(false);
  const [dailyCheckInCount, setDailyCheckInCount] = useState(0);
  const [day2Reminder, setDay2Reminder] = useState<string>("");
  const saveModalCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!saveModalMessage) return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSaveModalMessage("");
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
    saveModalCloseRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [saveModalMessage]);

  // Keep an open tab aligned with the server's UTC calendar-day boundary.
  // The save handler also recalculates the date at click time as a fallback
  // for browsers that throttle timers while a tab or device is inactive.
  useEffect(() => {
    let rolloverTimer: ReturnType<typeof setTimeout>;

    const scheduleNextUtcDay = () => {
      const now = new Date();
      const nextUtcMidnight = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
      );

      rolloverTimer = setTimeout(() => {
        const today = new Date().toISOString().split("T")[0];
        const dailyData = JSON.parse(localStorage.getItem("moodflip_daily_checkins") || "{}");
        setDailyCheckInCount(Number(dailyData[today]) || 0);
        setIsSavedForCurrentFlip(false);
        setSaveModalMessage("");
        scheduleNextUtcDay();
      }, Math.max(nextUtcMidnight - Date.now() + 100, 100));
    };

    scheduleNextUtcDay();
    return () => clearTimeout(rolloverTimer);
  }, []);

  // Synchronize today's saved count and history from the database whenever the
  // page loads or the authenticated session changes. Local storage is only a
  // cache and must not remain authoritative after a database-side deletion.
  useEffect(() => {
    let active = true;

    const syncSavedMoodLifts = async (accessToken?: string) => {
      if (!accessToken) {
        if (active) setDailyCheckInCount(0);
        return;
      }

      try {
        const response = await fetch("/api/user/activity", {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok || !result.success || !result.reportProgress || !Array.isArray(result.checkins)) {
          throw new Error(result.error || "Unable to refresh saved Mood Lifts.");
        }

        if (!active) return;
        const today = new Date().toISOString().split("T")[0];
        const databaseDailyCount = Number(result.reportProgress.dailyCount) || 0;
        const dailyData = JSON.parse(localStorage.getItem("moodflip_daily_checkins") || "{}");
        dailyData[today] = databaseDailyCount;
        localStorage.setItem("moodflip_daily_checkins", JSON.stringify(dailyData));
        localStorage.setItem("moodflip_checkin_history", JSON.stringify(result.checkins));
        setDailyCheckInCount(databaseDailyCount);
      } catch (error) {
        console.error("Unable to synchronize saved Mood Lifts from the database:", error);
        if (active) setDailyCheckInCount(0);
      }
    };

    void supabase.auth.getSession().then(({ data }) => {
      void syncSavedMoodLifts(data.session?.access_token);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSavedMoodLifts(session?.access_token);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Outcome state that ONLY updates when user clicks "LIFT my MOOD" (or on initial load / reset)
  const [flippedOutcome, setFlippedOutcome] = useState<{
    targetMood: string;
    actionTitle: string;
    actionDesc: string;
  }>({
    targetMood: "Connected / Accepted",
    actionTitle: "60-second mood boost:",
    actionDesc: "Send a low-pressure message: “Thinking of you. Hope you’re okay.” No big explanation needed."
  });

  // Global Ads Setting State (controlled by Admin Panel - disabled globally by default)
  const [adsEnabled, setAdsEnabled] = useState<boolean>(false);
  const [popupSettings, setPopupSettings] = useState({
    enabled: true,
    targetAudience: "unregistered",
    frequencyHours: 12,
    maxDailyLimit: 2,
    showDelaySeconds: 4,
    // Spec §16 Popup #8 — exact wording
    modalTitle: "Save your MoodFlips?",
    modalDescription: "Create a free profile to save your moods, actions, and progress toward your 7-Day MoodFlip Report.",
    buttonText: "Create Free Profile",
    buttonLink: "/register",
    showMaybeLater: true,
  });
  const [mobileActiveView, setMobileActiveView] = useState<"input" | "outcome">("input");
  const outcomeRef = useRef<HTMLDivElement>(null);

  // Load and subscribe to Admin Ads toggle
  useEffect(() => {
    const checkAds = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("moodflip_ads_settings");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (typeof parsed.globalEnabled === "boolean") {
              setAdsEnabled(parsed.globalEnabled);
              return;
            }
          } catch (e) {}
        }
        setAdsEnabled(false);
      }
    };

    checkAds();
    window.addEventListener("moodflip_ads_updated", checkAds);
    window.addEventListener("storage", checkAds);
    return () => {
      window.removeEventListener("moodflip_ads_updated", checkAds);
      window.removeEventListener("storage", checkAds);
    };
  }, []);

  // Sync Mood Library from localStorage if updated by Admin (with version check for ChatGPT 2026 prompts)
  const syncMoodLibrary = () => {
    if (typeof window !== "undefined") {
      const PROMPTS_VERSION = "2026-09-28-chatgpt-prompts-v1";
      const cachedVersion = localStorage.getItem("moodflip_prompts_version");
      if (cachedVersion !== PROMPTS_VERSION) {
        localStorage.removeItem("moodflip_counselor_moods");
        localStorage.setItem("moodflip_prompts_version", PROMPTS_VERSION);
        setCounselorMoods(COUNSELOR_MOODS);
        return;
      }
      const stored = localStorage.getItem("moodflip_counselor_moods");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCounselorMoods(parsed);
          }
        } catch (e) {}
      }
    }
  };

  useEffect(() => {
    syncMoodLibrary();
    if (typeof window !== "undefined") {
      const savedCount = parseInt(localStorage.getItem("moodflip_free_flip_count") || "0", 10);
      setFreeFlipCount(savedCount);

      // Load live Admin Popup Settings
      let currentPopupConfig = popupSettings;
      const savedPopupCfg = localStorage.getItem("moodflip_popup_settings");
      if (savedPopupCfg) {
        try {
          currentPopupConfig = { ...popupSettings, ...JSON.parse(savedPopupCfg) };
          setPopupSettings(currentPopupConfig);
        } catch (e) {}
      }

      // ── Admin-Controlled Profile Invitation Popup ──
      // Joy's Revision P587-P590: "I do not want any popups when I open MoodFlip!"
      // Track site visits for analytics, but NEVER auto-popup on initial page load / open.
      const visitCountRaw = localStorage.getItem('moodflip_site_visit_count');
      const visitCount = visitCountRaw ? parseInt(visitCountRaw, 10) : 0;
      localStorage.setItem('moodflip_site_visit_count', String(visitCount + 1));
      setShowSecondVisitPopup(false);

      // ── Section 8: Load saved action rotation indexes ──
      try {
        const savedRotations = localStorage.getItem("moodflip_action_rotations");
        if (savedRotations) {
          setActionRotationIndex(JSON.parse(savedRotations));
        }
      } catch (e) {}

    }

    const handlePopupSettingsUpdate = () => {
      if (typeof window !== "undefined") {
        const savedPopupCfg = localStorage.getItem("moodflip_popup_settings");
        if (savedPopupCfg) {
          try { setPopupSettings(prev => ({ ...prev, ...JSON.parse(savedPopupCfg) })); } catch (e) {}
        }
      }
    };

    window.addEventListener("moodflip_popup_settings_updated", handlePopupSettingsUpdate);
    window.addEventListener("storage", handlePopupSettingsUpdate);
    return () => {
      window.removeEventListener("moodflip_popup_settings_updated", handlePopupSettingsUpdate);
      window.removeEventListener("storage", handlePopupSettingsUpdate);
    };
  }, []);

  // Update outcome when AI data arrives after flip
  useEffect(() => {
    if (aiData?.actionTitle || aiData?.reframingQuote) {
      setFlippedOutcome(prev => ({
        targetMood: aiData.reframingQuote ? (activeFeeling.targetMood || prev.targetMood) : prev.targetMood,
        actionTitle: aiData.actionTitle || prev.actionTitle,
        actionDesc: (aiData.actionSteps && aiData.actionSteps.length > 0) ? aiData.actionSteps.join(" ") : prev.actionDesc
      }));
    }
  }, [aiData]);

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Derived Active Config
  const activeMoodConfig = MOOD_HIERARCHY[selectedMood];
  const activeFeeling =
    activeMoodConfig.feelings.find((f) => f.id === selectedFeelingId) ||
    activeMoodConfig.feelings[0];

  // Match with Counselor Library
  const findMatchingLibraryMood = (): CounselorPromptItem | undefined => {
    const exactNameMatch = counselorMoods.find(
      (m) =>
        m.name.toLowerCase() === activeFeeling.name.toLowerCase() ||
        m.name.toLowerCase() === selectedChip.toLowerCase()
    );
    if (exactNameMatch) return exactNameMatch;

    const feelingTagMatch = counselorMoods.find((m) =>
      m.feelings?.some(
        (f) =>
          f.toLowerCase() === activeFeeling.name.toLowerCase() ||
          f.toLowerCase() === selectedChip.toLowerCase()
      )
    );
    if (feelingTagMatch) return feelingTagMatch;

    return counselorMoods.find((m) => m.category === selectedMood);
  };

  const matchedLibraryMood = findMatchingLibraryMood();

  // Handlers
  const handleMoodSelect = (mood: MainMoodFamily) => {
    setSelectedMood(mood);
    const newFeelings = MOOD_HIERARCHY[mood].feelings;
    if (newFeelings.length > 0) {
      setSelectedFeelingId(newFeelings[0].id);
      setSelectedChip(newFeelings[0].chips[0] || newFeelings[0].name);
    }
  };

  const handleFeelingSelect = (feeling: ThirdLayerFeeling) => {
    setSelectedFeelingId(feeling.id);
    if (feeling.chips && feeling.chips.length > 0) {
      setSelectedChip(feeling.chips[0]);
    }
  };

  const handleChipSelect = (chip: string) => {
    setSelectedChip(chip);
  };

  const handleSaveToProfile = async () => {
    if (typeof window === "undefined") return;
    if (isSaving) return; // Prevent double-click

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setShowAuthRequiredModal(true);
      return;
    }

    // ── Spec v4: Enforce max 3 saved check-ins per calendar day ──
    const today = new Date().toISOString().split("T")[0];
    const dailyData = JSON.parse(localStorage.getItem("moodflip_daily_checkins") || "{}");

    setIsSaving(true);

    try {
      const response = await fetch("/api/user/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          checkin: {
            mood: selectedMood,
            feeling: `${activeFeeling.name} (${selectedChip})`,
            target_mood: displayedTransformedMood,
            action_title: displayedActionTitle,
            action_desc: displayedActionDesc,
          }
        })
      });
      const result = await response.json();

      // The server remains authoritative in case this browser's saved count is
      // stale (for example, when Mood Lifts were saved on another device).
      if (response.status === 409) {
        const limitCount = Number(result.dailyCount) || 3;
        dailyData[today] = limitCount;
        localStorage.setItem("moodflip_daily_checkins", JSON.stringify(dailyData));
        setDailyCheckInCount(limitCount);
        notify.info(DAILY_MOOD_LIFT_LIMIT_MESSAGE);
        return;
      }

      if (!response.ok || !result.success || !result.checkin || !result.reportProgress) {
        throw new Error(result.error || "Your Mood Lift could not be saved. Please try again.");
      }

      // Cache only a database-confirmed record. This keeps reports available
      // offline without claiming that an unsuccessful server request was saved.
      const existingRaw = JSON.parse(localStorage.getItem("moodflip_checkin_history") || "[]");
      const existing = Array.isArray(existingRaw) ? existingRaw : [];
      const updated = [
        result.checkin,
        ...existing.filter((item: { id?: string }) => item.id !== result.checkin.id),
      ].slice(0, 100);
      localStorage.setItem("moodflip_checkin_history", JSON.stringify(updated));

      const newCount = Number(result.dailyCount) || 1;
      dailyData[today] = newCount;
      localStorage.setItem("moodflip_daily_checkins", JSON.stringify(dailyData));
      setDailyCheckInCount(newCount);

      // The backend derives both values from saved database records. Multiple
      // Mood Lifts on one date therefore advance the daily count but not days.
      const qualifyingDays = Number(result.reportProgress.qualifyingDays) || 0;
      const daysSaved = Math.min(qualifyingDays, 7);
      const totalSaved = Number(result.reportProgress.totalCount) || 0;
      const reachedSixDayMilestone = qualifyingDays === 6 && newCount === 1;
      const reachedSevenDayMilestone = qualifyingDays === 7 && newCount === 1;

      // Spec §16 Popup #3: Progress message after saving a Mood Flip
      let progressNote = `Saved.\n\nToday's Mood Lifts: [${newCount}/3]\n\n7-Day Report progress: Day [${daysSaved}] of 7`;

      if (totalSaved === 1) {
        // Spec §16 Popup #1: After first saved Mood Flipping
        progressNote = "Your first Mood Lift is saved.\n\nYou can save up to 3 Mood Lifts per day. After 7 days, you’ll be able to download your personalised 7-Day MoodFlip Report.";
      } else if (reachedSixDayMilestone) {
        progressNote = "You’re almost there — 6 of 7 qualifying days complete.\n\nTo unlock your report, save at least one Mood Lift on one more calendar day. Extra saves today won’t add another qualifying day. Days do not need to be consecutive.";
      } else if (reachedSevenDayMilestone) {
        // Spec §16 Popup #5: 7-day report ready
        progressNote = "Your 7-Day MoodFlip Report is ready.\n\nDownload your personalised report with your saved moods, positive moods, 60-second actions, and mood pattern summary.";
      } else if (result.showDailyReminder && qualifyingDays < 6) {
        // The specification leaves the trigger open. Show this only after a
        // successful save. The backend claims it once per user and UTC day.
        setDay2Reminder("You're building your 7-Day MoodFlip Report. Save up to 3 Mood Lifts per day. Your personalized report will be available after 7 days for US$7.");
      }

      const shouldShowSaveModal = totalSaved === 1 || reachedSixDayMilestone || reachedSevenDayMilestone;

      if (shouldShowSaveModal) {
        setSaveModalMessage(progressNote);
        setSaveModalLinksToReport(reachedSevenDayMilestone);
        notify.success("Your Mood Lift has been saved successfully.");
      } else {
        setSaveModalMessage("");
        setSaveModalLinksToReport(false);
        notify.success(progressNote.replace(/\n+/g, " "), { duration: 7000 });
      }
      setIsSavedForCurrentFlip(true);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Your Mood Lift could not be saved. Please try again.");
      setIsSavedForCurrentFlip(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFlip = () => {
    syncMoodLibrary();

    setHasFlipped(true);
    setIsSavedForCurrentFlip(false); // Reset button back to purple '💾 Save My Profile' for the new flip
    setIsFlipping(true);
    setTimerSeconds(60);
    setIsTimerRunning(false);

    // Get current mood identifier and rotating action from live Counselor library
    const currentMoodKey = matchedLibraryMood?.id || activeFeeling.id || selectedMood;
    const availableActions = matchedLibraryMood?.actions && matchedLibraryMood.actions.length > 0 
      ? matchedLibraryMood.actions 
      : (matchedLibraryMood?.actionDesc ? [matchedLibraryMood.actionDesc] : (activeFeeling.actionDesc ? [activeFeeling.actionDesc] : []));

    const currentIndex = actionRotationIndex[currentMoodKey] || 0;
    const chosenAction = availableActions.length > 0 
      ? availableActions[currentIndex % availableActions.length]
      : "Breathe in for 4, breathe out for 6. Repeat 6 times while relaxing your jaw and shoulders.";

    // Advance rotation index for subsequent flips (persisted to localStorage)
    if (availableActions.length > 1) {
      const nextIndex = (currentIndex + 1) % availableActions.length;
      setActionRotationIndex(prev => {
        const nextState = {
          ...prev,
          [currentMoodKey]: nextIndex
        };
        try {
          localStorage.setItem("moodflip_action_rotations", JSON.stringify(nextState));
        } catch (e) {}
        return nextState;
      });
    }

    // Compute and update outcome prioritizing Google Sheet synced library
    const newTargetMood =
      matchedLibraryMood?.target || activeFeeling.targetMood || "Peaceful";
    const newActionTitle =
      matchedLibraryMood?.actionTitle ||
      activeFeeling.actionTitle ||
      "60-sec action to get to a peaceful mood";

    setFlippedOutcome({
      targetMood: newTargetMood,
      actionTitle: newActionTitle,
      actionDesc: chosenAction,
    });

    if (onFlipTriggered) {
      onFlipTriggered(selectedMood, `${activeFeeling.name} (${selectedChip})`);
    }

    setMobileActiveView("outcome");

    setTimeout(() => {
      setIsFlipping(false);
    }, 600);
  };

  // Outcome texts rendered on right panel (only changes when user flips)
  const displayedTransformedMood = flippedOutcome.targetMood;
  const displayedActionTitle = flippedOutcome.actionTitle;
  const displayedActionDesc = flippedOutcome.actionDesc;

  return (
    <section className={styles.heroWrapper} id="hero-section">

      {/* ── Spec §16 Popup #2: Daily reminder from 2nd saved day onward ── */}
      {day2Reminder && (
        <div style={{
          maxWidth: 900,
          margin: "0 auto 16px auto",
          background: "#F2ECFB",
          border: "1px solid #D8C7F0",
          borderRadius: 16,
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
          color: "#3D2D5E",
          fontSize: 13.5,
          lineHeight: 1.45,
          fontWeight: 600,
          boxShadow: "0 2px 10px rgba(116, 100, 172, 0.08)"
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🌱</span>
            {day2Reminder}
          </span>
          <button
            type="button"
            onClick={() => setDay2Reminder("")}
            style={{
              background: "none",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
              color: "#7666AB",
              padding: "2px 6px",
              lineHeight: 1,
              flexShrink: 0
            }}
            aria-label="Dismiss reminder"
          >×</button>
        </div>
      )}

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <div className={styles.workspaceRow}>

        {/* ── CENTRAL APP CARD ── */}
        <div className={styles.mainCard}>

          {/* Mobile Tab Switcher (Visible on Mobile only - Allows instant switch without scrolling) */}
          <div className={styles.mobileHeroToggle}>
            <button
              type="button"
              className={`${styles.mobileHeroTab} ${mobileActiveView === "input" ? styles.mobileHeroTabActive : ""}`}
              onClick={() => setMobileActiveView("input")}
            >
              <span>☁️</span> 1. Select Mood
            </button>
            <button
              type="button"
              className={`${styles.mobileHeroTab} ${mobileActiveView === "outcome" ? styles.mobileHeroTabActive : ""}`}
              onClick={() => setMobileActiveView("outcome")}
            >
              <span>🌅</span> 2. Result &amp; Action ✨
            </button>
          </div>

          {/* 1. LEFT COLUMN: 3-Step Guide (Aligned with Layer 1, Layer 2, Layer 3) */}
          <div className={`${styles.leftStepsCol} ${mobileActiveView === "outcome" ? styles.mobileHiddenOnOutcome : ""}`}>
            <div className={styles.mobileStepsRow}>
              {/* Step 1: Aligned with Clouds */}
              <div className={`${styles.stepBox} ${styles.stepBox1}`}>
                <div className={styles.stepBadge}>Step 1</div>
                <div className={styles.stepTitle}>
                  How are you feeling?
                </div>
                <div className={styles.stepperConnector}>
                  <div className={styles.stepperLine} />
                  <svg className={styles.stepperArrow} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1.5V10.5M6 10.5L2.5 7M6 10.5L9.5 7" stroke="#7464AC" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* Step 2: Aligned with Feeling Cards */}
              <div className={`${styles.stepBox} ${styles.stepBox2} ${activeMoodConfig.feelings.length <= 4 ? styles.stepBox2SingleRow : ""}`}>
                <div className={styles.stepBadge}>Step 2</div>
                <div className={styles.stepTitle}>
                  Which feeling fits best?
                </div>
                <div className={styles.stepperConnector}>
                  <div className={styles.stepperLine} />
                  <svg className={styles.stepperArrow} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 1.5V10.5M6 10.5L2.5 7M6 10.5L9.5 7" stroke="#7464AC" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* Step 3: Aligned directly with Chips Row */}
              <div className={`${styles.stepBox} ${styles.stepBox3}`}>
                <div className={styles.stepBadge}>Step 3</div>
                <div className={styles.stepTitle}>
                  Be more specific.
                </div>
              </div>
            </div>
          </div>

          {/* 2. MIDDLE COLUMN: Interactive Mood Tool */}
          <div className={`${styles.centerMoodCol} ${mobileActiveView === "outcome" ? styles.mobileHiddenOnOutcome : ""}`}>

            {/* LAYER 1: 5 Clouds Row */}
            <div className={styles.cloudRow} role="group" aria-label="1. Choose Main Mood Cloud">
              {MAIN_MOOD_FAMILIES.map((mood) => {
                const isSelected = selectedMood === mood;
                return (
                  <button
                    key={mood}
                    type="button"
                    className={`${styles.cloudBtn} ${isSelected ? styles.cloudBtnActive : ""}`}
                    onClick={() => handleMoodSelect(mood)}
                    aria-pressed={isSelected}
                  >
                    <div className={styles.cloudSvgWrap}>
                      <img
                        src={MAGNIFIC_CLOUDS[mood].src}
                        alt={MAGNIFIC_CLOUDS[mood].alt}
                        className={styles.magnificCloudImg}
                        loading="eager"
                      />
                    </div>
                    <span className={styles.cloudName}>
                      {mood}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* LAYER 2: Grid of Feeling Cards (3 cols for 6, 4 cols for 4 or 8) */}
            <div
              className={`${styles.feelingsGrid} ${
                activeMoodConfig.feelings.length === 6
                  ? styles.feelingsGrid6
                  : activeMoodConfig.feelings.length === 4
                  ? styles.feelingsGrid4
                  : styles.feelingsGrid8
              }`}
              role="group"
              aria-label="2. Choose Specific Feeling Card"
            >
              {activeMoodConfig.feelings.map((feeling) => {
                const isSelected = selectedFeelingId === feeling.id;
                const IconComp = feeling.icon;
                return (
                  <button
                    key={feeling.id}
                    type="button"
                    className={`${styles.feelingCard} ${isSelected ? styles.feelingCardActive : ""}`}
                    onClick={() => handleFeelingSelect(feeling)}
                    aria-pressed={isSelected}
                  >
                    <div className={styles.feelingIconWrap}>
                      {feeling.iconSrc ? (
                        <img
                          src={feeling.iconSrc}
                          alt=""
                          className={styles.feelingIconImg}
                          loading="eager"
                        />
                      ) : IconComp ? (
                        <IconComp />
                      ) : null}
                    </div>
                    <span className={styles.feelingName}>{feeling.name}</span>
                  </button>
                );
              })}
            </div>

            {/* LAYER 3: Specific Feeling Chips Enclosed Box */}
            <div className={styles.chipsBoxContainer}>
              <div className={styles.chipsRow} role="radiogroup" aria-label="3. Pick Exact Specific Feeling Chip">
                {activeFeeling.chips.map((chip) => {
                  const isSelected = selectedChip === chip;
                  return (
                    <button
                      key={chip}
                      type="button"
                      className={`${styles.chipPill} ${isSelected ? styles.chipPillActive : ""}`}
                      onClick={() => handleChipSelect(chip)}
                      role="radio"
                      aria-checked={isSelected}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Divider Hearts Top and Bottom */}
          <div className={styles.dividerHeartTop}>♡</div>
          <div className={styles.dividerHeartBottom}>♡</div>

          {/* 3. CENTER OVERLAPPING LIFT my MOOD ARROW BUTTON (Joy's original glossy design, updated text) */}
          <button
            type="button"
            className={`${styles.flipMoodArrowBtn} ${isFlipping ? styles.flipMoodArrowFlipping : ""} ${mobileActiveView === "outcome" ? styles.mobileHiddenOnOutcome : ""}`}
            onClick={handleFlip}
            disabled={aiLoading}
            aria-label="LIFT my MOOD"
          >
            <img
              src="/flip-my-mood-arrow.png"
              alt="LIFT my MOOD"
              className={styles.flipMoodArrowImg}
            />
          </button>

          {/* 4. RIGHT COLUMN: Outcome Display & Action Card */}
          <div className={`${styles.rightOutcomeCol} ${mobileActiveView === "input" ? styles.mobileHiddenOnInput : ""}`} ref={outcomeRef} id="outcome-panel">
            {/* Sunrise Landscape Art Background using user-provided artwork */}
            <div className={styles.sunburstBg} aria-hidden="true">
              <img
                src="/sunrise-artwork.png"
                alt="Sunrise Artwork"
                className={styles.sunriseArtworkImg}
              />
            </div>

            {/* Outcome Header */}
            <div className={styles.outcomeTopHeader}>
              <div className={styles.sunTopHeart}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E66A6A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <div className={styles.outcomeSubtitle}>Your positive mood:</div>
              <h2 className={styles.outcomeMoodHeading}>
                {displayedTransformedMood.includes(" & ") ? (
                  <>
                    <span className={styles.headingLine1}>
                      {displayedTransformedMood.split(" & ")[0]} &amp;
                    </span>
                    <span className={styles.headingLine2}>
                      {displayedTransformedMood.split(" & ")[1]}
                      <span className={styles.headingLeafBranch}>
                        <img
                          src="/action-botanical-branch.png"
                          alt="Leaf Branch"
                          className={styles.headingLeafImg}
                        />
                      </span>
                    </span>
                  </>
                ) : (
                  <span className={styles.headingLine1}>
                    {displayedTransformedMood}
                    <span className={styles.headingLeafBranch}>
                      <img
                        src="/action-botanical-branch.png"
                        alt="Leaf Branch"
                        className={styles.headingLeafImg}
                      />
                    </span>
                  </span>
                )}
              </h2>

              {/* Sub-divider line with delicate center heart */}
              <div className={styles.outcomeUnderlineHeart}>
                <span className={styles.outcomeDividerLine} />
                <span className={styles.outcomeDividerHeart}>♡</span>
                <span className={styles.outcomeDividerLine} />
              </div>
            </div>

            {/* 60-Second Action Floating Card (Exact Clone from Reference) */}
            <div className={`${styles.actionFloatingCard} ${isFlipping ? styles.actionCardFlipping : ""}`}>
              <div className={styles.actionCardInner}>
                {/* Left: User-provided Zen Mascot PNG (ChatGPT Image 07_48_59 PM) */}
                <div className={styles.actionZenBadge}>
                  <img
                    src="/zen-mascot-orb.png?v=3"
                    alt="Zen Mascot"
                    className={styles.zenMascotImg}
                  />
                </div>

                <div className={styles.actionCardText}>
                  <div className={styles.actionCardTitle}>60-second mood boost:</div>
                  
                  {/* Subtle divider with centered tiny heart */}
                  <div className={styles.actionHeartDivider}>
                    <span className={styles.actionHeartLine} />
                    <span className={styles.actionSmallHeart}>♡</span>
                    <span className={styles.actionHeartLine} />
                  </div>

                  <p className={styles.actionCardDesc}>{displayedActionDesc}</p>
                </div>

                {/* Right: User-provided Botanical Branch PNG (ChatGPT Image 07_48_49 PM) */}
                <div className={styles.actionCardBotanical}>
                  <img
                    src="/action-botanical-branch.png?v=3"
                    alt="Botanical Leaf Branch"
                    className={styles.botanicalBranchImg}
                  />
                </div>
              </div>
            </div>

            {/* ── TABLET IN-CARD AD SPACE (Auto Ads Slot - hidden when ads disabled) ── */}
            <div className={styles.tabletInCardAdSpace} aria-label="Advertisement space">
              {adsEnabled ? (
                <AdBanner placement="planPageAd" />
              ) : (
                <div className={styles.adPlaceholderBox} />
              )}
            </div>

            {/* ── #20: SAVE my Mood Lift button (P274-P279: Hidden on first load, shown only after clicking LIFT my MOOD) ── */}
            {hasFlipped && (
              <div style={{
                position: "relative",
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                marginTop: 10,
              }}>
                <button
                  type="button"
                  onClick={handleSaveToProfile}
                  disabled={isSaving}
                  style={{
                    background: isSavedForCurrentFlip
                      ? "linear-gradient(135deg, #52A078 0%, #68B88E 100%)"
                      : "linear-gradient(135deg, #7E6BB0 0%, #9C7EC2 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 24,
                    padding: "9px 28px",
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: isSaving ? "not-allowed" : "pointer",
                    letterSpacing: 0.2,
                    boxShadow: isSavedForCurrentFlip
                      ? "0 4px 14px rgba(82, 160, 120, 0.3)"
                      : "0 4px 14px rgba(116, 100, 172, 0.28)",
                    transition: "all 0.25s ease",
                    opacity: isSaving ? 0.75 : 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                  onMouseOver={(e) => { if (!isSaving) e.currentTarget.style.transform = "scale(1.03)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                  aria-label="Save this Mood Lift to your profile"
                >
                  {isSaving ? (
                    "⏳ Saving..."
                  ) : isSavedForCurrentFlip ? (
                    "✓ Saved!"
                  ) : (
                    "SAVE my Mood Lift"
                  )}
                </button>

                <div style={{ fontSize: 10.5, color: "#8C7EA5", textAlign: "center", maxWidth: 220, fontWeight: 600 }}>
                  {dailyCheckInCount}/3 Mood Lifts saved today
                </div>
              </div>
            )}

            {/* Mobile-Only Switch Back Action Button (Zero Scrolling Needed) */}
            <div className={styles.mobileOutcomeActionsBar}>
              <button
                type="button"
                className={styles.mobileBackToMoodBtn}
                onClick={() => setMobileActiveView("input")}
              >
                <span>🔄</span> Flip Another Mood / Change Selection
              </button>
            </div>
          </div>
        </div>

        {/* ── DESKTOP RIGHT AD SPACE (Skyscraper slot per Spec & Audit) ── */}
        <aside className={styles.desktopRightAdSpace} aria-label="Advertisement Placeholder">
          {adsEnabled ? (
            <AdBanner placement="sidebarAd" />
          ) : (
            <div className={styles.adPlaceholderSkyscraper} />
          )}
        </aside>

      </div>

      {/* ── BOTTOM RESPONSIVE BANNER (Before supportive strip and footer per Spec & Audit) ── */}
      <div className={styles.bottomBannerAdSpace} aria-label="Advertisement Placeholder">
        {adsEnabled ? (
          <AdBanner placement="footerBanner" />
        ) : (
          <div className={styles.adPlaceholderBox} />
        )}
      </div>

      {/* ── MOTIVATIONAL BAR (Exact Sketch Match) ── */}
      <div className={styles.bottomMotivationalBar}>
        <div className={styles.motivationalItem}>
          <span className={styles.motivationalIconCircle}>
            <img
              src="/motivational-hands-heart.png"
              alt="Hands Holding Heart"
              className={styles.motivationalOrbImg}
            />
          </span>
          <div className={styles.motivationalText}>
            <span className={styles.motivationalTitle}>Small shifts can change how you feel.</span>
            <span className={styles.motivationalSub}>You've got this.</span>
          </div>
        </div>

        <div className={styles.motivationalCenterHeart}>
          <svg width="24" height="56" viewBox="0 0 24 56" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.desktopHeartSvg}>
            {/* Top Dotted Line */}
            <line x1="12" y1="2" x2="12" y2="18" stroke="#DACFE0" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 5" />
            {/* Center Peach Heart */}
            <path d="M12 35.5l-1.45-1.32C5.4 29.36 2 26.28 2 22.5 2 19.42 4.42 17 7.5 17c1.74 0 3.41.81 4.5 2.09C13.09 17.81 14.76 17 16.5 17 19.58 17 22 19.42 22 22.5c0 3.78-3.4 6.86-8.55 11.68L12 35.5z" fill="none" stroke="#EAA492" strokeWidth="1.8" />
            {/* Bottom Dotted Line */}
            <line x1="12" y1="38" x2="12" y2="54" stroke="#DACFE0" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 5" />
          </svg>
          <span className={styles.mobileMotivationalHeart}>♡</span>
        </div>

        <div className={styles.motivationalItem}>
          <span className={styles.motivationalIconCircle}>
            <img
              src="/motivational-leaves-orb.png"
              alt="Leaves in Orb"
              className={styles.motivationalOrbImg}
            />
          </span>
          <div className={styles.motivationalText}>
            <span className={styles.motivationalTitle}>Be kind to yourself.</span>
            <span className={styles.motivationalSub}>One choice at a time.</span>
          </div>
        </div>
      </div>

      {/* ── ADMIN-CONTROLLED PROFILE INVITATION POPUP ── */}
      {showSecondVisitPopup && popupSettings.enabled && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={popupSettings.modalTitle || "Welcome back! Create a free profile"}
          style={{
            position: "fixed", inset: 0, zIndex: 9000,
            background: "rgba(80,60,110,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSecondVisitPopup(false); }}
        >
          <div style={{
            background: "#FAF7FD",
            borderRadius: 22,
            padding: "32px 28px",
            maxWidth: 380,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 8px 40px rgba(116,100,172,0.25)",
            position: "relative",
          }}>
            <button
              onClick={() => setShowSecondVisitPopup(false)}
              style={{ position: "absolute", top: 14, right: 18, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#A899C0" }}
              aria-label="Close popup"
            >×</button>
            <div style={{ fontSize: 38, marginBottom: 10 }}>🌸</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#3D2D5E", marginBottom: 8 }}>
              {popupSettings.modalTitle || "Save your MoodFlips?"}
            </h2>
            <p style={{ fontSize: 14, color: "#5A4A7A", lineHeight: 1.6, marginBottom: 20 }}>
              {popupSettings.modalDescription || "Create a free profile to save your moods, actions, and progress toward your 7-Day MoodFlip Report."}
            </p>
            <a
              href={popupSettings.buttonLink || "/register"}
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #7464AC 0%, #9C6FBF 100%)",
                color: "#fff", borderRadius: 14, padding: "11px 28px",
                fontWeight: 700, fontSize: 14, textDecoration: "none",
                boxShadow: "0 3px 14px rgba(116,100,172,0.22)",
                marginBottom: 10,
              }}
            >
              {popupSettings.buttonText || "Create Free Profile"}
            </a>
            {popupSettings.showMaybeLater !== false && (
              <>
                <br />
                <button
                  onClick={() => setShowSecondVisitPopup(false)}
                  style={{ background: "none", border: "none", fontSize: 12, color: "#A899C0", cursor: "pointer", marginTop: 6 }}
                >
                  Maybe later
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MOOD LIFT SAVE CONFIRMATION MODAL ── */}
      {saveModalMessage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mood-lift-save-modal-title"
          style={{
            position: "fixed", inset: 0, zIndex: 9500,
            background: "rgba(30, 20, 50, 0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
            backdropFilter: "blur(4px)",
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setSaveModalMessage("");
          }}
        >
          <div style={{
            background: "#FEFAF8",
            borderRadius: 24,
            padding: "34px 28px 28px",
            maxWidth: 440,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 16px 48px rgba(79, 67, 139, 0.25)",
            border: "1px solid #E4DAD7",
            position: "relative",
          }}>
            <button
              ref={saveModalCloseRef}
              type="button"
              onClick={() => setSaveModalMessage("")}
              style={{ position: "absolute", top: 14, right: 17, background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#A49BA8", padding: 4 }}
              aria-label="Close save confirmation"
            >×</button>
            <div
              aria-hidden="true"
              style={{
                width: 52, height: 52, borderRadius: "50%", margin: "0 auto 14px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "#E7F5EC", color: "#33845B", fontSize: 27, fontWeight: 800,
              }}
            >✓</div>
            <h2 id="mood-lift-save-modal-title" style={{ fontSize: 22, fontWeight: 800, color: "#4F438B", marginBottom: 12, fontFamily: "serif" }}>
              Mood Lift saved
            </h2>
            <p style={{ fontSize: 14, color: "#5C527A", lineHeight: 1.65, marginBottom: 24, whiteSpace: "pre-line" }}>
              {saveModalMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                if (saveModalLinksToReport) {
                  window.location.assign("/profile?tab=My%207-Day%20Report");
                  return;
                }
                setSaveModalMessage("");
              }}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #7464AC 0%, #4F438B 100%)",
                color: "#fff", borderRadius: 14, padding: "12px 24px",
                border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(116,100,172,0.3)",
              }}
            >
              {saveModalLinksToReport ? "Download report" : "Got it"}
            </button>
          </div>
        </div>
      )}

      {/* ── AUTH REQUIRED TO SAVE MODAL ── */}
      {showAuthRequiredModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sign in required to save Mood Lifts"
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(30, 20, 50, 0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAuthRequiredModal(false); }}
        >
          <div style={{
            background: "#FEFAF8",
            borderRadius: 24,
            padding: "32px 28px",
            maxWidth: 400,
            width: "100%",
            textAlign: "center",
            boxShadow: "0 16px 48px rgba(79, 67, 139, 0.25)",
            border: "1px solid #E4DAD7",
            position: "relative",
          }}>
            <button
              onClick={() => setShowAuthRequiredModal(false)}
              style={{ position: "absolute", top: 16, right: 18, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#A49BA8" }}
              aria-label="Close"
            >×</button>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
            <h2 style={{ fontSize: 21, fontWeight: 800, color: "#1A143F", marginBottom: 8, fontFamily: "serif" }}>
              Sign In Required
            </h2>
            <p style={{ fontSize: 14, color: "#5C527A", lineHeight: 1.6, marginBottom: 24 }}>
              You can explore and flip moods freely! To save your Mood Lifts to your profile and build your 7-Day MoodFlip Report, please sign in or create a free profile.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a
                href="/login?redirect=/profile"
                style={{
                  display: "block",
                  background: "linear-gradient(135deg, #7464AC 0%, #4F438B 100%)",
                  color: "#fff", borderRadius: 14, padding: "12px 24px",
                  fontWeight: 700, fontSize: 14, textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(116,100,172,0.3)",
                }}
              >
                Sign In to My Profile
              </a>
              <a
                href="/register"
                style={{
                  display: "block",
                  background: "#F4EBF5",
                  color: "#4F438B", borderRadius: 14, padding: "11px 24px",
                  fontWeight: 700, fontSize: 14, textDecoration: "none",
                  border: "1px solid #E4DAD7",
                }}
              >
                Create Free Profile
              </a>
              <button
                type="button"
                onClick={() => setShowAuthRequiredModal(false)}
                style={{ background: "none", border: "none", fontSize: 13, color: "#A49BA8", cursor: "pointer", marginTop: 4 }}
              >
                Continue without saving
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
