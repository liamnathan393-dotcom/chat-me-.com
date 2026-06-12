import React, { useState, useRef, useEffect } from "react";
import { 
  Search, Send, Phone, Video, MoreVertical, Check, CheckCheck, 
  Smile, Paperclip, Image, Trash2, ArrowLeft, PlusCircle, Users, AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Chat, Message } from "../types";

// Standard preset decorative images for message attachments
const PRESET_ATTACHMENTS = [
  { name: "Coffee Workspace", url: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=400&h=300" },
  { name: "Yosemite Sunset", url: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=400&h=300" },
  { name: "Abstract Code", url: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=400&h=300" },
  { name: "Figma UI Draft", url: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=400&h=300" },
];

const EMOJI_PRESETS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🔥", "☕", "🎉"];

interface ChatSectionProps {
  currentUser: User;
  users: User[];
  chats: Chat[];
  onSendMessage: (chatId: string, text: string, mediaUrl?: string) => Promise<void>;
  onReactMessage: (chatId: string, messageId: string, emoji: string) => Promise<void>;
  onClearChat: (chatId: string) => Promise<void>;
  onCreateChat: (chatData: { type: "direct" | "group"; name?: string; participantIds: string[]; avatar?: string }) => Promise<void>;
}

export default function ChatSection({
  currentUser,
  users,
  chats,
  onSendMessage,
  onReactMessage,
  onClearChat,
  onCreateChat
}: ChatSectionProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(chats[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false);

  // For creating physical group chats
  const [newChatType, setNewChatType] = useState<"direct" | "group">("direct");
  const [newChatName, setNewChatName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const messageEndRef = useRef<HTMLDivElement | null>(null);

  // Current Active Chat
  const activeChat = chats.find(c => c.id === selectedChatId) || chats[0];
  
  // Auto-scroll on new message arrivals
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages?.length, activeChat?.typingUserIds?.length]);

  if (!activeChat && chats.length > 0) {
    setSelectedChatId(chats[0].id);
  }

  // Filter chats by user search
  const filteredChats = chats.filter(chat => {
    // If group chat, search by group name
    if (chat.type === "group") {
      return chat.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    // Else, query the other participant names
    const otherParticipantId = chat.participants.find(pId => pId !== currentUser.id);
    const otherUser = users.find(u => u.id === otherParticipantId);
    return otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSend = () => {
    if (!activeChat || (!inputText.trim())) return;
    onSendMessage(activeChat.id, inputText.trim());
    setInputText("");
    setShowEmojiPicker(false);
  };

  const handleSelectAttachment = (url: string) => {
    if (!activeChat) return;
    onSendMessage(activeChat.id, "Shared an image illustration", url);
    setShowAttachmentMenu(false);
  };

  const toggleParticipantSelection = (pId: string) => {
    if (selectedParticipants.includes(pId)) {
      setSelectedParticipants(selectedParticipants.filter(id => id !== pId));
    } else {
      setSelectedParticipants([...selectedParticipants, pId]);
    }
  };

  const handleCreateChatSubmit = () => {
    if (selectedParticipants.length === 0) return;
    
    let chatName = newChatName;
    let chatAvatar = undefined;

    if (newChatType === "direct") {
      const targetUser = users.find(u => u.id === selectedParticipants[0]);
      chatName = targetUser?.name || "Direct Message";
      chatAvatar = targetUser?.avatar;
    } else {
      chatName = chatName || `Group Draft ${chats.length + 1}`;
    }

    onCreateChat({
      type: newChatType,
      name: chatName,
      participantIds: selectedParticipants,
      avatar: chatAvatar
    });

    // Reset wizard
    setShowNewChatDialog(false);
    setNewChatType("direct");
    setNewChatName("");
    setSelectedParticipants([]);
  };

  // Helper formats message time
  const formatTime = (isoString: string) => {
    try {
      const dt = new Date(isoString);
      return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "now";
    }
  };

  const getChatDisplayName = (chat: Chat) => {
    if (chat.type === "group") return chat.name;
    const peerId = chat.participants.find(pId => pId !== currentUser.id);
    const peer = users.find(u => u.id === peerId);
    return peer?.name || chat.name;
  };

  const getChatDisplayAvatar = (chat: Chat) => {
    if (chat.type === "group") return chat.avatar;
    const peerId = chat.participants.find(pId => pId !== currentUser.id);
    const peer = users.find(u => u.id === peerId);
    return peer?.avatar || chat.avatar;
  };

  const getChatDisplayStatus = (chat: Chat) => {
    if (chat.type === "group") {
      return `${chat.participants.length} members`;
    }
    const peerId = chat.participants.find(pId => pId !== currentUser.id);
    const peer = users.find(u => u.id === peerId);
    if (peer?.id === "meta_ai") return "AI Agent";
    return peer?.status === "online" ? "online" : peer?.status === "away" ? "away" : "offline";
  };

  return (
    <div className="flex h-[calc(100vh-140px)] rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm" id="whatsapp_chat_layout">
      
      {/* LEFT SIDE LIST PANEL */}
      <div className="w-80 md:w-96 flex flex-col border-r border-gray-100 bg-gray-50/50" id="chat_list_panel">
        {/* Header and Search */}
        <div className="p-4 bg-white border-b border-gray-55">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold tracking-tight text-gray-950 font-sans flex items-center gap-2">
              Chats <span className="text-xs bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded-full">{chats.length}</span>
            </h2>
            <button 
              onClick={() => setShowNewChatDialog(true)}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-2 rounded-full transition-colors flex items-center gap-1.5 text-sm font-medium"
              title="New Chat / Group"
              id="new_chat_button"
            >
              <PlusCircle className="w-5 h-5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search chat or person..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 transition-all text-gray-900 placeholder-gray-400"
              id="chat_search_input"
            />
          </div>
        </div>

        {/* WhatsApp Chat List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100/50">
          <AnimatePresence>
            {filteredChats.map((chat) => {
              const lastMsg = chat.messages[chat.messages.length - 1];
              const displayName = getChatDisplayName(chat);
              const avatar = getChatDisplayAvatar(chat);
              const unread = chat.unreadCount[currentUser.id] || 0;
              const isSelected = activeChat?.id === chat.id;

              return (
                <motion.div
                  key={chat.id}
                  onClick={() => {
                    setSelectedChatId(chat.id);
                    chat.unreadCount[currentUser.id] = 0; // Mark read simulated
                  }}
                  className={`flex items-center gap-3 p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? "bg-emerald-50/70 border-l-4 border-emerald-500" 
                      : "hover:bg-gray-100/60"
                  }`}
                  whileTap={{ scale: 0.99 }}
                >
                  {/* Participant Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={avatar}
                      alt={displayName}
                      className="w-12 h-12 rounded-full object-cover border border-gray-100"
                      referrerPolicy="no-referrer"
                    />
                    {getChatDisplayStatus(chat) === "online" && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                    {getChatDisplayStatus(chat) === "away" && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-amber-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>

                  {/* Previews text content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-gray-950 truncate font-sans">
                        {displayName}
                      </h4>
                      {lastMsg && (
                        <span className="text-xs text-gray-400 font-mono">
                          {formatTime(lastMsg.timestamp)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500 truncate max-w-[180px]">
                        {chat.typingUserIds && chat.typingUserIds.length > 0 ? (
                          <span className="text-emerald-600 font-semibold italic animate-pulse">typing...</span>
                        ) : lastMsg ? (
                          lastMsg.text
                        ) : (
                          <span className="text-gray-400 italic">No messages yet</span>
                        )}
                      </p>
                      
                      {/* Unread Counter Badge */}
                      {unread > 0 && (
                        <span className="bg-emerald-500 text-white text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full min-w-4 text-center">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {filteredChats.length === 0 && (
              <div className="p-8 text-center text-gray-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No matching chats found.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT SIDE CHAT CONTENT WINDOW */}
      {activeChat ? (
        <div className="flex-1 flex flex-col bg-slate-50/50" id="chat_conversation_area">
          {/* Active Chat Header */}
          <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
              <img
                src={getChatDisplayAvatar(activeChat)}
                alt={getChatDisplayName(activeChat)}
                className="w-11 h-11 rounded-full object-cover border border-gray-100"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="font-bold text-gray-950 text-base font-sans">
                  {getChatDisplayName(activeChat)}
                </h3>
                <p className="text-xs text-gray-400 font-mono capitalize">
                  {getChatDisplayStatus(activeChat)}
                </p>
              </div>
            </div>

            {/* Header Call Simulations / Menus */}
            <div className="flex items-center gap-3 relative">
              <button 
                onClick={() => alert("Simulating a secure voice call... 📞 (Connection Success!)")}
                className="text-gray-500 hover:text-emerald-500 p-2 rounded-full hover:bg-gray-100 transition-all"
                title="Voice Call"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button 
                onClick={() => alert("Simulating an encrypted video conference... 🎥 (Video Connected!)")}
                className="text-gray-500 hover:text-emerald-500 p-2 rounded-full hover:bg-gray-100 transition-all"
                title="Video Call"
              >
                <Video className="w-5 h-5" />
              </button>
              
              {/* Extra operations menu */}
              <button 
                onClick={() => setShowHeaderDropdown(!showHeaderDropdown)}
                className="text-gray-500 hover:text-emerald-500 p-2 rounded-full hover:bg-gray-100 transition-all"
                id="chat_actions_toggle"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Action Dropdown Menu */}
              {showHeaderDropdown && (
                <div className="absolute right-0 top-12 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 w-48 z-25 text-sm text-gray-700">
                  <button
                    onClick={() => {
                      onClearChat(activeChat.id);
                      setShowHeaderDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-all"
                    id="clear_chat_action"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Chat History
                  </button>
                  <button
                    onClick={() => {
                      alert("Starred message indicators are verified!");
                      setShowHeaderDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 transition-all"
                  >
                    Mute Notifications
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages Flow Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ backgroundImage: "radial-gradient(#e2e8f0 1.2px, transparent 1.2px)", backgroundSize: "24px 24px" }} id="chat_scroll_stream">
            {activeChat.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto space-y-2 opacity-60">
                <Smile className="w-12 h-12 text-gray-400" />
                <h4 className="font-semibold text-gray-800">Clear Canvas</h4>
                <p className="text-xs text-gray-500">Send an introduction to start the dialogue stream safely here.</p>
              </div>
            ) : (
              activeChat.messages.map((msg, index) => {
                const isMyMessage = msg.senderId === currentUser.id;
                const senderName = users.find(u => u.id === msg.senderId)?.name || msg.senderId;
                const isMetaAISender = msg.senderId === "meta_ai";

                return (
                  <div
                    key={msg.id || index}
                    className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"}`}
                    id={`message_item_${msg.id}`}
                  >
                    <div 
                      className="group relative max-w-[70%] sm:max-w-[60%]"
                      onMouseEnter={() => setActiveMessageMenuId(msg.id)}
                      onMouseLeave={() => setActiveMessageMenuId(null)}
                    >
                      {/* Name tag in Group Chats */}
                      {activeChat.type === "group" && !isMyMessage && (
                        <span className="text-[10px] font-bold text-emerald-700 font-sans ml-1.5 mb-0.5 block">
                          {senderName}
                        </span>
                      )}

                      {/* Message bubble card */}
                      <div className={`p-3.5 rounded-2xl shadow-sm ${
                        isMyMessage 
                          ? "bg-emerald-600 text-white rounded-tr-none" 
                          : isMetaAISender
                            ? "bg-gradient-to-tr from-indigo-50 to-emerald-50 text-slate-900 rounded-tl-none border border-indigo-100"
                            : "bg-white text-gray-900 rounded-tl-none"
                      }`}>
                        
                        {/* If Media url present */}
                        {msg.mediaUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-black/5">
                            <img
                              src={msg.mediaUrl}
                              alt="attached thumbnail"
                              className="max-h-48 object-cover w-full"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {msg.text}
                        </p>

                        <div className="flex items-center justify-end gap-1.5 mt-1.5">
                          <span className={`text-[10px] font-mono ${isMyMessage ? "text-emerald-100" : "text-gray-400"}`}>
                            {formatTime(msg.timestamp)}
                          </span>
                          
                          {/* Receipt Check Marks for self, only */}
                          {isMyMessage && (
                            <span>
                              {msg.status === "sent" && <Check className="w-3.5 h-3.5 text-emerald-200" />}
                              {msg.status === "delivered" && <CheckCheck className="w-3.5 h-3.5 text-emerald-200 opacity-70" />}
                              {msg.status === "read" && <CheckCheck className="w-3.5 h-3.5 text-cyan-200" />}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bubble Emojis Reactions Picker */}
                      {activeMessageMenuId === msg.id && (
                        <div className={`absolute bottom-full mb-1.5 flex bg-white border border-gray-100 rounded-full shadow-lg p-1.5 gap-1.5 z-20 ${isMyMessage ? 'right-0' : 'left-0'}`}>
                          {EMOJI_PRESETS.map(emo => (
                            <button
                              key={emo}
                              onClick={() => onReactMessage(activeChat.id, msg.id, emo)}
                              className="hover:scale-130 transition-transform text-xs"
                            >
                              {emo}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Bubble Active Reactions Tray */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className={`flex gap-1 mt-1 flex-wrap ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                          {Object.entries(msg.reactions).map(([emo, usersAndIds]) => (
                            <span 
                              key={emo}
                              className="px-2 py-0.5 bg-gray-100 text-[10px] rounded-full border border-gray-200 flex items-center gap-1 cursor-pointer"
                              onClick={() => onReactMessage(activeChat.id, msg.id, emo)}
                              title={`${usersAndIds.length} reactions`}
                            >
                              <span>{emo}</span>
                              <span className="font-semibold text-gray-500">{usersAndIds.length}</span>
                            </span>
                          ))}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })
            )}

            {/* Bouncing Dots typing assistant simulator */}
            {activeChat.typingUserIds?.includes("meta_ai") ? (
              <div className="flex items-center space-x-2 bg-gradient-to-tr from-indigo-50/50 to-emerald-50/50 border border-indigo-100/50 p-3 rounded-2xl max-w-xs text-sm mr-auto rounded-tl-none">
                <span className="text-indigo-600 font-semibold text-xs animate-pulse">Meta AI is writing</span>
                <span className="flex space-x-1 items-center">
                  <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </div>
            ) : null}

            <div ref={messageEndRef} />
          </div>

          {/* In-chat quick replies helper for mock sandbox */}
          {activeChat.id === "chat_meta_ai" && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-t border-emerald-100 p-2.5 flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider font-mono mr-2">Quick Prompts:</span>
              <button 
                onClick={() => setInputText("Tell me a tech joke.")}
                className="bg-white border border-emerald-200 text-emerald-800 text-xs px-3 py-1 rounded-full hover:bg-emerald-50 transition-colors shrink-0"
              >
                🤖 Tech Joke
              </button>
              <button 
                onClick={() => setInputText("What are 3 trends in modern UI layouts?")}
                className="bg-white border border-emerald-200 text-emerald-800 text-xs px-3 py-1 rounded-full hover:bg-emerald-50 transition-colors shrink-0"
              >
                🎨 UI Layout Trends
              </button>
              <button 
                onClick={() => setInputText("Suggest a cool technology business name idea.")}
                className="bg-white border border-emerald-200 text-emerald-800 text-xs px-3 py-1 rounded-full hover:bg-emerald-50 transition-colors shrink-0"
              >
                🚀 Business Name Idea
              </button>
            </div>
          )}

          {/* Chat text Input Bar panel */}
          <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-3 relative z-10" id="chat_composer_bar">
            {/* Emojis selector trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-gray-400 hover:text-emerald-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                id="emoji_picker_toggle"
              >
                <Smile className="w-6 h-6" />
              </button>

              {/* Emoji quick presets */}
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 bg-white border border-gray-100 rounded-full shadow-xl p-2 flex gap-1.5 z-30">
                  {EMOJI_PRESETS.map(emo => (
                    <button
                      key={emo}
                      onClick={() => {
                        setInputText(prev => prev + emo);
                        setShowEmojiPicker(false);
                      }}
                      className="hover:scale-135 transition-transform text-lg"
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Attachment image templates trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="text-gray-400 hover:text-emerald-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                id="attachment_menu_toggle"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Quick Preset photos selection */}
              {showAttachmentMenu && (
                <div className="absolute bottom-12 left-0 bg-white border border-gray-100 rounded-2xl shadow-xl p-4 w-72 z-30 space-y-2">
                  <h5 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Image className="w-4.5 h-4.5" />
                    Simulate Image Attachment
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_ATTACHMENTS.map(item => (
                      <button
                        key={item.name}
                        onClick={() => handleSelectAttachment(item.url)}
                        className="group flex flex-col rounded-lg overflow-hidden border border-gray-100 hover:border-emerald-400 transition-all text-left"
                      >
                        <img src={item.url} alt={item.name} className="h-16 w-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                        <span className="p-1.5 text-[10px] font-medium block truncate text-gray-700 w-full bg-gray-50">{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Key input element */}
            <input
              type="text"
              placeholder="Type a secure message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 px-4 py-2 bg-gray-100 border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 transition-all text-gray-900 placeholder-gray-400"
              id="message_composer_input"
            />

            {/* Send action */}
            <button
              onClick={handleSend}
              className="bg-emerald-600 text-white p-2.5 rounded-2xl hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-600/10 active:scale-95"
              id="message_send_action"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
          <Smile className="w-16 h-16 text-gray-300 mb-2" />
          <h3 className="text-lg font-bold text-gray-700">Ready to chat</h3>
          <p className="text-sm text-gray-400 max-w-sm">Select any contact or construct a group workspace to initiate secure chatting streams.</p>
        </div>
      )}

      {/* NEW CONVERSATION DIALOG MODAL WIZARD */}
      {showNewChatDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Initialize Conversation
              </h3>
              <button 
                onClick={() => setShowNewChatDialog(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-semibold font-mono"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Conversation Medium</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      setNewChatType("direct");
                      setSelectedParticipants([]);
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${newChatType === "direct" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500"}`}
                  >
                    Direct Message
                  </button>
                  <button
                    onClick={() => {
                      setNewChatType("group");
                      setSelectedParticipants([]);
                    }}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${newChatType === "group" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-500"}`}
                  >
                    Multi-person Group
                  </button>
                </div>
              </div>

              {/* Group Name form */}
              {newChatType === "group" && (
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Group Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Design Enthusiasts, Project Alpha"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-900"
                    id="new_group_title_input"
                  />
                </div>
              )}

              {/* Participant Selection */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  {newChatType === "direct" ? "Select Participant" : "Select Group Members"}
                </label>
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 border border-gray-150 rounded-xl bg-gray-50/50 p-2 space-y-1">
                  {users
                    .filter(u => u.id !== currentUser.id && u.id !== "meta_ai") // Exclude self and AI (which is static)
                    .map(user => {
                      const isSelected = selectedParticipants.includes(user.id);
                      return (
                        <div
                          key={user.id}
                          onClick={() => {
                            if (newChatType === "direct") {
                              setSelectedParticipants([user.id]);
                            } else {
                              toggleParticipantSelection(user.id);
                            }
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                            isSelected ? "bg-emerald-500/10" : "hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-gray-100" referrerPolicy="no-referrer" />
                            <span className="text-sm font-medium text-gray-800">{user.name}</span>
                          </div>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isSelected ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-300 bg-white"
                          }`}>
                            {isSelected && <span className="text-[10px] font-bold">✓</span>}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNewChatDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChatSubmit}
                disabled={selectedParticipants.length === 0}
                className="px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-40"
                id="create_chat_confirm"
              >
                Launch Thread
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
