import React, { useState } from "react";
import { 
  User as UserIcon, BookOpen, Users, MapPin, Link as LinkIcon, 
  Settings, Check, UserPlus, ShieldAlert, FileText, Folder
} from "lucide-react";
import { User, Post } from "../types";

interface ProfileSectionProps {
  activeUser: User;
  allUsers: User[];
  posts: Post[];
  onSwitchUser: (userId: string) => Promise<void>;
  onAddFriend: (targetUserId: string) => Promise<void>;
}

export default function ProfileSection({
  activeUser,
  allUsers,
  posts,
  onSwitchUser,
  onAddFriend
}: ProfileSectionProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>(activeUser.id);
  const [activeTab, setActiveTab] = useState<"wall" | "friends" | "about">("wall");

  const targetProfile = allUsers.find(u => u.id === selectedProfileId) || activeUser;
  const isMe = targetProfile.id === activeUser.id;

  // Filter posts published only by this user
  const timelinePosts = posts.filter(p => p.authorId === targetProfile.id);

  const getFriendDetails = (friendId: string) => {
    return allUsers.find(u => u.id === friendId);
  };

  const isAlreadyFriend = activeUser.friends.includes(targetProfile.id);

  return (
    <div className="max-w-5xl mx-auto p-2 md:p-6 space-y-6" id="profile_explorer_layout">
      
      {/* MOCK USERS LAUNCHER SWITCH PANEL */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
          Simulate Workspace: Switch Active Profile Hub
        </span>
        <div className="flex flex-wrap gap-2">
          {allUsers.map((u) => {
            const isCurrentlySelected = selectedProfileId === u.id;
            return (
              <button
                key={u.id}
                onClick={() => {
                  setSelectedProfileId(u.id);
                  setActiveTab("wall");
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  isCurrentlySelected 
                    ? "bg-indigo-650 text-white border-indigo-600 shadow-xs font-bold" 
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100/75 text-gray-700"
                }`}
              >
                <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                <span>{u.name}</span>
                {u.id === activeUser.id && (
                  <span className="bg-emerald-500 text-white text-[9px] px-1 rounded-sm uppercase tracking-widest font-bold">Me</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CORE PROFILE CARD DISPLAY BANNER */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm" id="profile_header_card">
        {/* Cover Photo */}
        <div className="h-44 md:h-56 bg-gray-100 relative">
          <img 
            src={targetProfile.coverImage} 
            alt="cover backdrop" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-mono">
            {targetProfile.coverImage ? "HD Backing Banner" : "Standard Palette"}
          </div>
        </div>

        {/* User main info Overlap and Details */}
        <div className="p-6 relative pt-0 flex flex-col md:flex-row items-center md:items-end justify-between gap-4 border-b border-gray-100">
          
          {/* Avatar and Info left side */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-16 md:-mt-12 z-10 text-center md:text-left">
            <div className="relative">
              <img
                src={targetProfile.avatar}
                alt={targetProfile.name}
                className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-md bg-white"
                referrerPolicy="no-referrer"
              />
              <span className={`absolute bottom-2 right-2 w-4.5 h-4.5 border-4 border-white rounded-full ${
                targetProfile.status === "online" ? "bg-green-500" : targetProfile.status === "away" ? "bg-amber-500" : "bg-gray-400"
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-950 font-sans">
                  {targetProfile.name}
                </h2>
                <span className="text-xs text-gray-400 font-mono italic">
                  (@{targetProfile.id})
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 max-w-md leading-relaxed">
                {targetProfile.bio}
              </p>
            </div>
          </div>

          {/* Action switcher buttons right side */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 z-10">
            {isMe ? (
              <button
                onClick={() => alert("Profile updates features are configured! Change details freely in code or DB simulated blocks.")}
                className="px-4 py-2 border border-gray-200 text-xs font-semibold rounded-xl text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Edit Profile Space
              </button>
            ) : (
              <>
                {/* Switch Active User completely */}
                <button
                  onClick={async () => {
                    await onSwitchUser(targetProfile.id);
                  }}
                  className="px-4 py-2 bg-indigo-600 font-bold hover:bg-indigo-700 text-white text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-650/10 active:scale-95"
                  id={`switch_to_user_auth_${targetProfile.id}`}
                >
                  <UserIcon className="w-4 h-4" />
                  Login as {targetProfile.name.split(" ")[0]}
                </button>

                {/* Follow friendship action */}
                <button
                  onClick={() => onAddFriend(targetProfile.id)}
                  className={`px-4 py-2 border text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors ${
                    isAlreadyFriend 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                  id={`add_friend_toggle_action_${targetProfile.id}`}
                >
                  {isAlreadyFriend ? (
                    <>
                      <Check className="w-4 h-4" />
                      Connected Friend
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Add Contact Friend
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile specific subsections toggle tabs */}
        <div className="px-6 flex bg-gray-50/50">
          {[
            { id: "wall", label: "Timeline Posts", icon: <FileText className="w-4 h-4" /> },
            { id: "friends", label: `Friends List (${targetProfile.friends.length})`, icon: <Users className="w-4 h-4" /> },
            { id: "about", label: "About details", icon: <BookOpen className="w-4 h-4" /> }
          ].map(tb => (
            <button
              key={tb.id}
              onClick={() => setActiveTab(tb.id as any)}
              className={`py-3 px-4 border-b-2 font-semibold text-xs flex items-center gap-2 transition-all ${
                activeTab === tb.id 
                  ? "border-indigo-600 text-indigo-700" 
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {tb.icon}
              <span>{tb.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* DETAILED CONTENT AREA BASED ON TAB VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* SMALL SIDEBAR DETAILS (Metadata details) */}
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider">Intro Summary</h4>
            
            <div className="space-y-3.5 text-xs text-gray-750">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4.5 h-4.5 text-gray-400" />
                <span>Lives in <span className="font-semibold text-gray-850">San Francisco, CA</span></span>
              </div>
              <div className="flex items-center gap-2.5">
                <LinkIcon className="w-4.5 h-4.5 text-gray-400" />
                <span className="text-indigo-600 hover:underline cursor-pointer truncate">creativeportfolios.io/{targetProfile.id}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Users className="w-4.5 h-4.5 text-gray-400" />
                <span>Connected to <span className="font-semibold text-gray-850">{targetProfile.friends.length} active contacts</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* PRIMARY SUBSECTION GRID AREA */}
        <div className="md:col-span-2">
          
          {/* TAB 1: Profile wall timeline posts */}
          {activeTab === "wall" && (
            <div className="space-y-4">
              {timelinePosts.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div className="flex items-center gap-2.5 text-xs text-gray-400 font-mono">
                    <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-full font-bold">Timeline Item</span>
                    <span>• {new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-900 text-sm whitespace-pre-wrap leading-relaxed">{p.text}</p>
                  
                  {p.imageUrl && (
                    <div className="rounded-xl overflow-hidden border border-gray-100">
                      <img src={p.imageUrl} alt="post visual attachment" className="w-full object-cover max-h-60" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
                    <span>👍 {p.likes.length} reactions</span>
                    <span>• {p.comments.length} comments</span>
                  </div>
                </div>
              ))}

              {timelinePosts.length === 0 && (
                <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-150 border-dashed">
                  <Folder className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-500" />
                  <p className="text-sm">No timeline posts published by this author yet.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Friends list connections dashboard */}
          {activeTab === "friends" && (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-950 font-sans text-base">Friend Contacts ({targetProfile.friends.length})</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {targetProfile.friends.map(friendId => {
                  const fDetails = getFriendDetails(friendId);
                  if (!fDetails) return null;
                  return (
                    <div 
                      key={friendId}
                      onClick={() => {
                        setSelectedProfileId(friendId);
                        setActiveTab("wall");
                      }}
                      className="p-3 border border-gray-100 rounded-xl flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <img src={fDetails.avatar} alt={fDetails.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" referrerPolicy="no-referrer" />
                        <div>
                          <h4 className="font-semibold text-xs text-gray-900">{fDetails.name}</h4>
                          <span className="text-[10px] text-gray-400 capitalize">{fDetails.status}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {targetProfile.friends.length === 0 && (
                <p className="text-xs text-gray-400 italic py-4 text-center">No active connections. Add some contacts above!</p>
              )}
            </div>
          )}

          {/* TAB 3: Long About specifics */}
          {activeTab === "about" && (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 text-xs font-sans text-gray-700">
              <h3 className="font-bold text-gray-950 text-base mb-2">Technical Bio & Focus</h3>
              
              <div className="space-y-4 leading-relaxed">
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Introduction Statement</h4>
                  <p>{targetProfile.bio || "No custom biography established for this user persona."}</p>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-1">Simulation Permissions Scope</h4>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {["Read conversations", "Publish feed commentary", "Toggle reactions", "Add friends", "Simulate login"].map(pTag => (
                      <span key={pTag} className="bg-gray-150 text-gray-600 px-2.5 py-0.5 rounded-md font-mono text-[10px] border border-gray-200">
                        {pTag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-red-50 text-red-800 border border-red-100 rounded-xl flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-[10px]">
                    This user profile workspace is stored directly inside the server's sandboxed environment database context.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
