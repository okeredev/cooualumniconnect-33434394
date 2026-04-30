import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Hash, Loader2, MessageCircle, Send, Users } from "lucide-react";
import { toast } from "sonner";

type Channel = { id: string; name: string; description: string | null };
type Message = { id: string; sender_id: string; channel_id: string | null; recipient_id: string | null; content: string; created_at: string };
type ProfileMini = { user_id: string; display_name: string | null; avatar_url: string | null };

type ActiveTarget = { kind: "channel"; id: string; label: string } | { kind: "dm"; id: string; label: string };

const ChatPage = () => {
  const { user } = useAuth();
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.title = "Chat — COOU Alumni Connect"; init(); }, [user]);

  const init = async () => {
    if (!user) return;
    setLoading(true);
    const [ch, mb, pr] = await Promise.all([
      supabase.from("chat_channels").select("*").order("name"),
      supabase.from("chat_channel_members").select("channel_id").eq("user_id", user.id),
      supabase.from("profiles").select("user_id, display_name, avatar_url").neq("user_id", user.id).limit(100),
    ]);
    setChannels((ch.data ?? []) as Channel[]);
    setMembers(new Set(((mb.data ?? []) as any[]).map((m) => m.channel_id)));
    const ps = (pr.data ?? []) as ProfileMini[];
    setPeople(ps);
    const map: Record<string, ProfileMini> = {};
    ps.forEach((p) => { map[p.user_id] = p; });
    setProfilesById(map);
    setLoading(false);
  };

  useEffect(() => {
    if (!active || !user) return;
    let cancelled = false;
    (async () => {
      const q = supabase.from("chat_messages").select("*").order("created_at", { ascending: true }).limit(200);
      const { data } = active.kind === "channel"
        ? await q.eq("channel_id", active.id)
        : await q.is("channel_id", null).or(`and(sender_id.eq.${user.id},recipient_id.eq.${active.id}),and(sender_id.eq.${active.id},recipient_id.eq.${user.id})`);
      if (!cancelled) setMessages((data ?? []) as Message[]);
    })();

    const channel = supabase.channel(`chat-${active.kind}-${active.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.new as Message;
        const isMatch = active.kind === "channel"
          ? m.channel_id === active.id
          : m.channel_id === null && ((m.sender_id === user.id && m.recipient_id === active.id) || (m.sender_id === active.id && m.recipient_id === user.id));
        if (isMatch) setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [active, user]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  const join = async (c: Channel) => {
    if (!user) return;
    if (!members.has(c.id)) {
      const { error } = await supabase.from("chat_channel_members").insert({ channel_id: c.id, user_id: user.id });
      if (error) return toast.error(error.message);
      setMembers((s) => new Set(s).add(c.id));
    }
    setActive({ kind: "channel", id: c.id, label: `#${c.name}` });
  };

  const send = async () => {
    if (!user || !active || !text.trim()) return;
    const payload: any = { sender_id: user.id, content: text.trim().slice(0, 2000) };
    if (active.kind === "channel") payload.channel_id = active.id; else payload.recipient_id = active.id;
    setText("");
    const { error } = await supabase.from("chat_messages").insert(payload);
    if (error) toast.error(error.message);
  };

  const filteredPeople = people.filter((p) => !search || (p.display_name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell>
      <section className="container py-6">
        <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-180px)] min-h-[500px]">
          {/* Sidebar */}
          <aside className="rounded-2xl bg-card border border-border/60 flex flex-col overflow-hidden">
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
                  {filteredPeople.map((p) => (
                    <button key={p.user_id} onClick={() => setActive({ kind: "dm", id: p.user_id, label: p.display_name || "Alumnus" })}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted flex items-center gap-2 ${active?.kind === "dm" && active.id === p.user_id ? "bg-muted font-semibold" : ""}`}>
                      {p.avatar_url ? <img src={p.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" /> : <div className="w-6 h-6 rounded-full bg-muted grid place-items-center text-[10px]">{(p.display_name || "A")[0]}</div>}
                      <span className="truncate">{p.display_name || "Alumnus"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Conversation */}
          <div className="rounded-2xl bg-card border border-border/60 flex flex-col overflow-hidden">
            {active ? (
              <>
                <div className="px-5 py-3 border-b border-border/60 font-semibold">{active.label}</div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.map((m) => {
                    const mine = m.sender_id === user?.id;
                    const sender = profilesById[m.sender_id];
                    return (
                      <div key={m.id} className={`flex gap-2 ${mine ? "justify-end" : ""}`}>
                        {!mine && (sender?.avatar_url ? <img src={sender.avatar_url} className="w-7 h-7 rounded-full object-cover flex-shrink-0" alt="" /> : <div className="w-7 h-7 rounded-full bg-muted grid place-items-center text-[10px] flex-shrink-0">{(sender?.display_name || "A")[0]}</div>)}
                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          {!mine && <div className="text-[11px] font-semibold opacity-70 mb-0.5">{sender?.display_name || "Alumnus"}</div>}
                          <div className="whitespace-pre-wrap break-words">{m.content}</div>
                          <div className="text-[10px] opacity-60 mt-1">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && <p className="text-center text-muted-foreground text-sm py-10">No messages yet — say hello.</p>}
                </div>
                <div className="border-t border-border/60 p-3 flex gap-2">
                  <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Write a message..." aria-label="Message" />
                  <Button onClick={send} disabled={!text.trim()} aria-label="Send"><Send className="w-4 h-4" /></Button>
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
