import React, { useState } from "react";
import { 
  Heart, MessageCircle, Share2, Sparkles, Image, Globe, Tag, 
  Smile, Filter, Clock, Eye, Send, SendHorizontal, ThumbsUp, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Post, UserStatus } from "../types";

// Scenic preset template gallery for post builders
const DESIGN_DECK_PHOTOS = [
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&h=450", // Beach
  "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&h=450", // Cafe
  "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&h=450", // Studio
  "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&h=450", // Team Workspace
];

const REACTION_TYPES = [
  { label: "Like", emoji: "👍", color: "text-blue-500" },
  { label: "Love", emoji: "❤️", color: "text-red-500" },
  { label: "Haha", emoji: "😂", color: "text-amber-500" },
  { label: "Wow", emoji: "😮", color: "text-amber-500" },
  { label: "Sad", emoji: "😢", color: "text-blue-400" },
  { label: "Angry", emoji: "😡", color: "text-red-600" },
];

interface SocialSectionProps {
  currentUser: User;
  users: User[];
  posts: Post[];
  statuses: UserStatus[];
  onCreatePost: (text: string, imageUrl?: string, groupId?: string) => Promise<void>;
  onReactPost: (postId: string, reactionType: string) => Promise<void>;
  onCommentPost: (postId: string, commentText: string) => Promise<void>;
  onCreateStatus: (text: string, mediaUrl?: string) => Promise<void>;
}

export default function SocialSection({
  currentUser,
  users,
  posts,
  statuses,
  onCreatePost,
  onReactPost,
  onCommentPost,
  onCreateStatus
}: SocialSectionProps) {
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>("all");
  const [inputText, setInputText] = useState("");
  const [selectedPhotoTemplate, setSelectedPhotoTemplate] = useState<string | null>(null);
  const [showPhotoTray, setShowPhotoTray] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  // AI Assistant Drawer state variables
  const [showAiDraftHelper, setShowAiDraftHelper] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState("");
  const [aiStyleOption, setAiStyleOption] = useState("Professional Branding");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    refinedDraft: string;
    alternatives: string[];
    suggestedHashtags: string[];
  } | null>(null);

  // Status Player overlay states
  const [selectedStatusIndex, setSelectedStatusIndex] = useState<number | null>(null);
  const [statusCreatorOpen, setStatusCreatorOpen] = useState(false);
  const [newStatusText, setNewStatusText] = useState("");
  const [newStatusPic, setNewStatusPic] = useState(DESIGN_DECK_PHOTOS[0]);

  // Comments toggles
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInputText, setCommentInputText] = useState("");

  // Floating Reactions tooltip tracker
  const [hoveringPostId, setHoveringPostId] = useState<string | null>(null);

  const getAuthorDetails = (authorId: string) => {
    return users.find(u => u.id === authorId) || {
      name: "Anonymous User",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"
    };
  };

  const handlePostSubmit = () => {
    if (!inputText.trim() && !selectedPhotoTemplate) return;
    onCreatePost(inputText.trim(), selectedPhotoTemplate || undefined, selectedGroupId || undefined);
    setInputText("");
    setSelectedPhotoTemplate(null);
    setShowPhotoTray(false);
    setSelectedGroupId("");
  };

  // Call server-side post compiler assistant using real Gemini integration
  const handleAiPolish = async () => {
    if (!aiPromptInput.trim()) return;
    setAiLoading(true);
    try {
      const response = await fetch("/api/posts/ai-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPrompt: aiPromptInput.trim(), styleOption: aiStyleOption }),
      });
      const data = await response.json();
      if (data.success) {
        setAiResult(data);
      } else {
        alert(data.error || "Failed drafting content");
      }
    } catch (err) {
      console.error(err);
      alert("Error polishing your draft content.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleStatusSubmit = () => {
    if (!newStatusText.trim() && !newStatusPic) return;
    onCreateStatus(newStatusText.trim(), newStatusPic);
    setNewStatusText("");
    setStatusCreatorOpen(false);
  };

  const handlePostCommentSubmit = (postId: string) => {
    if (!commentInputText.trim()) return;
    onCommentPost(postId, commentInputText.trim());
    setCommentInputText("");
  };

  // Filter posts based on Facebook Group sections
  const filteredPosts = posts.filter(post => {
    if (activeGroupFilter === "all") return true;
    return post.groupId === activeGroupFilter;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto p-2 md:p-6" id="facebook_social_layout">
      
      {/* SOCIAL VERTICAL FILTERS MENU PANEL */}
      <div className="w-full lg:w-64 flex flex-col space-y-3 shrink-0" id="social_left_rail">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            Social Forums
          </h4>
          <div className="space-y-1">
            {[
              { id: "all", label: "Global Main Feed", icon: "🌐", desc: "All system posts" },
              { id: "dev", label: "Developers Core compiler", icon: "💻", desc: "Tech updates & code discussions" },
              { id: "design", label: "Creative & Design 📐", icon: "🎨", desc: "Interface aesthetics feedback" },
              { id: "photography", label: "Photography Circle", icon: "🌲", desc: "Outdoors adventure highlights" }
            ].map(group => (
              <button
                key={group.id}
                onClick={() => setActiveGroupFilter(group.id)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                  activeGroupFilter === group.id 
                    ? "bg-indigo-50 text-indigo-900 font-semibold border-l-4 border-indigo-600" 
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <span className="text-lg">{group.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{group.label}</div>
                  <div className="text-[10px] text-gray-400 truncate font-mono">{group.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Sandbox info panel for learning */}
        <div className="bg-gradient-to-tr from-indigo-900 to-indigo-950 p-4 rounded-2xl border border-indigo-800 text-indigo-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-sm tracking-tight font-sans text-white">Full-Stack Sandbox</h4>
          </div>
          <p className="text-xs text-indigo-200 leading-relaxed">
            Likes, comments, discussions, and typing feedback updates instantly across all switched persona walls! Real backend state retention.
          </p>
        </div>
      </div>

      {/* CENTRAL SOCIAL FEED BODY COLUMN */}
      <div className="flex-1 space-y-6" id="feed_timeline_column">
        
        {/* HORIZONTAL WHATSAPP PROGRESS TRACKING STORIES / STATUS BAR */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col space-y-3 overflow-hidden" id="statuses_horizontal_tray">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>Stories & Status updates</span>
            <button 
              onClick={() => setStatusCreatorOpen(true)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              id="add_new_status_action"
            >
              + Post Status
            </button>
          </h4>

          {/* Stories horizontally scrollable deck */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none items-center">
            {/* Direct self creator trigger */}
            <div 
              onClick={() => setStatusCreatorOpen(true)}
              className="flex flex-col items-center shrink-0 cursor-pointer group"
            >
              <div className="relative w-14 h-14 rounded-full border-2 border-dashed border-gray-300 hover:border-indigo-500 flex items-center justify-center p-0.5 bg-gray-50 hover:bg-indigo-50/55 transition-all">
                <img src={currentUser.avatar} className="w-12 h-12 rounded-full object-cover opacity-60 group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                <span className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-0.5 border border-white text-xs font-bold">+</span>
              </div>
              <span className="text-[10px] text-gray-500 font-medium mt-1">My Story</span>
            </div>

            {/* List existing active status items */}
            {statuses.map((item, idx) => {
              const author = getAuthorDetails(item.authorId);
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedStatusIndex(idx)}
                  className="flex flex-col items-center shrink-0 cursor-pointer"
                  id={`status_ring_${item.id}`}
                >
                  <div className="relative w-15 h-15 rounded-full border-2 border-indigo-500 p-0.5 flex items-center justify-center bg-white hover:scale-105 transition-transform shadow-xs">
                    <img
                      src={author.avatar}
                      alt={author.name}
                      className="w-13 h-13 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[10px] text-gray-700 font-medium mt-1.5 max-w-[64px] truncate">
                    {author.name.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* FACEBOOK POST CREATOR CARD */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4" id="post_creator_panel">
          <div className="flex gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-11 h-11 rounded-full object-cover border border-gray-100 shrink-0"
              referrerPolicy="no-referrer"
            />
            
            {/* Input prompt */}
            <div className="flex-1 space-y-2">
              <textarea
                placeholder={`What is on your mind, ${currentUser.name.split(" ")[0]}? Compose high-impact thoughts...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={3}
                className="w-full border-none resize-none text-sm text-gray-950 focus:outline-none placeholder-gray-400 focus:ring-0"
                id="post_composer_textarea"
              />

              {/* Photo Attachment preview */}
              {selectedPhotoTemplate && (
                <div className="relative rounded-xl overflow-hidden max-h-48 border border-gray-100 group">
                  <img src={selectedPhotoTemplate} alt="attached thumbnail preview" className="w-full object-cover max-h-48" referrerPolicy="no-referrer" />
                  <button 
                    onClick={() => setSelectedPhotoTemplate(null)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 text-xs hover:bg-black/80 font-bold transition-all"
                    title="Remove Image"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              {/* Photo template selection tray */}
              <button
                onClick={() => setShowPhotoTray(!showPhotoTray)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold select-none transition-all ${
                  showPhotoTray ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50 text-gray-600"
                }`}
                id="toggle_photo_deck_post"
              >
                <Image className="w-4 h-4 text-emerald-500" />
                <span>Add Image</span>
              </button>

              {/* Forum category assign dropdown */}
              <div className="relative">
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-xs text-gray-700 py-1.5 px-3 rounded-full focus:outline-none font-medium checked:bg-indigo-50 cursor-pointer"
                  id="post_group_assign_select"
                >
                  <option value="">Share to Main Feed</option>
                  <option value="dev">Share to Developers Core 💻</option>
                  <option value="design">Share to Creative & Design 📐</option>
                  <option value="photography">Share to Photography Circle 🌲</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* AI Draft writer trigger */}
              <button
                onClick={() => {
                  setShowAiDraftHelper(!showAiDraftHelper);
                  setAiPromptInput(inputText);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  showAiDraftHelper ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 hover:scale-102"
                }`}
                title="AI Writer consultation"
                id="ai_copypolish_trigger"
              >
                <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                <span>AI Writer Helper</span>
              </button>

              {/* Publish button */}
              <button
                onClick={handlePostSubmit}
                disabled={!inputText.trim() && !selectedPhotoTemplate}
                className="bg-indigo-600 font-bold hover:bg-indigo-700 text-white text-xs px-4 py-2 rounded-xl shadow-md disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none transition-all flex items-center gap-1.5"
                id="publish_post_action"
              >
                <SendHorizontal className="w-3.5 h-3.5" />
                <span>Publish</span>
              </button>
            </div>
          </div>

          {/* Sub-tray: Scenic mock photo template selects */}
          {showPhotoTray && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Choose photo backdrop:</span>
              <div className="grid grid-cols-4 gap-2">
                {DESIGN_DECK_PHOTOS.map((ph, idx) => (
                  <button
                    key={ph}
                    onClick={() => {
                      setSelectedPhotoTemplate(ph);
                      setShowPhotoTray(false);
                    }}
                    className={`rounded-lg overflow-hidden border-2 h-14 relative ${
                      selectedPhotoTemplate === ph ? "border-indigo-500 scale-95" : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img src={ph} alt="backdrop option" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <span className="absolute bottom-1 bg-black/60 px-1 text-[8px] rounded-full text-white left-1">Template #{idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Expander consultant slide-drawer panel */}
          {showAiDraftHelper && (
            <div className="p-4 rounded-xl bg-gradient-to-tr from-amber-50/70 to-orange-50/70 border border-amber-200/60 shadow-inner space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    AI Copywriter Assistant (Google Gemini AI)
                  </h5>
                  <p className="text-[10px] text-amber-700">Write high-engagement structural posts from messy ideas instantly.</p>
                </div>
                <button 
                  onClick={() => setShowAiDraftHelper(false)}
                  className="text-amber-800 font-bold text-xs hover:text-amber-950 font-mono"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {/* Style selector */}
                <div>
                  <label className="text-[10px] font-bold text-amber-800 uppercase block mb-1">Tone / Personality Alignment</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {["Creative Designer", "Casual Narrative", "Tech & Developer", "Professional Brand"].map(st => (
                      <button
                        key={st}
                        onClick={() => setAiStyleOption(st)}
                        className={`text-[9px] font-semibold p-1.5 rounded-lg border transition-all ${
                          aiStyleOption === st 
                            ? "bg-amber-600 text-white border-amber-600 shadow-xs" 
                            : "bg-white text-amber-800 border-amber-200 hover:bg-amber-50"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt draft details */}
                <div>
                  <label className="text-[10px] font-bold text-amber-800 uppercase block mb-1">What are the core ideas to cover?</label>
                  <textarea
                    placeholder="e.g. Discuss why spacious UI layouts beat thin line dividers. Use emojis."
                    value={aiPromptInput}
                    onChange={(e) => setAiPromptInput(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-3 border border-amber-200 bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-gray-900 placeholder-amber-400"
                    id="ai_copypolish_prompt_textarea"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={handleAiPolish}
                    disabled={aiLoading || !aiPromptInput.trim()}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-40"
                    id="ai_copypolish_action"
                  >
                    {aiLoading ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{aiLoading ? "Consulting Gemini..." : "Polish thoughts"}</span>
                  </button>
                </div>

                {/* Synthesis Results presentation */}
                {aiResult && (
                  <div className="mt-3 bg-white p-3.5 rounded-xl border border-amber-100 space-y-3 shadow-xs">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">Gemini Master Draft</span>
                      <p className="text-xs text-gray-800 bg-gray-50 p-2.5 rounded-lg mt-2 font-sans whitespace-pre-wrap border border-gray-100 select-all">
                        {aiResult.refinedDraft}
                      </p>
                      
                      {/* Insert selection */}
                      <button
                        onClick={() => {
                          setInputText(aiResult.refinedDraft);
                          setShowAiDraftHelper(false);
                          setAiResult(null);
                        }}
                        className="mt-2 text-[10px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                        id="use_ai_draft_action"
                      >
                        ✓ Quick Insert this polished variant
                      </button>
                    </div>

                    <div className="border-t border-gray-100 pt-2.5 space-y-2">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">Short Alternatives:</span>
                      {aiResult.alternatives && aiResult.alternatives.map((alt, aiIdx) => (
                        <div 
                          key={aiIdx} 
                          className="p-2 border border-gray-100 rounded-lg hover:bg-indigo-50/40 cursor-pointer transition-colors"
                          onClick={() => {
                            setInputText(alt);
                            setShowAiDraftHelper(false);
                            setAiResult(null);
                          }}
                        >
                          <p className="text-[11px] text-gray-700">{alt}</p>
                          <span className="text-[9px] font-medium text-indigo-500 hover:underline">Pick this hook</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-100 pt-2.5">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block mb-1">Recommended Hashtags:</span>
                      <div className="flex flex-wrap gap-1">
                        {aiResult.suggestedHashtags && aiResult.suggestedHashtags.map(tag => (
                          <span 
                            key={tag}
                            onClick={() => setInputText(prev => prev + " " + tag)}
                            className="text-[10px] font-bold text-indigo-600 bg-indigo-55 hover:bg-indigo-100 px-2 py-0.5 rounded-full cursor-pointer transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* FEED POSTS WALL */}
        <div className="space-y-6" id="social_timeline_posts">
          {filteredPosts.map(post => {
            const author = getAuthorDetails(post.authorId);
            const userHasLiked = post.likes.includes(currentUser.id);
            const myActiveReaction = REACTION_TYPES.find(r => post.reactions?.[r.label]?.includes(currentUser.id));

            return (
              <div 
                key={post.id} 
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 relative"
                id={`post_bubble_card_${post.id}`}
              >
                {/* Author row info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={author.avatar} alt={author.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" referrerPolicy="no-referrer" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-gray-950 hover:underline cursor-pointer">{author.name}</h4>
                        
                        {/* Forum Badge tag */}
                        {post.groupId && (
                          <span className="text-[9px] font-semibold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-full">
                            Category: {post.groupId === "dev" ? "Dev 💻" : post.groupId === "design" ? "Design 📐" : "Photography 🌲"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Global</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post body caption text */}
                <p className="text-gray-900 text-sm whitespace-pre-wrap leading-relaxed">
                  {post.text}
                </p>

                {/* Large visual media if attached */}
                {post.imageUrl && (
                  <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                    <img
                      src={post.imageUrl}
                      alt="feed photorealistic upload asset"
                      className="w-full max-h-96 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Likes counts summary details bar */}
                <div className="flex items-center justify-between text-xs text-gray-500 font-mono border-b border-gray-100/75 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    {post.likes.length > 0 && (
                      <span className="bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-full p-1 text-[9px] font-bold">👍</span>
                    )}
                    {post.reactions && Object.keys(post.reactions).some(k => k === "Love") && (
                      <span className="bg-gradient-to-tr from-red-500 to-rose-500 text-white rounded-full p-1 text-[9px] font-bold">❤️</span>
                    )}
                    <span className="font-semibold text-gray-700">
                      {post.likes.length > 0 
                        ? `${post.likes.length} ${post.likes.length === 1 ? 'person liked' : 'people reacted'}` 
                        : "No reactions yet"}
                    </span>
                  </div>

                  <button 
                    onClick={() => {
                      setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id);
                    }}
                    className="hover:underline flex items-center gap-1"
                  >
                    <span>{post.comments.length} comments</span>
                  </button>
                </div>

                {/* Facebook custom micro reactions button controller */}
                <div className="flex items-center justify-between gap-1.5 text-gray-600 font-medium text-xs pt-1 relative">
                  
                  {/* Floating tooltip trigger hover wrapper */}
                  <div 
                    className="relative flex-1"
                    onMouseEnter={() => setHoveringPostId(post.id)}
                    onMouseLeave={() => setHoveringPostId(null)}
                  >
                    <button
                      onClick={() => onReactPost(post.id, "Like")}
                      className={`w-full py-2 hover:bg-gray-50 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                        myActiveReaction ? myActiveReaction.color : "text-gray-600 hover:text-indigo-600"
                      }`}
                      id={`post_like_trigger_${post.id}`}
                    >
                      <ThumbsUp className="w-4 h-4 shrink-0" />
                      <span>{myActiveReaction ? `${myActiveReaction.emoji} ${myActiveReaction.label}` : "React"}</span>
                    </button>

                    {/* Facebook Multi-reactions bubbles tray popup */}
                    {hoveringPostId === post.id && (
                      <div className="absolute bottom-11 left-1/2 -translate-x-1/2 bg-white border border-gray-100 rounded-full shadow-xl px-2.5 py-1.5 flex gap-2 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
                        {REACTION_TYPES.map(react => (
                          <button
                            key={react.label}
                            onClick={() => {
                              onReactPost(post.id, react.label);
                              setHoveringPostId(null);
                            }}
                            className="hover:scale-135 transition-transform text-xl block shrink-0"
                            title={react.label}
                          >
                            {react.emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comment trigger */}
                  <button
                    onClick={() => {
                      setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id);
                    }}
                    className="flex-1 py-1.5 hover:bg-gray-50 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" />
                    <span>Comment</span>
                  </button>

                  {/* Share mock feature */}
                  <button
                    onClick={() => alert("Simulating Facebook secure profile sharing link... 🔗 (Link Copied!)")}
                    className="flex-1 py-1.5 hover:bg-gray-50 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-4 h-4 shrink-0" />
                    <span>Share</span>
                  </button>
                </div>

                {/* Accordion expanding Comments thread panel */}
                {activeCommentPostId === post.id && (
                  <div className="border-t border-gray-100 pt-4 space-y-4">
                    {/* Render existing comments */}
                    <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                      {post.comments.map(c => {
                        const commenter = getAuthorDetails(c.authorId);
                        return (
                          <div key={c.id} className="flex gap-2.5 text-xs items-start" id={`comment_row_${c.id}`}>
                            <img src={commenter.avatar} alt="commenter avatar" className="w-8 h-8 rounded-full object-cover border border-gray-100 shrink-0" referrerPolicy="no-referrer" />
                            <div className="bg-gray-50 p-2.5 rounded-2xl flex-1 border border-gray-100">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-bold text-gray-900">{commenter.name}</span>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-gray-800 leading-relaxed font-sans">{c.text}</p>
                            </div>
                          </div>
                        );
                      })}

                      {post.comments.length === 0 && (
                        <p className="text-xs text-gray-400 italic text-center py-2">No comments published yet. Be primary initiator!</p>
                      )}
                    </div>

                    {/* Comment Composer input field */}
                    <div className="flex items-center gap-2 pt-2.5 border-t border-gray-50">
                      <img src={currentUser.avatar} className="w-8 h-8 rounded-full object-cover border border-gray-100 shrink-0" referrerPolicy="no-referrer" />
                      <input
                        type="text"
                        placeholder="Write a public comment..."
                        value={commentInputText}
                        onChange={(e) => setCommentInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handlePostCommentSubmit(post.id);
                          }
                        }}
                        className="flex-1 bg-gray-55 border-none px-3.5 py-1.5 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500/30 text-gray-900 placeholder-gray-400"
                        id={`post_comment_input_${post.id}`}
                      />
                      <button 
                        onClick={() => handlePostCommentSubmit(post.id)}
                        className="text-indigo-600 hover:text-indigo-800"
                        id={`post_comment_submit_${post.id}`}
                      >
                        <SendHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}

          {filteredPosts.length === 0 && (
            <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No timeline posts published in this forum section yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* DETAILED FULLSCREEN WHATSAPP STATUS/STORY PLAYER (AUTOMATED PROJECTION OVERLAY) */}
      {selectedStatusIndex !== null && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300" id="status_story_player">
          {(() => {
            const currentStatus = statuses[selectedStatusIndex];
            if (!currentStatus) return null;
            const author = getAuthorDetails(currentStatus.authorId);

            return (
              <div className="relative max-w-sm w-full bg-slate-900 rounded-2xl overflow-hidden aspect-[9/16] shadow-2xl flex flex-col justify-between border border-white/10">
                
                {/* Visual Stories progress timelines indicators */}
                <div className="absolute top-3 left-3 right-3 flex gap-1 z-35">
                  {statuses.map((_, sIdx) => (
                    <div key={sIdx} className="h-1 bg-white/30 rounded-full flex-1 overflow-hidden">
                      <div 
                        className={`h-full bg-white transition-all duration-3000 ease-linear ${
                          sIdx < selectedStatusIndex 
                            ? "w-full" 
                            : sIdx === selectedStatusIndex 
                              ? "w-full" 
                              : "w-0"
                        }`}
                      ></div>
                    </div>
                  ))}
                </div>

                {/* Back / Next navigation taps triggers overlay */}
                <div className="absolute inset-0 flex z-10">
                  <div 
                    className="w-1/3 h-full cursor-pointer" 
                    onClick={() => {
                      if (selectedStatusIndex > 0) {
                        setSelectedStatusIndex(selectedStatusIndex - 1);
                      } else {
                        setSelectedStatusIndex(null);
                      }
                    }}
                    title="Previous Story"
                  />
                  <div 
                    className="flex-1 h-full cursor-pointer" 
                    onClick={() => {
                      if (selectedStatusIndex < statuses.length - 1) {
                        setSelectedStatusIndex(selectedStatusIndex + 1);
                      } else {
                        setSelectedStatusIndex(null);
                      }
                    }}
                    title="Next Story"
                  />
                </div>

                {/* Header author info */}
                <div className="p-4 pt-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between relative z-20">
                  <div className="flex items-center gap-2">
                    <img src={author.avatar} alt="avatar" className="w-9 h-9 rounded-full object-cover border border-white/20" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="font-bold text-white text-xs font-sans">{author.name}</h4>
                      <span className="text-[9px] text-white/60 font-mono">{new Date(currentStatus.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedStatusIndex(null)}
                    className="text-white hover:text-white/65 p-1 text-sm font-bold font-mono"
                  >
                    ✕
                  </button>
                </div>

                {/* Central imagery media backing */}
                <div className="flex-1 w-full relative bg-black flex items-center justify-center">
                  <img src={currentStatus.mediaUrl} alt="Status visualization mockup" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>

                {/* Bottom text caption panel overlay */}
                <div className="p-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-center relative z-20 space-y-3">
                  <p className="text-white text-sm font-medium leading-relaxed drop-shadow-md">
                    {currentStatus.text}
                  </p>
                  
                  <div className="flex items-center justify-center gap-1.5 text-white/50 text-[10px] font-mono">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Viewed by {currentStatus.viewers.length + 1} contacts</span>
                  </div>
                </div>

              </div>
            );
          })()}
        </div>
      )}

      {/* WHATSAPP STATUS CREATOR WIZARD DOCK MODAL */}
      {statusCreatorOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-600" />
                Post WhatsApp Status
              </h3>
              <button 
                onClick={() => setStatusCreatorOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Picture choices */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">Backdrop Image Theme</label>
                <div className="grid grid-cols-4 gap-2">
                  {DESIGN_DECK_PHOTOS.map(img => (
                    <button
                      key={img}
                      onClick={() => setNewStatusPic(img)}
                      className={`h-12 rounded-lg overflow-hidden border-2 relative ${
                        newStatusPic === img ? "border-indigo-600 scale-95" : "border-transparent opacity-70"
                      }`}
                    >
                      <img src={img} alt="choice preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Status Caption Details</label>
                <textarea
                  placeholder="e.g. Sipping espresso, finishing type-refactors! ☕🔋"
                  value={newStatusText}
                  onChange={(e) => setNewStatusText(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl text-xs p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 placeholder-gray-400 resize-none"
                  id="new_status_caption_input"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setStatusCreatorOpen(false)}
                className="px-3.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusSubmit}
                disabled={!newStatusText.trim()}
                className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-40"
                id="publish_status_confirm"
              >
                Post Status
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
