import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiSend, FiArrowLeft, FiCheck, FiCheckSquare, FiLock, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import Tag from '../../components/ui/Tag';
import Button from '../../components/ui/Button';
import { getConversations, getMessages, sendMessage } from '../../services/chat';
import { getUser } from '../../services/users';
import { useSocket } from '../../context/SocketContext';
import { useDocumentTitle } from '../../hooks';
import { timeAgo } from '../../utils/helpers';

export default function Chat() {
  useDocumentTitle('Chat');
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [locked, setLocked] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingFrom, setTypingFrom] = useState(false);
  const [onlineMap, setOnlineMap] = useState({});
  const [convSearch, setConvSearch] = useState('');
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

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

  // Open a thread straight from /chat?user=<id> (mentor/learner/profile buttons)
  useEffect(() => {
    const initial = searchParams.get('user');
    if (initial) setActiveId(initial);
  }, [searchParams]);

  // Resolve the other person and whether chat is allowed.
  useEffect(() => {
    if (!activeId) {
      setActiveUser(null);
      setLocked(false);
      return;
    }
    let cancelled = false;
    setActiveUser(null);
    setLocked(false);
    getUser(activeId)
      .then((res) => {
        if (cancelled) return;
        setActiveUser(res.user);
        setLocked(!res.user?.relationship || !res.user.relationship.active);
      })
      .catch(() => {
        if (!cancelled) { setActiveUser(null); setLocked(true); }
      });
    return () => { cancelled = true; };
  }, [activeId]);

  const active = conversations.find((c) => c.userId === activeId);

  const filteredConversations = convSearch.trim()
    ? conversations.filter((c) =>
        (c.user?.name || '').toLowerCase().includes(convSearch.toLowerCase()) ||
        (c.lastMessage || '').toLowerCase().includes(convSearch.toLowerCase())
      )
    : conversations;

  const loadThread = useCallback(
    async (otherId) => {
      try {
        const res = await getMessages(otherId, { limit: 100 });
        setMessages(res.data || []);
        socket?.emit('messages:read', { from: otherId });
      } catch (err) {
        if (err.status === 403 || String(err.message).toLowerCase().includes('accepted')) {
          setLocked(true);
        }
        setMessages([]);
      }
      loadConversations();
    },
    [socket, loadConversations]
  );

  useEffect(() => {
    if (activeId) loadThread(activeId);
  }, [activeId, loadThread]);

  // Real-time incoming messages + presence
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
    const onOnline = ({ userId }) => setOnlineMap((m) => ({ ...m, [userId]: true }));
    const onOffline = ({ userId }) => setOnlineMap((m) => ({ ...m, [userId]: false }));
    socket.on('message:new', onNew);
    socket.on('message:sent', onSent);
    socket.on('typing', onTyping);
    socket.on('user:online', onOnline);
    socket.on('user:offline', onOffline);
    return () => {
      socket.off('message:new', onNew);
      socket.off('message:sent', onSent);
      socket.off('typing', onTyping);
      socket.off('user:online', onOnline);
      socket.off('user:offline', onOffline);
    };
  }, [socket, activeId, loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeId]);

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
      const res = await sendMessage({ receiver: activeId, message: text });
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
  const otherOnline = activeId
    ? (onlineMap[activeId] ?? active?.online ?? false)
    : false;

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[480px] flex-col gap-4 lg:h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-extrabold sm:text-3xl">Chat</h1>
        {connected ? <Tag tone="green" icon="🟢">Live</Tag> : <Tag tone="slate">Connecting…</Tag>}
      </div>

      <div className="glass flex min-h-0 flex-1 overflow-hidden rounded-2xl">
        {/* Conversation list — only active mentorship/peer relationships */}
        <aside className={`w-full shrink-0 overflow-y-auto border-r border-slate-200/60 dark:border-white/10 sm:w-72 ${activeId ? 'hidden sm:block' : 'block'}`}>
          <div className="border-b border-slate-200/60 p-3 dark:border-white/10">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={convSearch} onChange={(e) => setConvSearch(e.target.value)} placeholder="Search conversations…" className="input !py-1.5 pl-8 text-xs" />
            </div>
            <p className="mt-1.5 px-1 text-[10px] text-slate-400">
              Chat unlocks when a mentorship request is accepted.
            </p>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4">
              <EmptyState
                icon={convSearch ? '🔍' : '🤝'}
                title={convSearch ? 'No conversations match' : 'No conversations yet'}
                description={convSearch ? 'Try a different search term.' : 'Chat unlocks when a mentorship request is accepted. Find a mentor to get started.'}
                action={!convSearch && <Button size="sm" onClick={() => navigate('/app/recommendations')}>Find a mentor</Button>}
              />
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = c.userId === activeId;
              const online = onlineMap[c.userId] ?? c.online ?? false;
              return (
                <button
                  key={c.userId}
                  onClick={() => { setActiveId(c.userId); setMessages([]); navigate(`/app/chat?user=${c.userId}`, { replace: true }); }}
                  className={`flex w-full items-center gap-3 border-b border-slate-200/40 p-4 text-left transition hover:bg-slate-50 dark:border-white/5 dark:hover:bg-slate-800/50 ${isActive ? 'bg-brand-500/5 dark:bg-brand-500/10' : ''}`}
                >
                  <div className="relative shrink-0">
                    <Avatar src={c.user?.avatar} name={c.user?.name} size="sm" />
                    {online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />}
                  </div>
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
              <EmptyState
                icon="🗨️"
                title="Pick a conversation"
                description="Only accepted mentors and learners appear here."
              />
            </div>
          ) : locked ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                  <FiLock className="h-8 w-8 text-slate-400" />
                </div>
                {activeUser && (
                  <div className="absolute -bottom-1 -right-1">
                    <Avatar src={activeUser.avatar} name={activeUser.name} size="sm" ring />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-display text-lg font-bold">Chat is locked</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Chat will become available once your mentorship request is accepted.
                  You need an active mentorship relationship to send messages.
                </p>
              </div>
              {activeUser && (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200/60 px-4 py-3 dark:border-white/10">
                  <Avatar src={activeUser.avatar} name={activeUser.name} size="sm" />
                  <div className="text-left">
                    <div className="text-sm font-semibold">{activeUser.name}</div>
                    <div className="text-xs text-slate-400">{activeUser.department}{activeUser.department && activeUser.year && ' · '}{activeUser.year && `Year ${activeUser.year}`}</div>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => navigate('/app/recommendations')}>Find a mentor</Button>
                <Button size="sm" variant="ghost" onClick={() => navigate('/app/sessions')}>View sessions</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-slate-200/60 px-4 py-3 dark:border-white/10">
                <button className="sm:hidden" onClick={() => setActiveId(null)}><FiArrowLeft /></button>
                <div className="relative">
                  <Avatar src={activeUser?.avatar || active?.user?.avatar} name={otherName} size="sm" />
                  {otherOnline && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{otherName || 'Loading…'}</div>
                  <div className="text-[11px] text-slate-400">
                    {otherOnline ? <span className="text-emerald-500">Online</span> : 'Offline'}
                    {activeUser?.department && ` · ${activeUser.department}`}
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
                    const isMine = String(m.sender) !== String(activeId);
                    const prev = messages[i - 1];
                    const showAvatar = isMine && String(m.sender) !== String(prev?.sender);
                    return (
                      <motion.div
                        key={m._id || `${m.sender}-${m.createdAt}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMine && <Avatar src={activeUser?.avatar || active?.user?.avatar} name={otherName} size="xs" className={showAvatar ? '' : 'opacity-0'} />}
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isMine
                          ? 'rounded-br-md bg-gradient-to-r from-brand-600 to-brand-500 text-white'
                          : 'rounded-bl-md bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}>
                          {m.message}
                          <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMine ? 'text-white/70' : 'text-slate-400'}`}>
                            {timeAgo(m.createdAt)}
                            {isMine && (m.read ? <FiCheckSquare className="h-3 w-3" /> : <FiCheck className="h-3 w-3" />)}
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
