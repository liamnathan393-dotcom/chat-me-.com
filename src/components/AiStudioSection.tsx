import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, Send, Brain, Paintbrush, ArrowDownCircle, RefreshCw, 
  Smile, HelpCircle, Image, Globe, Heart, Check, Play, MessageSquare, Flame
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";

// Dynamic starter suggestion chips based on the active persona alignment
const PROMPT_SUGGESTION_BANK: Record<string, string[]> = {
  tech: [
    "How do I prevent state duplication in custom React hooks?",
    "Explain standard server-sent events versus raw web sockets.",
    "Recommend a modular file layout for full-stack scalable Express apps."
  ],
  designer: [
    "Critique the usage of modern heavy orange gradients in premium dark UI.",
    "Draft a design spec for robust touch targets on mobile messenger panels.",
    "Provide three golden rules of typographic scale and line-height balance."
  ],
  sarcastic: [
    "Explain why missing a semicolon feels like a life catastrophe.",
    "Make fun of people who spend 6 hours picking an font type.",
    "Assess my logic of running 47 nested react render filters."
  ]
};

interface AiStudioSectionProps {
  currentUser: User;
  onCreatePost: (text: string, imageUrl?: string) => Promise<void>;
}

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: Date;
}

export default function AiStudioSection({ currentUser, onCreatePost }: AiStudioSectionProps) {
  // Agent state variables
  const [activePersona, setActivePersona] = useState<"tech" | "designer" | "sarcastic">("tech");
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({
    tech: [
      { 
        id: "t1", 
        role: "model", 
        content: "Compiler systems, performance modules, and TS specifications are calibrated. Pitch your architecture query or ask for code review!", 
        timestamp: new Date() 
      }
    ],
    designer: [
      { 
        id: "d1", 
        role: "model", 
        content: "Branding critique tools are active. What viewport alignments or typographic weights are we diagnosing today?", 
        timestamp: new Date() 
      }
    ],
    sarcastic: [
      { 
        id: "s1", 
        role: "model", 
        content: "Oh great. Another human query. Sardonix ready. Ask away, I'll answer it while questioning your choices.", 
        timestamp: new Date() 
      }
    ]
  });

  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Generative Backdrop variables
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageAspectRatio, setImageAspectRatio] = useState("1:1");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageSimulated, setImageSimulated] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Auto-scroll chat window
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages[activePersona]?.length, aiLoading]);

  // Persona configuration properties
  const personas = {
    tech: {
      name: "Sardonix-Tech Co-pilot",
      tagline: "High-performance software architect & code performance optimizer",
      emoji: "💻",
      theme: "border-indigo-100 bg-indigo-50/50 text-indigo-900",
      accent: "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-100",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"
    },
    designer: {
      name: "Alice Vance (Design critic)",
      tagline: "Typographic, layout and spacing expert",
      emoji: "📐",
      theme: "border-emerald-100 bg-emerald-50/50 text-emerald-900",
      accent: "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-100",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150"
    },
    sarcastic: {
      name: "Sardonix (Sarcastic companion)",
      tagline: "Extremely witty AI assistant with a cynical view of clean code",
      emoji: "👾",
      theme: "border-amber-110 bg-amber-50/55 text-amber-900",
      accent: "bg-amber-600 hover:bg-amber-700 hover:shadow-amber-100",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150"
    }
  };

  const currentPersona = personas[activePersona];

  // Send message to Agent chat endpoint
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date()
    };

    const currentHistory = [...chatMessages[activePersona], userMsg];
    
    // Update local state instantly containing user prompt
    setChatMessages(prev => ({
      ...prev,
      [activePersona]: currentHistory
    }));

    setChatInput("");
    setAiLoading(true);

    try {
      // Send backend API request
      const response = await fetch("/api/ai/chat-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: activePersona,
          messages: currentHistory.map(m => ({
            role: m.role === "user" ? "user" : "model",
            content: m.content
          }))
        })
      });

      const data = await response.json();
      if (data.success) {
        const agentReply: ChatMessage = {
          id: Math.random().toString(),
          role: "model",
          content: data.text,
          timestamp: new Date()
        };
        setChatMessages(prev => ({
          ...prev,
          [activePersona]: [...currentHistory, agentReply]
        }));
      } else {
        alert(data.error || "Failed obtaining conversational feedback.");
      }
    } catch (err) {
      console.error(err);
      alert("Network exception communicating with AI Agent.");
    } finally {
      setAiLoading(false);
    }
  };

  // Generate image using official Gemini 2.5 Image tools
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setGeneratingImage(true);
    setPublishSuccess(false);

    try {
      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt.trim(),
          aspectRatio: imageAspectRatio
        })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedImageUrl(data.imageUrl);
        setImageSimulated(!!data.simulated);
      } else {
        alert(data.error || "Failed generating visual assets");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred generating graphical assets from server.");
    } finally {
      setGeneratingImage(false);
    }
  };

  // Feed direct publication connector
  const handlePublishToFeed = async () => {
    if (!generatedImageUrl) return;
    try {
      const captionText = `🌌 [AI Design Lab Generated Asset]\n"${imagePrompt}"\n\nGenerated with Gemini base64 image creator in ${imageAspectRatio} aspect ratio.`;
      await onCreatePost(captionText, generatedImageUrl);
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 4400);
    } catch (err) {
      console.error(err);
      alert("Error publishing generated asset to public social feed.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-2 md:p-6 space-y-6" id="ai_studio_lab_panel">
      
      {/* HEADER HERO ACCENT BRAND */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 border border-indigo-800 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 rounded-full border border-indigo-500/30 text-indigo-300 text-xs font-bold leading-none uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Vivid Sandbox Lab Mode
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight font-sans">
            AI Studio Sandbox
          </h2>
          <p className="text-sm text-indigo-200/80 max-w-xl">
            Simultaneously write high-fidelity images using Gemini & chat with expert software architectures or design engineers with direct publishing integration!
          </p>
        </div>
        <div className="bg-indigo-950/70 backdrop-blur-md p-4 rounded-2xl border border-indigo-800/80 space-y-1.5 shrink-0 z-10" id="sandbox_details">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold font-sans tracking-wide text-white">Google Gemini Models Active</span>
          </div>
          <p className="text-[10px] text-indigo-300 font-mono">
            Model pool: gemini-3.5-flash & gemini-2.5-flash-image
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: MULTI-AGENT CHAT COMPANION */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[640px] overflow-hidden" id="chat_agents_playground">
          
          {/* Persona selector bar */}
          <div className="p-4 bg-gray-50/50 border-b border-gray-55 space-y-3 shrink-0">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              1. Choose Agent Persona
            </h4>
            <div className="flex gap-2">
              {(Object.keys(personas) as Array<keyof typeof personas>).map(key => {
                const isSelected = activePersona === key;
                const pInfo = personas[key];
                return (
                  <button
                    key={key}
                    onClick={() => setActivePersona(key)}
                    className={`flex-1 flex flex-col md:flex-row items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? "bg-white border-indigo-500 shadow-sm font-semibold text-indigo-950 scale-102" 
                        : "hover:bg-gray-100/60 border-transparent text-gray-600"
                    }`}
                  >
                    <span className="text-xl shrink-0">{pInfo.emoji}</span>
                    <div className="text-center md:text-left min-w-0">
                      <div className="text-xs truncate font-bold leading-tight">{pInfo.name.split(" ")[0]}</div>
                      <div className="text-[9px] text-gray-400 truncate hidden md:block">{key === "tech" ? "Architect" : key === "designer" ? "Critic" : "Humor Bot"}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Persona focus description */}
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3 bg-white shrink-0">
            <img src={currentPersona.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-100" referrerPolicy="no-referrer" />
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-gray-900 leading-snug">{currentPersona.name}</h3>
              <p className="text-xs text-gray-400 truncate font-mono">{currentPersona.tagline}</p>
            </div>
          </div>

          {/* Chat dialog viewport */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/20" id="ai_chat_scroller">
            {chatMessages[activePersona].map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div className={`p-4 rounded-2xl max-w-[80%] shadow-xs leading-relaxed text-sm ${
                    isUser 
                      ? "bg-indigo-600 text-white rounded-tr-none" 
                      : "bg-white text-gray-900 rounded-tl-none border border-gray-100"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span className={`text-[9px] font-mono block text-right mt-1.5 ${isUser ? "text-indigo-200" : "text-gray-400"}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Artificial Thinking state indicator */}
            {aiLoading && (
              <div className="flex items-center space-x-2 mr-auto bg-white border border-gray-100 p-3.5 rounded-2xl max-w-xs shadow-xs rounded-tl-none">
                <span className="text-xs text-indigo-600 font-semibold animate-pulse">{currentPersona.name.split(" ")[0]} is drafting feedback</span>
                <span className="flex space-x-1 items-center">
                  <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </div>
            )}

            <div ref={scrollRef} />
          </div>

          {/* Prompt suggestions helper drawer footer */}
          <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 space-y-2 shrink-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Suggested Questions:</span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {PROMPT_SUGGESTION_BANK[activePersona].map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => setChatInput(prompt)}
                  className="bg-white hover:bg-indigo-50 hover:text-indigo-900 text-[10px] text-gray-600 font-medium px-3 py-1.5 rounded-xl border border-gray-100 transition-all shrink-0 cursor-pointer"
                >
                  💡 {prompt.length > 50 ? prompt.substring(0, 47) + "..." : prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Client chat input compose panel */}
          <div className="p-4 bg-white border-t border-gray-150 flex items-center gap-3 shrink-0">
            <input
              type="text"
              placeholder={`Query ${currentPersona.name.split(" ")[0]}... (try suggestions above)`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage(chatInput);
                }
              }}
              className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all text-gray-900 placeholder-gray-400"
              id="playground_chat_input"
            />
            <button
              onClick={() => handleSendMessage(chatInput)}
              disabled={aiLoading || !chatInput.trim()}
              className={`${currentPersona.accent} text-white p-2.5 rounded-2xl transition-all shadow-md shrink-0 active:scale-95 disabled:opacity-40 disabled:scale-100`}
              id="playground_chat_send_btn"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: GENERATIVE GRAPHICS STUDIO */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between h-[640px] overflow-y-auto space-y-5" id="imagen_studio_lab">
          
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Paintbrush className="w-3.5 h-3.5" />
                2. Generative Backdrop Lab
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">
                Transcribe imaginative visual scenes into high-resolution image cards using Google Gemini Flash Image, then instantly share them to your main feed.
              </p>
            </div>

            {/* Prompt Form */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Backdrop Prompt description</label>
                <textarea
                  placeholder="e.g. Minimalist layout diagram concept of an interface showing vibrant green neon graphs, high-contrast typography, slate background, 3D render architecture."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 placeholder-gray-400 resize-none"
                  id="imagen_prompt_textarea"
                />
              </div>

              {/* Aspect Ratio choice grids */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Aspect Ratio Sizing</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "1:1", label: "1:1 Square", desc: "Facebook Post" },
                    { id: "16:9", label: "16:9 Cinema", desc: "Forums Banner" },
                    { id: "9:16", label: "9:16 vertical", desc: "WhatsApp Status" }
                  ].map(ar => (
                    <button
                      key={ar.id}
                      onClick={() => setImageAspectRatio(ar.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        imageAspectRatio === ar.id 
                          ? "bg-indigo-50/80 border-indigo-500 text-indigo-900 font-bold" 
                          : "hover:bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      <div className="text-xs">{ar.label}</div>
                      <div className="text-[8px] text-gray-400 font-mono mt-0.5">{ar.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleGenerateImage}
              disabled={generatingImage || !imagePrompt.trim()}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md hover:scale-102 hover:shadow-indigo-100 active:scale-99 transition-all disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-2"
              id="imagen_generator_execute"
            >
              {generatingImage ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Graphic Art...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>Generate AI Graphic Backdrop</span>
                </>
              )}
            </button>
          </div>

          {/* Results Viewer Section */}
          <div className="flex-1 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden relative p-3 max-h-72 min-h-48">
            {generatingImage && (
              <div className="text-center space-y-3 z-10 p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100 shadow-xl max-w-[220px]">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-gray-900">Running Gemini-2.5-flash-image</p>
                <p className="text-[10px] text-gray-500 leading-tight">Polishing pixels and drafting grid structures...</p>
              </div>
            )}

            {!generatingImage && generatedImageUrl && (
              <div className="w-full h-full relative group">
                <img
                  src={generatedImageUrl}
                  alt="AI Synthesized artwork feedback"
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                  <span className="text-[10px] text-white bg-black/60 px-3 py-1 bg-emerald-500 rounded-full font-mono text-center">
                    Rendered Aspect Ratio: {imageAspectRatio}
                  </span>
                </div>
              </div>
            )}

            {!generatingImage && !generatedImageUrl && (
              <div className="text-center opacity-60 p-4 space-y-1.5">
                <Image className="w-8 h-8 mx-auto text-gray-300" />
                <h5 className="font-semibold text-gray-700 text-xs">Awaiting Prompts</h5>
                <p className="text-[10px] text-gray-500 max-w-[190px] mx-auto">Generate to render high-contrast responsive layouts instantly.</p>
              </div>
            )}

            {imageSimulated && !generatingImage && generatedImageUrl && (
              <div className="absolute top-2 left-2 bg-amber-500/90 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                <Flame className="w-2.5 h-2.5" />
                <span>Simulated Sandbox Image</span>
              </div>
            )}
          </div>

          {/* Connector Footer Panel */}
          {generatedImageUrl && !generatingImage && (
            <div className="pt-2 animate-in fade-in duration-200">
              <button
                onClick={handlePublishToFeed}
                disabled={publishSuccess}
                className={`w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm ${
                  publishSuccess 
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default" 
                    : "bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-101 active:scale-99 cursor-pointer"
                }`}
                id="imagen_publish_social_action"
              >
                {publishSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Published Successfully to Forums Feed!</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Publish Asset Directly to Forums Feed</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
