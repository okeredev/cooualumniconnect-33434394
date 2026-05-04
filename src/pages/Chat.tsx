import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePresence, formatLastSeen } from "@/hooks/usePresence";
import { Hash, Loader2, MessageCircle, Send, Users, Image as ImageIcon, Video, Paperclip, Plus, Pencil, Trash2, X, Check, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Channel = { id: string; name: string; description: string | null };
type Message = { id: string; sender_id: string; channel_id: string | null; recipient_id: string | null; content: string; created_at: string; file_url?: string | null; file_type?: string | null };
type ProfileMini = { user_id: string; display_name: string | null; avatar_url: string | null; last_seen_at: string | null; alt_email?: string | null; phone?: string | null; whatsapp?: string | null; hide_phone?: boolean };

type ActiveTarget = { kind: "channel"; id: string; label: string } | { kind: "dm"; id: string; label: string; alt_email?: string | null; phone?: string | null; whatsapp?: string | null; hide_phone?: boolean };

const ChatPage = () => {
  const { user, isAdmin } = useAuth();
  const { online } = usePresence();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<Set<string>>(new Set());
  const [people, setPeople] = useState<ProfileMini[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileMini>>({});
  const [active, setActive] = useState<ActiveTarget | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"channels" | "dms">("channels");
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => { 
    if (!user) return;
    document.title = "Chat — COOU Alumni Connect"; 
    init(); 
  }, [user]);

  const init = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ch, mb, pr] = await Promise.all([
        supabase.from("chat_channels").select("*").order("name"),
        supabase.from("chat_channel_members").select("channel_id").eq("user_id", user.id),
        supabase.from("profiles").select("user_id, display_name, avatar_url, last_seen_at, alt_email, phone, whatsapp, hide_phone").neq("user_id", user.id).limit(100),
      ]);
      if (ch.error) console.warn("Chat channels error:", ch.error.message);
      if (mb.error) console.warn("Chat members error:", mb.error.message);
      setChannels((ch.data ?? []) as Channel[]);
      setMembers(new Set(((mb.data ?? []) as any[]).map((m) => m.channel_id)));
      const ps = (pr.data ?? []) as ProfileMini[];
      setPeople(ps);
      const map: Record<string, ProfileMini> = {};
      ps.forEach((p) => { map[p.user_id] = p; });
      setProfilesById(map);
    } catch (err) {
      console.error("Chat init failed:", err);
      toast.error("Failed to load chat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!active || !user) return;
    let cancelled = false;
    setHasMore(true);
    lastMessageIdRef.current = null;
    (async () => {
      try {
        const q = supabase.from("chat_messages").select("*").order("created_at", { ascending: false }).limit(20);
        const { data, error } = active.kind === "channel"
          ? await q.eq("channel_id", active.id)
          : await q.or(`and(sender_id.eq.${user.id},recipient_id.eq.${active.id}),and(sender_id.eq.${active.id},recipient_id.eq.${user.id})`);
        
        if (error) {
          console.error("Chat fetch error:", error);
          toast.error("Failed to load messages");
        } else if (!cancelled) {
          const msgs = (data ?? []) as Message[];
          setMessages(msgs.reverse());
          setHasMore(msgs.length === 20);
        }
      } catch (err) {
        console.error("Critical chat fetch error:", err);
        if (!cancelled) toast.error("An unexpected error occurred loading chat");
      }
    })();

    const channel = supabase.channel(`chat-${active.kind}-${active.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.new as Message;
        const isMatch = active.kind === "channel"
          ? m.channel_id === active.id
          : m.channel_id === null && ((m.sender_id === user.id && m.recipient_id === active.id) || (m.sender_id === active.id && m.recipient_id === user.id));
        if (isMatch) setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.new as Message;
        setMessages((prev) => prev.map((msg) => msg.id === m.id ? m : msg));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (payload) => {
        const id = payload.old.id;
        setMessages((prev) => prev.filter((msg) => msg.id !== id));
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [active, user]);

  useEffect(() => { 
    if (messages.length === 0) return;
    const lastMsgId = messages[messages.length - 1].id;
    if (lastMsgId !== lastMessageIdRef.current) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); 
      lastMessageIdRef.current = lastMsgId;
    }
  }, [messages]);

  const loadMoreMessages = async () => {
    if (!active || !user || !hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    const scrollNode = scrollRef.current;
    const oldScrollHeight = scrollNode ? scrollNode.scrollHeight : 0;
    
    const oldestMsg = messages[0];
    const q = supabase.from("chat_messages").select("*").order("created_at", { ascending: false }).limit(20).lt("created_at", oldestMsg.created_at);
    
    const { data, error } = active.kind === "channel"
      ? await q.eq("channel_id", active.id)
      : await q.or(`and(sender_id.eq.${user.id},recipient_id.eq.${active.id}),and(sender_id.eq.${active.id},recipient_id.eq.${user.id})`);
      
    if (error) {
      console.error("Load more error:", error);
      toast.error("Could not load more messages");
    } else {
      const newMsgs = (data ?? []) as Message[];
      setMessages(prev => [...newMsgs.reverse(), ...prev]);
      setHasMore(newMsgs.length === 20);
    }
    setLoadingMore(false);
    
    setTimeout(() => {
      if (scrollNode) scrollNode.scrollTop = scrollNode.scrollHeight - oldScrollHeight;
    }, 10);
  };

  const join = async (c: Channel) => {
    if (!user) return;
    if (!members.has(c.id)) {
      const { error } = await supabase.from("chat_channel_members").insert({ channel_id: c.id, user_id: user.id });
      if (error) return toast.error(error.message);
      setMembers((s) => new Set(s).add(c.id));
    }
    setActive({ kind: "channel", id: c.id, label: `#${c.name}` });
  };

  const send = async (fileUrl?: string, fileType?: string) => {
    if (!user || !active || (!text.trim() && !fileUrl)) return;
    const payload: any = { sender_id: user.id, content: text.trim().slice(0, 2000) };
    if (active.kind === "channel") payload.channel_id = active.id; else payload.recipient_id = active.id;
    if (fileUrl) {
      payload.file_url = fileUrl;
      payload.file_type = fileType;
    }
    setText("");
    const { error } = await supabase.from("chat_messages").insert(payload);
    if (error) toast.error(error.message);
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("chat_messages").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Message deleted");
  };

  const startEdit = (m: Message) => {
    setEditingId(m.id);
    setEditText(m.content);
    toast.info("Editing message...");
  };

  const saveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    const { error } = await supabase.from("chat_messages").update({ content: editText.trim() }).eq("id", editingId);
    if (error) toast.error(error.message);
    else {
      setEditingId(null);
      setEditText("");
    }
  };

  const [uploading, setUploading] = useState(false);
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploading(true);
    const ext = file.name.split('.').pop();
    const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
    const path = `${user.id}/${Date.now()}.${ext}`;
    
    const { error: uploadError } = await supabase.storage.from("chat_attachments").upload(path, file);
    if (uploadError) {
      toast.error(uploadError.message);
      setUploading(false);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage.from("chat_attachments").getPublicUrl(path);
    await send(publicUrl, type);
    setUploading(false);
  };

  const filteredPeople = people.filter((p) => !search || (p.display_name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell>
      <section className="container py-6">
        <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-180px)] min-h-[500px]">
          <aside className={`rounded-2xl bg-card border border-border/60 flex flex-col overflow-hidden transition-all duration-300 ${active ? "hidden md:flex" : "flex"}`}>
            <div className="flex border-b border-border/60">
              <button onClick={() => setTab("channels")} className={`flex-1 py-2.5 text-sm font-medium ${tab === "channels" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}><Hash className="w-4 h-4 inline mr-1" />Channels</button>
              <button onClick={() => setTab("dms")} className={`flex-1 py-2.5 text-sm font-medium ${tab === "dms" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}><Users className="w-4 h-4 inline mr-1" />Direct</button>
            </div>
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto my-6" /> : tab === "channels" ? (
              <div className="overflow-y-auto p-2 space-y-1">
                {channels.map((c) => (
                  <button key={c.id} onClick={() => join(c)} className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted ${active?.kind === "channel" && active.id === c.id ? "bg-muted font-semibold" : ""}`}>
                    <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-muted-foreground" />{c.name}</div>
                    {c.description && <div className="text-xs text-muted-foreground line-clamp-1 ml-5">{c.description}</div>}
                  </button>
                ))}
                {channels.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No channels yet.</p>}
              </div>
            ) : (
              <div className="overflow-y-auto">
                <div className="p-2"><Input placeholder="Search alumni..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                <div className="p-2 space-y-1">
                  {filteredPeople.map((p) => {
                    const isOnline = online.has(p.user_id);
                    return (
                      <button key={p.user_id} onClick={() => setActive({ kind: "dm", id: p.user_id, label: p.display_name || "Alumnus", alt_email: p.alt_email, phone: p.phone, whatsapp: p.whatsapp, hide_phone: p.hide_phone })}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted flex items-center gap-2 ${active?.kind === "dm" && active.id === p.user_id ? "bg-muted font-semibold" : ""}`}>
                        <div className="relative flex-shrink-0">
                          {p.avatar_url ? <img src={p.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" /> : <div className="w-7 h-7 rounded-full bg-muted grid place-items-center text-[11px]">{(p.display_name || "A")[0]}</div>}
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${isOnline ? "bg-green-500" : "bg-red-400"}`} aria-label={isOnline ? "Online" : "Offline"} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate">{p.display_name || "Alumnus"}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{isOnline ? "Online" : formatLastSeen(p.last_seen_at)}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* Conversation */}
          <div className={`rounded-2xl bg-card border border-border/60 flex flex-col overflow-hidden animate-fade-up ${!active ? "hidden md:flex" : "flex"}`}>
            {active ? (
              <>
                <div className="px-4 py-3 border-b border-border/60 font-semibold flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden -ml-2 h-8 w-8" onClick={() => setActive(null)}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{active.label}</span>
                      {active.kind === "dm" && (() => {
                        const isOnline = online.has(active.id);
                        return <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-400"}`} />;
                      })()}
                    </div>
                  </div>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 relative">
                  {hasMore && (
                    <div className="flex justify-center mb-4">
                      <Button variant="outline" size="sm" onClick={loadMoreMessages} disabled={loadingMore} className="text-xs">
                        {loadingMore ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : null}
                        Load older messages
                      </Button>
                    </div>
                  )}
                  {messages.map((m) => {
                    const mine = m.sender_id === user?.id;
                    const sender = profilesById[m.sender_id];
                    return (
                      <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : ""}`}>
                        {!mine && (sender?.avatar_url ? <img src={sender.avatar_url} className="w-7 h-7 rounded-full object-cover flex-shrink-0" alt="" /> : <div className="w-7 h-7 rounded-full bg-muted grid place-items-center text-[10px] flex-shrink-0">{(sender?.display_name || "A")[0]}</div>)}
                        <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-3 py-2 text-sm relative group ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          {!mine && <div className="text-[11px] font-semibold opacity-70 mb-0.5">{sender?.display_name || "Alumnus"}</div>}
                          
                          {m.file_url && (
                            <div className="mb-2 rounded-xl overflow-hidden border border-border/20 bg-black/5 shadow-sm">
                              {m.file_type === 'image' ? (
                                <img src={m.file_url} alt="" className="max-w-full h-auto min-h-[100px] min-w-[150px] object-cover md:object-contain cursor-pointer hover:opacity-95 transition-opacity" onClick={() => window.open(m.file_url!, '_blank')} />
                              ) : m.file_type === 'video' ? (
                                <video src={m.file_url} controls className="max-w-full h-auto" />
                              ) : (
                                <a href={m.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 hover:bg-black/5 transition-colors">
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary grid place-items-center flex-shrink-0">
                                    <Paperclip className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-xs font-semibold truncate">Attachment</div>
                                    <div className="text-[10px] opacity-60 truncate">Click to download</div>
                                  </div>
                                </a>
                              )}
                            </div>
                          )}

                          {editingId === m.id ? (
                            <div className="space-y-2">
                              <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-[60px] text-sm bg-background text-foreground" />
                              <div className="flex justify-end gap-2">
                                <Button size="xs" variant="ghost" onClick={() => setEditingId(null)}><X className="w-3 h-3 mr-1" /> Cancel</Button>
                                <Button size="xs" variant="hero" onClick={saveEdit}><Check className="w-3 h-3 mr-1" /> Save</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="whitespace-pre-wrap break-words">{m.content}</div>
                              <div className="flex items-center justify-between gap-4 mt-1">
                                <div className="text-[10px] opacity-60">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                                {(mine || isAdmin) && (
                                <div className="flex items-center gap-2 transition-opacity">
                                    {mine && (
                                      <button onClick={() => startEdit(m)} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Edit message">
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button onClick={() => deleteMessage(m.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1" title="Delete message">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && <p className="text-center text-muted-foreground text-sm py-10">No messages yet — say hello.</p>}
                </div>
                <div className="border-t border-border/60 p-3 flex gap-2 items-center">
                  <div className="relative">
                    <input type="file" className="hidden" id="chat-file" accept="image/*,video/*,.pdf,.doc,.docx" onChange={handleUpload} disabled={uploading} />
                    <Button variant="ghost" size="icon" asChild disabled={uploading} className="rounded-full h-10 w-10 shrink-0" title="Upload media or file">
                      <label htmlFor="chat-file" className="cursor-pointer">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Plus className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />}
                      </label>
                    </Button>
                  </div>
                  <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Write a message..." aria-label="Message" />
                  <Button onClick={() => send()} disabled={(!text.trim() && !uploading)} aria-label="Send"><Send className="w-4 h-4" /></Button>
                </div>
              </>
            ) : (
              <div className="flex-1 grid place-items-center text-center text-muted-foreground p-6">
                <div><MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>Pick a channel or start a direct message.</p></div>
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
};

export default ChatPage;
