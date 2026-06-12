import React, { useState, useEffect } from "react";
import { 
  MessageSquare, Film, Rss, UserCheck, Shield, Sparkles, 
  HelpCircle, Server, AlertCircle, RefreshCw, LogIn, Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Chat, Message, Post, UserStatus, AppState } from "./types";
import ChatSection from "./components/ChatSection";
import SocialSection from "./components/SocialSection";
import ProfileSection from "./components/ProfileSection";
import AiStudioSection from "./components/AiStudioSection";

export default function App() {
  const [activeTab, setActiveTab] = useState<"chats" | "feed" | "profiles" | "ai">("chats");
  const [appState, setAppState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Re-fetch entire server-bound metadata state
  const loadAppState = async (showSyncIndicator = false) => {
    if (showSyncIndicator) setSyncing(true);
    try {
      const response = await fetch("/api/state");
      if (!response.ok) {
        throw new Error(`Failed to establish database pipeline: ${response.status}`);
      }
      const data = await response.json();
      setAppState(data);
      setErrorMessage(null);
    } catch (err: any) {
      console.error("Critical State Sync Failure:", err);
      setErrorMessage(err?.message || "Internal database connection failure.");
    } finally {
      if (showSyncIndicator) setSyncing(false);
      setLoading(false);
    }
  };

  // Run on startup
  useEffect(() => {
    loadAppState();
    
    // Auto sync state every 8 seconds to fetch replies from switched simulation partners
    const handleInterval = setInterval(() => {
      loadAppState(false);
    }, 8000);

    return () => clearInterval(handleInterval);
  }, []);

  const activeUser = appState?.users.find(u => u.id === appState.activeUserId);

  // CALLBACK DIRECTIVES FOR WHATSAPP CORE ACTIONS:

  const handleSendMessage = async (chatId: string, text: string, mediaUrl?: string) => {
    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, text, mediaUrl }),
      });
      if (response.ok) {
        await loadAppState(false);
      }
    } catch {
      alert("Failed submitting message thread payload.");
    }
  };

  const handleReactMessage = async (chatId: string, messageId: string, emoji: string) => {
    try {
      const response = await fetch("/api/messages/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, messageId, emoji }),
      });
      if (response.ok) {
        await loadAppState(false);
      }
    } catch {
      alert("Failed recording message reaction.");
    }
  };

  const handleClearChat = async (chatId: string) => {
    try {
      const response = await fetch("/api/chats/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      });
      if (response.ok) {
        await loadAppState(false);
      }
    } catch {
      alert("Failed clearing database chat log.");
    }
  };

  const handleCreateChat = async (chatData: { type: "direct" | "group"; name?: string; participantIds: string[]; avatar?: string }) => {
    try {
      const response = await fetch("/api/chats/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatData),
      });
      if (response.ok) {
        await loadAppState(false);
      }
    } catch {
      alert("Failed creating custom conversation schema.");
    }
  };

  // CALLBACK DIRECTIVES FOR FACEBOOK CORE ACTIONS:

  const handleCreatePost = async (text: string, imageUrl?: string, groupId?: string) => {
    try {
      const response = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, imageUrl, groupId }),
      });
      if (response.ok) {
        await loadAppState(false);
      }
    } catch {
      alert("Failed creating content post.");
    }
  };

  const handleReactPost = async (postId: string, reactionType: string) => {
    try {
      const response = await fetch("/api/posts/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, reactionType }),
      });
      if (response.ok) {
        await loadAppState(false);
      }
    } catch {
      alert("Failed updating post interaction data.");
    }
  };

  const handleCommentPost = async (postId: string, commentText: string) => {
    try {
      const response = await fetch("/api/posts/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, text: commentText }),
      });
      if (response.ok) {
        await loadAppState(false);
      }
    } catch {
      alert("Failed publishing post comment.");
    }
  };

  const handleCreateStatus = async (text: string, mediaUrl?: string) => {
    try {
      const response = await fetch("/api/statuses/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mediaUrl }),
      });
      if (response.ok) {
        await loadAppState(false);
      }
    } catch {
      alert("Failed posting Status update.");
    }
  };

  // CALLBACK DIRECTIVES FOR PROFILE SWITCHES & FRIENDS:

  const handleSwitchUser = async (userId: string) => {
    try {
      const response = await fetch("/api/users/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (response.ok) {
        await loadAppState(true);
      }
    } catch {
      alert("Failed switching simulated user.");
    }
  };

  const handleAddFriend = async (targetUserId: string) => {
    try {
      const response = await fetch("/api/users/add-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (response.ok) {
        await loadAppState(false);
      }
    } catch {
      alert("Failed adjusting friend details.");
    }
  };

  // Calculate sum of all unread chat messages for active user
  const totalUnreads = appState && activeUser
    ? appState.chats.reduce((acc, c) => acc + (c.unreadCount[activeUser.id] || 0), 0)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight font-sans">Spinning up Social Container Services</h1>
          <p className="text-xs text-slate-500 mt-1">Establishing custom in-memory tables & connecting to Gemini channels...</p>
        </div>
      </div>
    );
  }

  if (errorMessage || !appState || !activeUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
        <AlertCircle className="w-16 h-16 text-rose-500" />
        <div>
          <h1 className="text-lg font-bold text-slate-900 font-sans">Sync Connection Failure</h1>
          <p className="text-xs text-rose-600 mt-2 bg-rose-50 p-3 rounded-lg border border-rose-100 font-mono">
            {errorMessage || "State database is inaccessible."}
          </p>
        </div>
        <button 
          onClick={() => loadAppState()}
          className="bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition"
        >
          Retry Connection Stream
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* GLOBAL TOP CONTROL HERO BAR */}
      <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between z-40 sticky top-0 shadow-xs" id="shared_top_header">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white tracking-widest text-lg font-sans shadow-md shadow-indigo-650/15">
            S
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-950 font-sans tracking-tight">SocialSphere</h1>
            <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5 leading-none mt-0.5">
              <Server className="w-3 h-3 text-emerald-500" />
              <span>Full-Stack Prototype Active</span>
            </p>
          </div>
        </div>

        {/* Dynamic switcher indicators */}
        <div className="flex items-center gap-4">
          
          {/* Interactive top profile tag (swaps accounts directly inside header!) */}
          <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-3">
            <img 
              src={activeUser.avatar} 
              alt={activeUser.name} 
              className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/20"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none font-mono">Simulation Actor</div>
              <div className="text-xs font-semibold text-gray-800 leading-none mt-1">{activeUser.name}</div>
            </div>
            
            {/* Quick swap modal launcher alert */}
            <button 
              onClick={() => {
                setActiveTab("profiles");
              }}
              className="text-[10px] bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold px-2 py-0.5 rounded-lg ml-1 font-mono transition-colors"
              title="Switch Swapped User Persona"
            >
              Swap Account
            </button>
          </div>

          {/* Gemini API state bubble */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-800 border border-amber-200 rounded-xl">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span className="font-mono text-[10px]">Gemini Meta AI: {appState.isAiLive ? "ONLINE (Live Key)" : "SIMULATED"}</span>
          </div>

          {/* Manual re-sync */}
          <button
            onClick={() => loadAppState(true)}
            disabled={syncing}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-40"
            title="Force refresh database memory state"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          </button>

        </div>
      </header>

      {/* PRIMARY DIVISION HUB (SIDEBAR + MAIN COMPONENT BLOCK) */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto" id="app_primary_body">
        
        {/* DESKTOP DESKTOP NAVIGATION SIDEBAR / MOBILE HEADER TRAIL */}
        <nav className="w-full md:w-64 bg-white md:bg-transparent border-b md:border-b-0 md:border-r border-gray-150 p-4 shrink-0 flex md:flex-col justify-around md:justify-start gap-2 h-auto" id="shared_navigation_sidebar">
          
          <div className="hidden md:block mb-4 pt-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider font-mono">Navigation Hub</span>
          </div>

          {[
            { id: "chats", label: "WhatsApp Messenger", icon: <MessageSquare className="w-4 h-5" />, badge: totalUnreads },
            { id: "feed", label: "Facebook Social Feed", icon: <Rss className="w-4 h-5" /> },
            { id: "ai", label: "Gemini AI Studio Lab", icon: <Sparkles className="w-4 h-5 text-amber-500 animate-pulse" /> },
            { id: "profiles", label: "Profiles & Accounts", icon: <UserCheck className="w-4 h-5" /> }
          ].map(menu => {
            const isSelected = activeTab === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => setActiveTab(menu.id as any)}
                className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all duration-150 ${
                  isSelected 
                    ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-650/15" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                id={`nav_toggle_${menu.id}`}
              >
                <div className="flex items-center gap-3">
                  {menu.icon}
                  <span className="text-xs md:text-sm font-sans">{menu.label}</span>
                </div>
                {menu.badge && menu.badge > 0 ? (
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${isSelected ? "bg-white text-indigo-700" : "bg-red-500 text-white"}`}>
                    {menu.badge}
                  </span>
                ) : null}
              </button>
            );
          })}

          <div className="hidden md:flex flex-col flex-1 justify-end space-y-4 pb-4">
            <div className="p-3 bg-white border border-gray-100 rounded-xl text-center space-y-1.5 shadow-xs">
              <span className="text-[9px] font-bold text-gray-400 block tracking-widest uppercase">Meta AI Assistant</span>
              <p className="text-[10px] text-gray-500 leading-relaxed font-sans">
                Chat partner "Meta AI" responds automatically utilizing modern Google Gemini models!
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-1 text-[9px] text-gray-400 font-mono">
              <Server className="w-3 h-3 text-emerald-500" />
              <span>Port: 3000 Ingress</span>
            </div>
          </div>

        </nav>

        {/* MASTER SCREEN CONTAINER BASED ON TAB CHANNELS */}
        <main className="flex-1 p-2 md:p-6" id="app_rendered_screen">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              
              {activeTab === "chats" && (
                <ChatSection
                  currentUser={activeUser}
                  users={appState.users}
                  chats={appState.chats}
                  onSendMessage={handleSendMessage}
                  onReactMessage={handleReactMessage}
                  onClearChat={handleClearChat}
                  onCreateChat={handleCreateChat}
                />
              )}

              {activeTab === "feed" && (
                <SocialSection
                  currentUser={activeUser}
                  users={appState.users}
                  posts={appState.posts}
                  statuses={appState.statuses}
                  onCreatePost={handleCreatePost}
                  onReactPost={handleReactPost}
                  onCommentPost={handleCommentPost}
                  onCreateStatus={handleCreateStatus}
                />
              )}

              {activeTab === "profiles" && (
                <ProfileSection
                  activeUser={activeUser}
                  allUsers={appState.users}
                  posts={appState.posts}
                  onSwitchUser={handleSwitchUser}
                  onAddFriend={handleAddFriend}
                />
              )}

              {activeTab === "ai" && (
                <AiStudioSection
                  currentUser={activeUser}
                  onCreatePost={handleCreatePost}
                />
              )}

            </motion.div>
          </AnimatePresence>
        </main>

      </div>

    </div>
  );
}
