import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Standard Express Body Parsers
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Lazy initializer for Gemini client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Global In-Memory Persistent Database State
interface User {
  id: string;
  name: string;
  avatar: string;
  coverImage: string;
  bio: string;
  status: "online" | "offline" | "away";
  lastSeen?: string;
  friends: string[];
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  reactions: Record<string, string[]>; // emoji -> list of user IDs
  mediaUrl?: string;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  type: "direct" | "group";
  participants: string[];
  messages: Message[];
  unreadCount: Record<string, number>; // userId -> count
  typingUserIds?: string[];
}

interface Comment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

interface Post {
  id: string;
  authorId: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
  likes: string[]; // user IDs
  reactions: Record<string, string[]>; // reactionType -> array of user IDs
  comments: Comment[];
  isPinned?: boolean;
  groupId?: string; // e.g. "tech", "design", "general"
}

interface UserStatus {
  id: string;
  authorId: string;
  text: string;
  mediaUrl: string;
  createdAt: string;
  viewers: string[]; // user IDs
}

// Seed Database
let activeUserId = "alex";

const db = {
  users: [
    {
      id: "alex",
      name: "Alex Mercier",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150",
      coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&h=300",
      bio: "Full Stack Engineer | Passionate about clean craft in typography and spacious white-spaced code interfaces. Coffee drinker, traveler.",
      status: "online",
      friends: ["bob", "alice", "emma", "sarah"],
    },
    {
      id: "bob",
      name: "Bob Chen",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150",
      coverImage: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=800&h=300",
      bio: "Systems Architect & Compiler developer. Refactoring is my cardiovascular exercises. Speed and memory efficiency is the absolute truth.",
      status: "online",
      friends: ["alex", "alice", "emma"],
    },
    {
      id: "alice",
      name: "Alice Vance",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150",
      coverImage: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&h=300",
      bio: "Lead Product Designer. Typography enthusiast who fights against unnecessary borders and system noise. Creating balanced human-centric UIs.",
      status: "away",
      friends: ["alex", "bob", "emma"],
    },
    {
      id: "emma",
      name: "Emma Stone",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150",
      coverImage: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&h=300",
      bio: "Brand Coordinator. Bringing products to life via engaging human-driven storytelling and digital campaigns.",
      status: "offline",
      lastSeen: "2 hours ago",
      friends: ["alex", "bob", "alice", "sarah"],
    },
    {
      id: "sarah",
      name: "Sarah Jenkins",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150",
      coverImage: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&h=300",
      bio: "Wildlife & Landscape Photographer. Always chasing early-morning soft natural light in distant locations.",
      status: "online",
      friends: ["alex", "emma"],
    },
    {
      id: "meta_ai",
      name: "Meta AI",
      avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150", // Custom placeholder
      coverImage: "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=800&h=300",
      bio: "Dynamic Artificial Intelligence Assistant. Chat with me directly or ask me to polish your thoughts!",
      status: "online",
      friends: [],
    }
  ] as User[],

  chats: [
    {
      id: "chat_bob",
      name: "Bob Chen",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150",
      type: "direct",
      participants: ["alex", "bob"],
      unreadCount: { alex: 0, bob: 0 },
      messages: [
        {
          id: "m1",
          senderId: "bob",
          text: "Hey Alex! Do you have that repository link handy? The compiler is acting weird with the new ESM resolver package.",
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
          status: "read",
          reactions: { "👍": ["alex"] },
        },
        {
          id: "m2",
          senderId: "alex",
          text: "Hey Bob! Absolutely, let me grep it for you real quick and send it over.",
          timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(),
          status: "read",
          reactions: {},
        },
        {
          id: "m3",
          senderId: "bob",
          text: "Much appreciated! Also are we still up for coffee at 3 PM today? I need to bounce these AST transformation rules off you.",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          status: "read",
          reactions: {},
        },
        {
          id: "m4",
          senderId: "alex",
          text: "Yes, definitely! Let's meet at Coffee Lab. I'll test the new layout engine on my phone on the walk over.",
          timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
          status: "read",
          reactions: { "☕": ["bob"] },
        }
      ]
    },
    {
      id: "chat_alice",
      name: "Alice Vance",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150",
      type: "direct",
      participants: ["alex", "alice"],
      unreadCount: { alex: 1, alice: 0 },
      messages: [
        {
          id: "ma1",
          senderId: "alex",
          text: "Hey Alice, I loved the new frame layout choices you posted in Figma! The spacing ratios are incredibly comfortable.",
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
          status: "read",
          reactions: { "❤️": ["alice"] },
        },
        {
          id: "ma2",
          senderId: "alice",
          text: "Thank you so much, Alex! I actually tuned down the borders to let the content breathe. Do you think we should support a dark mode visual representation initially?",
          timestamp: new Date(Date.now() - 3600000 * 10).toISOString(),
          status: "read",
          reactions: {},
        },
        {
          id: "ma3",
          senderId: "alex",
          text: "Yes! A high-contrast charcoal black with vibrant details works incredibly well for creative developer users.",
          timestamp: new Date(Date.now() - 3600000 * 9).toISOString(),
          status: "read",
          reactions: {},
        },
        {
          id: "ma4",
          senderId: "alice",
          text: "Awesome, just updated the design system tokens. Let's build it out soon! 🎉",
          timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
          status: "delivered",
          reactions: {},
        }
      ]
    },
    {
      id: "chat_meta_ai",
      name: "Meta AI",
      avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150",
      type: "direct",
      participants: ["alex", "meta_ai", "bob", "alice", "emma", "sarah"],
      unreadCount: { alex: 0, bob: 0, alice: 0, emma: 0, sarah: 0, meta_ai: 0 },
      messages: [
        {
          id: "m_ai_1",
          senderId: "meta_ai",
          text: "Hello! I am your AI Assistant. I am integrated directly into your chat experience just like Meta AI on WhatsApp. Send me any questions, prompts or requests to explore my capabilities. I can also help you draft and write high-impact feed posts! Let me know how I can assist you today. 🌀⚡",
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          status: "read",
          reactions: {},
        }
      ]
    },
    {
      id: "chat_group_circle",
      name: "The Friday Coffee Circle ☕️",
      avatar: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=150&h=150",
      type: "group",
      participants: ["alex", "bob", "alice", "emma"],
      unreadCount: { alex: 0, bob: 0, alice: 0, emma: 0 },
      messages: [
        {
          id: "g1",
          senderId: "emma",
          text: "Who has some interesting ideas to try out for this weekend's branding campaign? We want something punchy!",
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          status: "read",
          reactions: {},
        },
        {
          id: "g2",
          senderId: "alice",
          text: "What if we do an interactive micro-game styled in 3D pastel colors? Engagement could double.",
          timestamp: new Date(Date.now() - 3600000 * 4.8).toISOString(),
          status: "read",
          reactions: { "🔥": ["emma"] },
        },
        {
          id: "g3",
          senderId: "bob",
          text: "If it's under 50KB bundle size, I'm game to write the engine. No heavy frameworks allowed!",
          timestamp: new Date(Date.now() - 3600000 * 4.5).toISOString(),
          status: "read",
          reactions: { "😂": ["alex", "alice"] },
        }
      ]
    }
  ] as Chat[],

  posts: [
    {
      id: "post1",
      authorId: "sarah",
      text: "Woke up at 5:00 AM to catch this breathtaking mist hanging over the Yosemite Valley meadows. The golden hour light this morning was absolutely quiet and pristine. Minimal lines, perfect silence. 🌅🌲📷",
      imageUrl: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1200&h=675",
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      likes: ["alex", "emma", "bob"],
      reactions: {
        "Like": ["alex", "emma"],
        "Love": ["bob"]
      },
      comments: [
        {
          id: "c1",
          authorId: "alex",
          text: "This is easily one of the best landscape photographs I've seen in months, Sarah! The scale and contrast are unreal.",
          createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        },
        {
          id: "c2",
          authorId: "emma",
          text: "Sarah, can we use this in our next ambient catalog backgrounds? It represents complete tranquility perfectly.",
          createdAt: new Date(Date.now() - 3600000 * 4.5).toISOString(),
        }
      ]
    },
    {
      id: "post2",
      authorId: "bob",
      text: "Working on the TypeScript type generator rules today. The sheer amount of overlapping intersection types in React hook libraries is mind-boggling. Any other developer friends feel like simple function boundaries are being buried under deep theoretical type science? 💻🧠☕️",
      createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
      likes: ["alex", "alice"],
      reactions: {
        "Like": ["alex"],
        "Haha": ["alice"]
      },
      comments: [
        {
          id: "c3",
          authorId: "alice",
          text: "I literally laugh in designer language. Every time I ask for a small button variant change, I get a 40-line type error package back from your compiler Bob 😂",
          createdAt: new Date(Date.now() - 3600000 * 9).toISOString(),
        },
        {
          id: "c4",
          authorId: "bob",
          text: "@alice Hey, those type constraints prevent runtime layout crashes! Security is beauty, too!",
          createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
        }
      ]
    },
    {
      id: "post3",
      authorId: "alice",
      text: "Just completed a comprehensive UI Audit of 12 modern communication apps. The primary takeaway is clear: the platforms that stand out are those that dare to use spacious paddings and drop redundant visual dividers. Contrast is a better separator than a thin gray line. 📏💡📐",
      imageUrl: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&w=1200&h=675",
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      likes: ["alex", "emma"],
      reactions: {
        "Like": ["emma"],
        "Love": ["alex"]
      },
      comments: [
        {
          id: "c5",
          authorId: "alex",
          text: "100% agreement. Grouping elements using common layout alignment grids is endlessly cleaner than enclosing them in rigid card frames.",
          createdAt: new Date(Date.now() - 3600000 * 22).toISOString(),
        }
      ]
    }
  ] as Post[],

  statuses: [
    {
      id: "s_alice",
      authorId: "alice",
      text: "Tuning color balance for dark slate assets 🎨",
      mediaUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&h=700",
      createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      viewers: ["alex", "bob"],
    },
    {
      id: "s_sarah",
      authorId: "sarah",
      text: "Early mountain packing ready! 🎒🏕️",
      mediaUrl: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&h=700",
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      viewers: ["alex"],
    },
    {
      id: "s_bob",
      authorId: "bob",
      text: "Compiling 140,000 files in 4.2 seconds!",
      mediaUrl: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=400&h=700",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      viewers: ["alex", "alice", "emma"],
    }
  ] as UserStatus[]
};

// API ENDPOINTS

// 1. Get entire app state
app.get("/api/state", (req, res) => {
  res.json({
    activeUserId,
    users: db.users,
    chats: db.chats,
    posts: db.posts,
    statuses: db.statuses,
    isAiLive: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
  });
});

// 2. Switch currently logged-in user (allows real-time multi-perspective simulation!)
app.post("/api/users/switch", (req, res) => {
  const { userId } = req.body;
  const userExists = db.users.some(u => u.id === userId);
  if (!userExists) {
    return res.status(404).json({ error: "User not found" });
  }
  activeUserId = userId;
  res.json({ success: true, activeUserId });
});

// 3. Send message (WhatsApp style)
app.post("/api/messages/send", async (req, res) => {
  const { chatId, text, mediaUrl } = req.body;
  const chatIndex = db.chats.findIndex(c => c.id === chatId);
  if (chatIndex === -1) {
    return res.status(404).json({ error: "Chat not found" });
  }

  const chat = db.chats[chatIndex];
  
  // Format message payload
  const newMessage: Message = {
    id: `msg_${Date.now()}`,
    senderId: activeUserId,
    text: text || "",
    timestamp: new Date().toISOString(),
    status: "sent",
    reactions: {},
  };

  if (mediaUrl) {
    newMessage.mediaUrl = mediaUrl;
  }

  chat.messages.push(newMessage);
  db.chats[chatIndex] = chat;

  // Track if this triggers the Meta AI response
  let triggeredAiResponse = false;
  let aiMessageText = "";

  const hasMention = text && (text.toLowerCase().includes("@ai") || text.toLowerCase().includes("@meta"));
  const isMetaAIChat = (chat.participants.includes("meta_ai") && newMessage.senderId !== "meta_ai") || hasMention;

  if (isMetaAIChat) {
    if (hasMention && !chat.participants.includes("meta_ai")) {
      chat.participants.push("meta_ai");
    }
    triggeredAiResponse = true;
    chat.unreadCount["meta_ai"] = 0; // AI consumes instantly
    
    // Simulate AI thinking and typing status
    chat.typingUserIds = ["meta_ai"];

    // Compile recent chat history to pass to Gemini
    const recentMessages = chat.messages.slice(-12).map(m => {
      const senderName = db.users.find(u => u.id === m.senderId)?.name || m.senderId;
      return `${senderName}: ${m.text}`;
    }).join("\n");

    const senderUser = db.users.find(u => u.id === activeUserId);
    const senderName = senderUser ? senderUser.name : "Alex";

    try {
      const aiClient = getGeminiClient();
      if (aiClient) {
        // Call the official modern SDK
        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `Below is a direct message conversation on a WhatsApp-style platform. Respond as "Meta AI", an intelligent, creative, friendly, and helpful companion. Write a concise, natural reply (1 to 4 sentences). Feel free to use emojis matching the vibe of the discussion. Never break character.

Context of user writing: Inside a chatting screen of a beautiful Social application.
Current Sender calling you: ${senderName} (Profile context: ${senderUser?.bio || "No profile bio"}).

Message History:
${recentMessages}

Your Response as Meta AI:`,
        });

        aiMessageText = response.text || "I apologize, but I received an empty response. Let me try compiling that again!";
      } else {
        // Mock fallback responses for local sandbox demonstration
        const fallbackOptions = [
          `Hey ${senderName}! It's great chatting with you. Note: Connect your GEMINI_API_KEY in the Secrets panel on AI Studio to enable active, smart, server-powered AI conversations with me in real time! 🌀💡`,
          `That sounds interesting, ${senderName}! Tell me more. To get fully contextual AI responses, establish your GEMINI_API_KEY inside the cloud run developer panel settings on Google AI Studio.`,
          `I am running in showcase simulated mode. To unlock my comprehensive capabilities (e.g. translation, code suggestions, design reviews, image queries), save a valid Google Gemini API Key in the panel environment variables.`,
          `Understood! I'm here to demonstrate the WhatsApp companion model. Add the api key to the Settings to make real live queries! ⚡`
        ];
        aiMessageText = fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
      }
    } catch (err: any) {
      console.error("Gemini calling failure:", err);
      aiMessageText = `Oops, error calling the Gemini API: ${err?.message || "Internal server error"}. Check your environment setup, or let me know if you want to retry.`;
    }

    // Add AI message to chat
    const aiMessage: Message = {
      id: `msg_ai_${Date.now() + 1}`,
      senderId: "meta_ai",
      text: aiMessageText,
      timestamp: new Date().toISOString(),
      status: "read",
      reactions: {},
    };
    
    // Clear typing and insert message
    chat.messages.push(aiMessage);
    chat.typingUserIds = [];
    
    // Set unread count for other participants
    chat.participants.forEach(pId => {
      if (pId !== "meta_ai") {
        chat.unreadCount[pId] = (chat.unreadCount[pId] || 0) + 1;
      }
    });

    db.chats[chatIndex] = chat;
  } else {
    // Standard simulation of recipient reply after a few seconds or instant delivery tag update
    // Update delivery status for mock human chats
    setTimeout(() => {
      newMessage.status = "delivered";
    }, 1000);

    setTimeout(() => {
      newMessage.status = "read";
    }, 2800);

    // Increase unread count for all other participants in the chat
    chat.participants.forEach(pId => {
      if (pId !== activeUserId) {
        chat.unreadCount[pId] = (chat.unreadCount[pId] || 0) + 1;
      }
    });
  }

  res.json({
    success: true,
    message: newMessage,
    triggeredAiResponse,
    aiReplyText: aiMessageText
  });
});

// 4. React to a message (WhatsApp custom reactions picker)
app.post("/api/messages/react", (req, res) => {
  const { chatId, messageId, emoji } = req.body;
  const chatIndex = db.chats.findIndex(c => c.id === chatId);
  if (chatIndex === -1) {
    return res.status(404).json({ error: "Chat not found" });
  }

  const chat = db.chats[chatIndex];
  const msgIndex = chat.messages.findIndex(m => m.id === messageId);
  if (msgIndex === -1) {
    return res.status(404).json({ error: "Message not found" });
  }

  const msg = chat.messages[msgIndex];
  if (!msg.reactions) {
    msg.reactions = {};
  }

  // If user has already reacted with this emoji, remove it; otherwise add it
  const currentReactorList = msg.reactions[emoji] || [];
  if (currentReactorList.includes(activeUserId)) {
    msg.reactions[emoji] = currentReactorList.filter(id => id !== activeUserId);
    if (msg.reactions[emoji].length === 0) {
      delete msg.reactions[emoji];
    }
  } else {
    // Remove active user profile ID from other reactions first (single reaction standard)
    Object.keys(msg.reactions).forEach(react => {
      msg.reactions[react] = (msg.reactions[react] || []).filter(id => id !== activeUserId);
      if (msg.reactions[react].length === 0) {
        delete msg.reactions[react];
      }
    });
    msg.reactions[emoji] = [...(msg.reactions[emoji] || []), activeUserId];
  }

  chat.messages[msgIndex] = msg;
  db.chats[chatIndex] = chat;

  res.json({ success: true, reactions: msg.reactions });
});

// 5. Create a feed post (Facebook style)
app.post("/api/posts/create", (req, res) => {
  const { text, imageUrl, groupId } = req.body;
  if (!text && !imageUrl) {
    return res.status(400).json({ error: "Post cannot be empty" });
  }

  const newPost: Post = {
    id: `post_${Date.now()}`,
    authorId: activeUserId,
    text: text || "",
    imageUrl: imageUrl || undefined,
    createdAt: new Date().toISOString(),
    likes: [],
    reactions: {},
    comments: [],
    groupId: groupId || undefined
  };

  db.posts.unshift(newPost); // Push to the top of feed
  res.json({ success: true, post: newPost });
});

// 6. React/like a post (Facebook standard likes)
app.post("/api/posts/react", (req, res) => {
  const { postId, reactionType } = req.body; // e.g., 'Like', 'Love', 'Haha', 'Wow', 'Sad', 'Angry'
  const postIndex = db.posts.findIndex(p => p.id === postId);
  if (postIndex === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  const post = db.posts[postIndex];

  // Initialize reactions dictionary
  if (!post.reactions) {
    post.reactions = {};
  }

  let removedReaction = false;
  let addedReaction = false;

  // Toggle logical likes listing
  if (post.likes.includes(activeUserId)) {
    post.likes = post.likes.filter(id => id !== activeUserId);
    
    // Also prune from reactions tray
    Object.keys(post.reactions).forEach(react => {
      post.reactions[react] = (post.reactions[react] || []).filter(id => id !== activeUserId);
      if (post.reactions[react].length === 0) {
        delete post.reactions[react];
      }
    });
    removedReaction = true;
  } else {
    post.likes.push(activeUserId);
    if (!post.reactions[reactionType]) {
      post.reactions[reactionType] = [];
    }
    post.reactions[reactionType].push(activeUserId);
    addedReaction = true;
  }

  db.posts[postIndex] = post;
  res.json({ success: true, likes: post.likes, reactions: post.reactions });
});

// 7. Post a comment on a feed item (Facebook comments)
app.post("/api/posts/comment", (req, res) => {
  const { postId, text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Comment text is required" });
  }

  const postIndex = db.posts.findIndex(p => p.id === postId);
  if (postIndex === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  const originalPost = db.posts[postIndex];
  const newComment: Comment = {
    id: `comment_${Date.now()}`,
    authorId: activeUserId,
    text: text,
    createdAt: new Date().toISOString(),
  };

  originalPost.comments.push(newComment);
  db.posts[postIndex] = originalPost;

  res.json({ success: true, comment: newComment });
});

// 8. Create a Status status (WhatsApp Story)
app.post("/api/statuses/create", (req, res) => {
  const { text, mediaUrl } = req.body;
  if (!text && !mediaUrl) {
    return res.status(400).json({ error: "Status must contain caption or image" });
  }

  // Static images fallback for status if not provided
  const imgUrl = mediaUrl || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&h=700";

  const newStatus: UserStatus = {
    id: `status_${Date.now()}`,
    authorId: activeUserId,
    text: text || "",
    mediaUrl: imgUrl,
    createdAt: new Date().toISOString(),
    viewers: [],
  };

  db.statuses.unshift(newStatus);
  res.json({ success: true, status: newStatus });
});

// 9. Add and follow friends
app.post("/api/users/add-friend", (req, res) => {
  const { targetUserId } = req.body;
  const targetUser = db.users.find(u => u.id === targetUserId);
  const activeUser = db.users.find(u => u.id === activeUserId);

  if (!targetUser || !activeUser) {
    return res.status(404).json({ error: "User profile not found" });
  }

  if (activeUser.friends.includes(targetUserId)) {
    // Unfollow / remove friend
    activeUser.friends = activeUser.friends.filter(id => id !== targetUserId);
    targetUser.friends = targetUser.friends.filter(id => id !== activeUserId);
  } else {
    // Follow / add friend
    activeUser.friends.push(targetUserId);
    targetUser.friends.push(activeUserId);
  }

  res.json({ success: true, activeFriends: activeUser.friends, targetFriends: targetUser.friends });
});

// 10. AI-powered Post Drafting and refinement (using Gemini!)
app.post("/api/posts/ai-help", async (req, res) => {
  const { userPrompt, styleOption } = req.body; // styleOption: e.g. "Professional", "Casual & Humorous", "Tech-Forward", "Persuasive Storyteller"
  
  if (!userPrompt) {
    return res.status(400).json({ error: "Please enter a prompt ideas list for AI help!" });
  }

  try {
    const aiClient = getGeminiClient();
    if (aiClient) {
      const gResponse = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: "You are a professional social media branding consultant and writer.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refinedDraft: {
                type: Type.STRING,
                description: "The primary beautifully formatted post ready to copy, with correct markdown styling and balanced paragraphs.",
              },
              alternatives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2 shorter alternative versions with different hooks.",
              },
              suggestedHashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Between 3 to 6 high-traffic contextual hashtags.",
              }
            },
            required: ["refinedDraft", "alternatives", "suggestedHashtags"],
          }
        },
        contents: `Draft an engaging social media feed post based on the following input idea: "${userPrompt}"
Style Tone to apply: ${styleOption || "Creative & Professional"}. Make sure the output uses emojis, clean whitespace, and strong visual phrasing.`,
      });

      const parsedData = JSON.parse(gResponse.text || "{}");
      res.json({ ...parsedData, success: true });
    } else {
      // Robust simulated post helper structure
      const mockPolished = `🚀 Brainstorming session outcome:\n\n"${userPrompt}" has been polished into a masterpiece! Ready to conquer the feed with structured details, creative bullet points, and clean whitespace.\n\n✨ Why this matters: Connecting elements through layout grids is endlessly cleaner than thick gray bounds. Let's make communication beautiful!\n\n💡 Tip: Connect a valid GEMINI_API_KEY to unlock advanced deep-reasoning multi-style post builders in real time here!`;
      res.json({
        success: true,
        refinedDraft: mockPolished,
        alternatives: [
          `Simulated Draft Idea A: Quick snackable takeaway regarding: ${userPrompt}`,
          `Simulated Draft Idea B: Conversational question to engage: "${userPrompt} What are your thoughts?"`
        ],
        suggestedHashtags: ["#SocialFeed", "#SimulatedAI", "#TechDesign", "#CleanUI"]
      });
    }
  } catch (err: any) {
    console.error("Gemini AI Post Helper error:", err);
    res.status(500).json({ error: err?.message || "Internal server error during post synthesis." });
  }
});

// AI IMAGE GENERATION (Imagen / Gemini Flash Image) AND PERSONA PLAYS API
app.post("/api/ai/generate-image", async (req, res) => {
  const { prompt, aspectRatio } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Image prompt is required" });
  }

  try {
    const aiClient = getGeminiClient();
    if (aiClient) {
      // call official gemini-2.5-flash-image API
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio || "1:1"
          }
        }
      });

      let base64Image = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (base64Image) {
        return res.json({ success: true, imageUrl: base64Image });
      } else {
        throw new Error("No inlineData image returned from Gemini models.");
      }
    } else {
      // Elegant category dynamic placeholder
      const categories = ["tech", "developer", "design", "office", "minimal", "vector"];
      const rCategory = categories[Math.floor(Math.random() * categories.length)];
      const randomSeed = Math.floor(Math.random() * 123456);
      const outputUrl = `https://images.unsplash.com/featured/?${encodeURIComponent(prompt || rCategory)}&sig=${randomSeed}`;
      
      return res.json({ 
        success: true, 
        imageUrl: outputUrl,
        simulated: true,
        message: "Gemini Image Studio simulation active. Configure GEMINI_API_KEY in secrets to compile real base64 image data!"
      });
    }
  } catch (err: any) {
    console.error("Gemini image generator error:", err);
    res.status(500).json({ error: err?.message || "Error during AI image synthesis" });
  }
});

app.post("/api/ai/chat-agent", async (req, res) => {
  const { messages, agentId } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array required" });
  }

  const agentSettings: Record<string, { name: string; system: string }> = {
    tech: {
      name: "Tech Analyst Co-pilot",
      system: "You are Sardonix-Tech, a brilliant, tech-forward, high-performance software architect. You specialize in performance optimization, responsive React structures, compiler systems, and clean typescript hierarchies. Speak logically, cleanly, with space-separated bullet points."
    },
    designer: {
      name: "Smart Creative Critic",
      system: "You are Alice-Vance, a veteran digital product & high-fidelity branding design lead. You focus on visual simplicity, high typographic contrast, proper negative spaces, and clean layouts. Criticize code alignment or interface worries construct-by-construct."
    },
    sarcastic: {
      name: "Sardonix (Sarcastic Bot)",
      system: "You are Sardonix, a highly intelligent but extremely sarcastic and humorous AI companion. You find human code worries and UI layout concerns funny, but you ultimately provide incredibly helpful, step-by-step guidance, heavily wrapped in mild irritation and dry humor."
    }
  };

  const activeAgent = agentSettings[agentId] || agentSettings["tech"];
  
  try {
    const aiClient = getGeminiClient();
    if (aiClient) {
      // Format messages into clean dialog sequence
      const formattedStream = messages.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");
      
      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: activeAgent.system
        },
        contents: `${formattedStream}\n\nAssistant:`
      });

      return res.json({ success: true, text: response.text || "No output compiled." });
    } else {
      // Elegant simulated responses that are responsive to what they asked
      const userAsked = messages[messages.length - 1]?.content || "";
      let simulatedReply = "";
      if (agentId === "sarcastic") {
        simulatedReply = `[${activeAgent.name}]: Oh, fascinating query! "User asks: ${userAsked}". I'd answer that perfectly but sandbox simulation is currently active with no GEMINI_API_KEY registered. To unleash Sardonix's real witty intellect, please configure your API key!`;
      } else if (agentId === "designer") {
        simulatedReply = `[${activeAgent.name}]: I've analyzed your prompt concerning: "${userAsked}". Visually, we need to balance the layout with lots of white space. Simulate key activation to compile custom UI blueprints!`;
      } else {
        simulatedReply = `[${activeAgent.name} - Compilation Simulation]: Your query regarding "${userAsked}" is noted. Without a live GEMINI_API_KEY secret, I'm analyzing structures with local logic. Initialize your key to get accurate Gemini advice!`;
      }
      return res.json({ success: true, text: simulatedReply });
    }
  } catch (err: any) {
    console.error("Gemini agent chat failure:", err);
    res.status(500).json({ error: err?.message || "Error running chat agent." });
  }
});

// Clear Chat conversation
app.post("/api/chats/clear", (req, res) => {
  const { chatId } = req.body;
  const chatIndex = db.chats.findIndex(c => c.id === chatId);
  if (chatIndex !== -1) {
    db.chats[chatIndex].messages = [];
    db.chats[chatIndex].unreadCount = {};
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Chat not found" });
  }
});

// Create new direct or group chat
app.post("/api/chats/create", (req, res) => {
  const { type, name, participantIds, avatar } = req.body;
  if (!participantIds || participantIds.length === 0) {
    return res.status(400).json({ error: "At least one participant required" });
  }

  // Include active user automatically
  const allParticipants = Array.from(new Set([activeUserId, ...participantIds]));
  const defaultGroupPic = "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=150&h=150";

  const newChat: Chat = {
    id: `chat_${Date.now()}`,
    name: name || "New Chat",
    avatar: avatar || defaultGroupPic,
    type: type || "direct",
    participants: allParticipants,
    messages: [
      {
        id: `msg_init_${Date.now()}`,
        senderId: "meta_ai",
        text: `Chat initialized. Say hello to ${allParticipants.map(id => db.users.find(u => u.id === id)?.name || id).join(", ")}!`,
        timestamp: new Date().toISOString(),
        status: "read",
        reactions: {}
      }
    ],
    unreadCount: {}
  };

  allParticipants.forEach(pId => {
    newChat.unreadCount[pId] = pId === activeUserId ? 0 : 1;
  });

  db.chats.push(newChat);
  res.json({ success: true, chat: newChat });
});

// VITE MIDDLEWARE AND STANDALONE STATIC BUILDING
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Social App Server] running beautifully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
