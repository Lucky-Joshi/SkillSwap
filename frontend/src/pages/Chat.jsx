import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiSend, FiMessageSquare, FiArrowLeft, FiCheck, FiCheckSquare, FiPlus, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../components/ui/Avatar';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Tag from '../components/ui/Tag';
import { getConversations, getMessages } from '../services/chat';
import { getUser, searchUsers } from '../services/users';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useDocumentTitle, useDebounce } from '../hooks';
import { timeAgo } from '../utils/helpers';

export default function Chat() {
  useDocumentTitle('Chat');
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingFrom, setTypingFrom] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [peopleQuery, setPeopleQuery] = useState('');
  const [people, setPeople] = useState([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const debouncedPeople = useDebounce(peopleQuery, 300);

  const loadConversations = useCallback(async () => {
    try {
      const res = await getConversations();
      setConversations(res.conversations || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Open a thread straight from /chat?user=<id> (e.g. a profile "Message" button)
  useEffect(() => {
    const initial = searchParams.get('user');
    if (initial) {
      setActiveId(initial);
      setNewChatOpen(false);
    }
  }, [searchParams]);

  // Resolve the other person even before any message exists
  useEffect(() => {
    if (!activeId) {
      setActiveUser(null);
      return;
    }
    let cancelled = false;
    setActiveUser(null);
    getUser(activeId)
      .then((res) => {
        if (!cancelled) setActiveUser(res.user);
      })
      .catch(() => {
        if (!cancelled) setActiveUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  // People search for starting a new conversation
  useEffect(() => {
    if (!newChatOpen || !debouncedPeople.trim()) {
      setPeople([]);
      setPeopleLoading(false);
      return;
    }
    let cancelled = false;
    setPeopleLoading(true);
    searchUsers({ search: debouncedPeople, limit: 8 })
      .then((res) => {
        if (!cancelled) setPeople(res.users || []);
      })
      .catch(() => {
        if (!cancelled) setPeople([]);
      })
      .finally(() => {
        if (!cancelled) setPeopleLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [newChatOpen, debouncedPeople]);

  const active = conversations.find((c) => c.userId === activeId);

  const loadThread = useCallback(
    async (otherId) => {
      const res = await getMessages(otherId, { limit: 100 });
      setMessages(res.data || []);
      socket?.emit('messages:read', { from: otherId });
      loadConversations();
    },
    [socket, loadConversations]
  );

  useEffect(() => {
    if (activeId) loadThread(activeId);
  }, [activeId, loadThread]);

  // Real-time incoming messages
  useEffect(() => {
    if (!socket) return undefined;
    const onNew = (msg) => {
      if (String(msg.sender) === activeId) {
        setMessages((prev) => [...prev, msg]);
        socket.emit('messages:read', { from: activeId });
      } else {
        loadConversations();
      }
    };
    const onSent = (msg) => {
      setMessages((prev) => [...prev, msg]);
      loadConversations();
    };
    const onTyping = ({ from }) => {
      if (from === activeId) {
        setTypingFrom(true);
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTypingFrom(false), 1600);
      }
    };
    socket.on('message:new', onNew);
    socket.on('message:sent', onSent);
    socket.on('typing', onTyping);
    return () => {
      socket.off('message:new', onNew);
      socket.off('message:sent', onSent);
      socket.off('typing', onTyping);
    };
  }, [socket, activeId, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeId]);

  const startChat = (person) => {
    setActiveId(person.id);
    setNewChatOpen(false);
    setPeopleQuery('');
    setPeople([]);
    navigate(`/chat?user=${person.id}`, { replace: true });
  };

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setSending(true);
    if (socket?.connected) {
      socket.emit('message:send', { receiver: activeId, message: text }, (ack) => {
        setSending(false);
        if (!ack?.success) {
          toast.error(ack?.error || 'Failed to send');
          sendViaRest(text);
        }
      });
    } else {
      await sendViaRest(text);
      setSending(false);
    }
    setInput('');
  };

  const sendViaRest = async (text) => {
    try {
      const res = await (await import('../services/chat')).sendMessage({ receiver: activeId, message: text });
      setMessages((prev) => [...prev, res.message]);
      loadConversations();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const emitTyping = (value) => {
    if (!socket?.connected || !activeId) return;
    socket.emit(value ? 'typing' : 'typing:stop', { receiver: activeId });
  };

  const otherName = activeUser?.name || active?.user?.name;

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[480px] flex-col gap-4 lg:h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Chat</h1>
        {connected ? <Tag tone="green" icon="🟢">Live</Tag> : <Tag tone="slate">Connecting…</Tag>}
      </div>

      <div className="glass flex min-h-0 flex-1 overflow-hidden rounded-2xl">
        {/* Conversation list */}
        <aside className={`w-full shrink-0 overflow-y-auto border-r border-slate-200/60 dark:border-white/10 sm:w-72 ${activeId ? 'hidden sm:block' : 'block'}`}>
          <div className="border-b border-slate-200/60 p-3 dark:border-white/10">
            <button
              onClick={() => setNewChatOpen((v) => !v)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-400/60 px-3 py-2 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10"
            >
              <FiPlus className="h-4 w-4" /> New chat
            </button>
            <AnimatePresence>
              {newChatOpen && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="relative mt-3">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={peopleQuery}
                      onChange={(e) => setPeopleQuery(e.target.value)}
                      placeholder="Find mentors or students…"
                      autoFocus
                      className="input pl-10"
                    />
                  </div>
                  <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
                    {peopleLoading && <p className="px-3 py-2 text-xs text-slate-400">Searching…</p>}
                    {!peopleLoading && debouncedPeople.trim() && people.length === 0 && (
                      <p className="px-3 py-2 text-xs text-slate-400">No one found. Try a name or skill.</p>
                    )}
                    {people.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => startChat(p)}
                        className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Avatar src={p.avatar} name={p.name} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{p.name}</div>
                          <div className="truncate text-xs text-slate-400">
                            {p.department || ''}{p.department && ' · '}{p.college || ''}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4">
              <EmptyState icon="💬" title="No conversations yet" description="Use “New chat” to message a mentor or student directly." />
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = c.userId === activeId;
              return (
                <button
                  key={c.userId}
                  onClick={() => { setActiveId(c.userId); setMessages([]); navigate(`/chat?user=${c.userId}`, { replace: true }); }}
                  className={`flex w-full items-center gap-3 border-b border-slate-200/40 p-4 text-left transition hover:bg-slate-50 dark:border-white/5 dark:hover:bg-slate-800/50 ${isActive ? 'bg-brand-500/5 dark:bg-brand-500/10' : ''}`}
                >
                  <Avatar src={c.user?.avatar} name={c.user?.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{c.user?.name}</span>
                      <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(c.lastMessageAt)}</span>
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      {c.lastMessageByMe && <span className="text-slate-400">You: </span>}
                      {c.lastMessage}
                    </div>
                  </div>
                  {c.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </aside>

        {/* Thread */}
        <main className="relative flex min-w-0 flex-1 flex-col">
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyState icon="🗨️" title="Pick a conversation" description="Choose a chat from the list, or use “New chat” to message anyone." />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-slate-200/60 px-4 py-3 dark:border-white/10">
                <button className="sm:hidden" onClick={() => setActiveId(null)}><FiArrowLeft /></button>
                <Avatar src={activeUser?.avatar || active?.user?.avatar} name={otherName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{otherName || 'Loading…'}</div>
                  <div className="text-[11px] text-slate-400">
                    {activeUser?.department} {activeUser?.year && `· Year ${activeUser.year}`} {activeUser?.college && `· ${activeUser.college}`}
                  </div>
                </div>
                {activeUser?.isTest && <Tag tone="amber">Test account</Tag>}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <EmptyState
                      icon="👋"
                      title={`Say hi to ${(otherName || 'them').split(' ')[0]}!`}
                      description="This is the start of your conversation. Drop a message below."
                    />
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const mine = String(m.sender) === String(user.id);
                    const prev = messages[i - 1];
                    const showAvatar = !mine && String(m.sender) !== String(prev?.sender);
                    return (
                      <motion.div
                        key={m._id || `${m.sender}-${m.createdAt}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}
                      >
                        {!mine && <Avatar src={activeUser?.avatar || active?.user?.avatar} name={otherName} size="xs" className={showAvatar ? '' : 'opacity-0'} />}
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${mine
                          ? 'rounded-br-md bg-gradient-to-r from-brand-600 to-brand-500 text-white'
                          : 'rounded-bl-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}>
                          {m.message}
                          <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-white/70' : 'text-slate-400'}`}>
                            {timeAgo(m.createdAt)}
                            {mine && (m.read ? <FiCheckSquare className="h-3 w-3" /> : <FiCheck className="h-3 w-3" />)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
                {typingFrom && (
                  <div className="flex items-center gap-2 pl-1 text-xs text-slate-400">
                    <span className="flex gap-1">
                      {[0, 1, 2].map((i) => <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }} className="h-1.5 w-1.5 rounded-full bg-slate-400" />)}
                    </span>
                    {otherName?.split(' ')[0]} is typing…
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={send} className="border-t border-slate-200/60 p-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => { setInput(e.target.value); emitTyping(e.target.value.length > 0); }}
                    onBlur={() => emitTyping(false)}
                    placeholder="Type a message…"
                    className="input"
                    disabled={!activeId}
                  />
                  <button type="submit" disabled={!input.trim() || sending} className="btn-primary !px-4">
                    <FiSend className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
