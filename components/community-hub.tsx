'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, Check, Download, Flag, Globe2, Heart, LoaderCircle, LockKeyhole, LogOut, MessageCircle, Paperclip, Plus, RefreshCw, Search, Send, ShieldCheck, Sparkles, Trash2, UserRound, UserRoundPlus, Users, X } from 'lucide-react';
import type { CommunityMessage, CommunityPerson, CommunityRoom, Member } from '../lib/community/types';
import { communityRequest as api } from '../lib/community/client';
import s from './community.module.css';

type PeopleResponse = { people: CommunityPerson[]; blocked: { id: string; displayName: string }[] };
type RoomsResponse = { rooms: CommunityRoom[]; discover: CommunityRoom[] };
type FileDraft = { name: string; mime: string; data: string };
type Pane = 'chat' | 'people' | 'profile';
const reactions = ['❤️','👏','✨','👍','😂'];
const errorText = (error: unknown) => error instanceof Error ? error.message : 'عملیات انجام نشد. دوباره تلاش کنید.';
const number = (value: number) => value.toLocaleString('fa-IR');
const formatTime = (value: string) => new Date(value).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
const avatar = (name: string) => name.trim().slice(0,1) || 'ر';

export default function CommunityHub() {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pane, setPane] = useState<Pane>('chat');
  const [register, setRegister] = useState(false);
  const [rooms, setRooms] = useState<CommunityRoom[]>([]);
  const [discover, setDiscover] = useState<CommunityRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('public-lobby');
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [people, setPeople] = useState<CommunityPerson[]>([]);
  const [blocked, setBlocked] = useState<PeopleResponse['blocked']>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [peopleFilter, setPeopleFilter] = useState<'all'|'friends'|'requests'|'following'>('all');
  const [groupName, setGroupName] = useState('');
  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState<FileDraft | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [report, setReport] = useState<{ messageId?: string; memberId?: string; label: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [inviteMember, setInviteMember] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const reportDialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const messageList = useRef<HTMLDivElement>(null);
  const identity = useRef<string | null>(null);
  const currentRoom = useRef(selectedRoom);
  const requestSequence = useRef(0);

  const setSession = useCallback((user: Member | null, broadcast = false) => {
    if (identity.current !== user?.id) {
      identity.current = user?.id || null;
      requestSequence.current += 1;
      setMessages([]); setRooms([]); setDiscover([]); setPeople([]); setBlocked([]);
      setBody(''); setAttachment(null); setSelectedRoom('public-lobby'); setReport(null);
    }
    setMember(user); setProfileName(user?.displayName || ''); setProfileBio(user?.bio || '');
    if (broadcast) window.dispatchEvent(new CustomEvent('roshana:session', { detail: { user } }));
  }, []);

  const loadSession = useCallback(async () => {
    setLoading(true); setError('');
    try { const result = await api<{ user: Member | null }>('session'); setSession(result.user); }
    catch (reason) { setError(errorText(reason)); }
    finally { setLoading(false); }
  }, [setSession]);

  useEffect(() => {
    void loadSession();
    const sessionChanged = (event: Event) => { const detail = (event as CustomEvent<{ user: Member | null }>).detail; if (detail && 'user' in detail) setSession(detail.user); else void loadSession(); };
    window.addEventListener('roshana:session', sessionChanged);
    return () => { window.removeEventListener('roshana:session', sessionChanged); identity.current = null; requestSequence.current += 1; };
  }, [loadSession, setSession]);

  const refreshRooms = useCallback(async () => {
    const owner = identity.current; if (!owner) return;
    const result = await api<RoomsResponse>('rooms');
    if (identity.current !== owner) return;
    setRooms(result.rooms); setDiscover(result.discover);
  }, []);

  const refreshPeople = useCallback(async () => {
    const owner = identity.current; if (!owner) return;
    const result = await api<PeopleResponse>(`people?q=${encodeURIComponent(query)}`);
    if (identity.current !== owner) return;
    setPeople(result.people); setBlocked(result.blocked);
  }, [query]);

  const refreshMessages = useCallback(async (roomId = currentRoom.current) => {
    const owner = identity.current; if (!owner) return;
    const sequence = ++requestSequence.current;
    const result = await api<{ messages: CommunityMessage[] }>(`messages?room=${encodeURIComponent(roomId)}`);
    if (identity.current !== owner || currentRoom.current !== roomId || sequence !== requestSequence.current) return;
    const nearBottom = !messageList.current || messageList.current.scrollHeight - messageList.current.scrollTop - messageList.current.clientHeight < 120;
    setMessages(result.messages);
    if (nearBottom) requestAnimationFrame(() => { if (messageList.current) messageList.current.scrollTop = messageList.current.scrollHeight; });
  }, []);

  useEffect(() => {
    if (!member) return;
    let active = true;
    const refresh = () => { if (document.hidden) return; void refreshRooms().catch(reason => { if (active) setError(errorText(reason)); }); };
    refresh(); const interval = window.setInterval(refresh, 20_000);
    window.addEventListener('focus', refresh);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [member?.id, refreshRooms]);

  useEffect(() => {
    currentRoom.current = selectedRoom; requestSequence.current += 1; setMessages([]); setAttachment(null); setBody('');
    if (!member || pane !== 'chat') return;
    let active = true; setMessagesLoading(true);
    const refresh = () => { if (document.hidden) return; void refreshMessages(selectedRoom).catch(reason => { if (active) { setMessages([]); setError(errorText(reason)); } }).finally(() => { if (active) setMessagesLoading(false); }); };
    refresh(); const interval = window.setInterval(refresh, 8_000);
    window.addEventListener('focus', refresh);
    return () => { active = false; requestSequence.current += 1; window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [member?.id, selectedRoom, pane, refreshMessages]);

  useEffect(() => {
    if (!member || pane === 'chat') return;
    let active = true; setPeopleLoading(true);
    const timer = window.setTimeout(() => { void refreshPeople().catch(reason => { if (active) setError(errorText(reason)); }).finally(() => { if (active) setPeopleLoading(false); }); }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [member?.id, pane, refreshPeople]);

  useEffect(() => { if (report && reportDialog.current && !reportDialog.current.open) reportDialog.current.showModal(); else if (!report) reportDialog.current?.close(); }, [report]);

  async function perform(action: () => Promise<void>) {
    if (busy) return; setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (reason) { setError(errorText(reason)); } finally { setBusy(false); }
  }
  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const fields = new FormData(event.currentTarget);
    void perform(async () => {
      const result = await api<{ user: Member }>('session', { action: register ? 'register' : 'login', username: fields.get('username'), password: fields.get('password'), ...(register ? { displayName: fields.get('displayName'), accepted: fields.get('accepted') === 'on' } : {}) });
      setSession(result.user, true); setNotice(register ? 'حساب شما ساخته شد. به جمع روشنا خوش آمدید.' : 'خوش آمدید.');
    });
  }
  function logout() { void perform(async () => { await api('session', { action: 'logout' }); setSession(null, true); setNotice('از حساب خارج شدید.'); }); }
  function relation(action: string, memberId: string) { void perform(async () => { await api('relations', { action, memberId }); await Promise.all([refreshPeople(), refreshRooms()]); setNotice(action === 'block' ? 'حساب مسدود شد؛ پیام‌ها و تعاملات دوطرفه مخفی شدند.' : 'تغییر ذخیره شد.'); }); }
  function openDM(memberId: string) { void perform(async () => { const result = await api<{ roomId: string }>('rooms', { action: 'dm', memberId }); await refreshRooms(); setSelectedRoom(result.roomId); setPane('chat'); }); }
  function roomAction(action: 'join'|'leave', roomId: string) { void perform(async () => { const result = await api<{ roomId?: string }>('rooms', { action, roomId }); await refreshRooms(); setSelectedRoom(result.roomId || 'public-lobby'); setPane('chat'); }); }
  function createGroup(event: FormEvent) { event.preventDefault(); void perform(async () => { const result = await api<{ roomId: string }>('rooms', { action: 'create', name: groupName }); setGroupName(''); await refreshRooms(); setSelectedRoom(result.roomId); }); }
  function sendMessage(event: FormEvent) {
    event.preventDefault(); const targetRoom = selectedRoom;
    void perform(async () => { await api('messages', { action: 'send', roomId: targetRoom, body, ...(attachment ? { attachment } : {}) }); if (currentRoom.current === targetRoom) { setBody(''); setAttachment(null); await refreshMessages(targetRoom); } await refreshRooms(); });
  }
  async function selectFile(file: File | undefined) {
    if (!file) return; setError('');
    if (!['image/png','image/jpeg','image/webp','application/pdf','text/plain'].includes(file.type) || !file.size || file.size > 1_048_576) { setError('فقط PNG، JPEG، WebP، PDF و متن ساده تا ۱ مگابایت قابل ارسال است.'); return; }
    const owner = identity.current; const room = selectedRoom; setFileLoading(true);
    try {
      const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(new Error('خواندن فایل ممکن نشد.')); reader.readAsDataURL(file); });
      if (identity.current === owner && currentRoom.current === room) setAttachment({ name: file.name, mime: file.type, data });
    } catch (reason) { setError(errorText(reason)); } finally { setFileLoading(false); if (fileInput.current) fileInput.current.value = ''; }
  }
  function react(messageId: string, emoji: string) { void perform(async () => { await api('messages', { action: 'react', messageId, emoji }); await refreshMessages(); }); }
  function deleteMessage(messageId: string) { if (window.confirm('این پیام و فایل پیوست آن حذف شود؟')) void perform(async () => { await api('messages', { action: 'delete', messageId }); await refreshMessages(); }); }
  function submitReport(event: FormEvent) {
    event.preventDefault(); if (!report) return;
    void perform(async () => { await api('reports', { ...(report.messageId ? { messageId: report.messageId } : { memberId: report.memberId }), reason: reportReason }); setReport(null); setReportReason(''); setNotice('گزارش برای بررسی مدیر ثبت شد.'); });
  }

  const room = rooms.find(item => item.id === selectedRoom);
  const filteredPeople = people.filter(person => peopleFilter === 'all' || (peopleFilter === 'friends' && person.friendship === 'accepted') || (peopleFilter === 'requests' && ['received','sent'].includes(person.friendship)) || (peopleFilter === 'following' && person.following));
  const friends = people.filter(person => person.friendship === 'accepted');

  return <section className={s.hub} aria-label="گفتگو و اجتماع روشنا">
    <header className={s.hero}>
      <div><span className={s.eyebrow}><Sparkles size={15}/> آدم‌ها، ایده‌ها، مسیرهای مشترک</span><h1>گفتگو، شروعِ یک ارتباط خوب.</h1><p>برای تجربه‌های واقعی، همراه‌های تازه و یک جمع محترمانه.</p></div>
      <div className={s.heroArt} aria-hidden="true"><div><MessageCircle size={44}/></div><i><Heart size={22}/></i><b><Users size={24}/></b><span/></div>
    </header>
    {error && <div className={s.error} role="alert"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="بستن پیام خطا"><X size={17}/></button></div>}
    {notice && <div className={s.notice} role="status"><Check size={17}/><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="بستن پیام"><X size={16}/></button></div>}
    {loading ? <div className={s.skeleton} aria-busy="true" aria-label="در حال دریافت حساب"><div/><div/><div/></div> : !member ? <div className={s.entry}>
      <div className={s.entryCopy}><span className={s.badge}><ShieldCheck size={15}/> با احترام، کنار هم</span><h2>جایی برای هم‌صحبت شدن،<br/>نه رقابت برای دیده‌شدن.</h2><p>گفتگوی عمومی، گروه‌های باز و چت خصوصی با دوستانت. هر رابطه با انتخاب خودت شروع می‌شود.</p><ul><li><Users size={19}/><span>پروفایل، کشف افراد و درخواست دوستی</span></li><li><LockKeyhole size={19}/><span>پیام خصوصی بعد از پذیرش دوستی</span></li><li><Flag size={19}/><span>گزارش، بلاک و بررسی توسط مدیر</span></li></ul><small>اطلاعات پروفایل و پیام‌ها روی سرور ذخیره می‌شوند. پیام‌های خصوصی رمزگذاری سرتاسری ندارند. دفترچه و برنامه‌های شخصی دستگاهت به این حساب منتقل نمی‌شوند.</small></div>
      <form className={s.auth} onSubmit={signIn}><div className={s.authTabs}><button type="button" aria-pressed={!register} onClick={() => setRegister(false)}>ورود</button><button type="button" aria-pressed={register} onClick={() => setRegister(true)}>ساخت حساب</button></div><h2>{register ? 'یک شروع تازه' : 'خوش برگشتی'}</h2>{register && <label>نام نمایشی<input name="displayName" required minLength={2} maxLength={50} autoComplete="nickname" placeholder="دوست داری چه صدایت کنیم؟"/></label>}<label>نام کاربری<input name="username" required minLength={3} maxLength={24} pattern="[a-zA-Z][a-zA-Z0-9_]*" autoComplete="username" dir="ltr" placeholder="your_username"/></label><label>رمز عبور<input name="password" required minLength={register ? 10 : 1} maxLength={128} type="password" autoComplete={register ? 'new-password' : 'current-password'} placeholder={register ? 'حداقل ۱۰ کاراکتر' : 'رمز عبورت را وارد کن'}/></label>{register && <><label className={s.agreement}><input type="checkbox" name="accepted" required/><span>احترام به دیگران، حریم خصوصی و منع محتوای غیرقانونی و مزاحمت را می‌پذیرم.</span></label><small>نام کاربری با حرف انگلیسی شروع می‌شود. بازیابی خودکار رمز هنوز فعال نیست؛ رمز را در جای امن نگه دار.</small></>}<button className="g-btn primary" type="submit" disabled={busy}>{busy ? <LoaderCircle className={s.spin} size={17}/> : <ArrowLeft size={17}/>} {register ? 'ساخت حساب و ورود' : 'ورود به گفتگو'}</button>{error && <button type="button" className={s.textButton} disabled={busy} onClick={() => void loadSession()}><RefreshCw size={14}/> بررسی دوباره اتصال</button>}</form>
    </div> : <>
      <div className={s.accountBar}><div className={s.identity}><span className={s.avatar}>{avatar(member.displayName)}</span><div><strong>{member.displayName}</strong><small dir="ltr">@{member.username}</small></div><span className={s.level}>سطح {number(member.level)}</span></div><nav aria-label="بخش‌های گفتگو"><button type="button" aria-current={pane === 'chat' ? 'page' : undefined} onClick={() => setPane('chat')}><MessageCircle size={17}/> گفتگوها</button><button type="button" aria-current={pane === 'people' ? 'page' : undefined} onClick={() => setPane('people')}><Users size={17}/> آدم‌ها</button><button type="button" aria-current={pane === 'profile' ? 'page' : undefined} onClick={() => setPane('profile')}><UserRound size={17}/> پروفایل من</button></nav><button type="button" className={s.iconButton} onClick={logout} disabled={busy} title="خروج از حساب" aria-label="خروج از حساب"><LogOut size={18}/></button></div>
      {pane === 'chat' && <div className={s.chatLayout}>
        <aside className={s.roomPanel}><header><h2>گفتگوهای من</h2><span>{number(rooms.length)}</span></header><div className={s.roomList}>{rooms.map(item => <button type="button" key={item.id} className={item.id === selectedRoom ? s.activeRoom : ''} onClick={() => setSelectedRoom(item.id)} aria-pressed={item.id === selectedRoom}><span className={s.roomIcon}>{item.kind === 'public' ? <Globe2 size={19}/> : item.kind === 'dm' ? <LockKeyhole size={18}/> : <Users size={19}/>}</span><span><strong>{item.name}</strong><small>{item.kind === 'public' ? 'فضایی مشترک برای همه' : item.kind === 'dm' ? 'گفتگوی خصوصی' : `${number(item.memberCount)} عضو · گروه باز`}</small></span></button>)}</div><details className={s.roomDetails}><summary><Plus size={16}/> ساخت گروه باز</summary><form onSubmit={createGroup}><label>نام گروه<input value={groupName} onChange={event => setGroupName(event.target.value)} minLength={3} maxLength={60} required placeholder="مثلاً کتاب‌خوان‌های روشنا"/></label><small>گروه در فهرست کشف نمایش داده می‌شود؛ پیام‌ها فقط برای اعضا قابل مشاهده‌اند.</small><button className="g-btn primary" disabled={busy}>ساخت گروه</button></form></details><details className={s.roomDetails}><summary><Search size={16}/> کشف گروه‌ها ({number(discover.length)})</summary>{discover.length ? discover.map(item => <div className={s.discoverItem} key={item.id}><span><strong>{item.name}</strong><small>{number(item.memberCount)} عضو</small></span><button type="button" className={s.textButton} disabled={busy} onClick={() => roomAction('join', item.id)}>پیوستن</button></div>) : <p className={s.hint}>گروه تازه‌ای برای پیوستن وجود ندارد.</p>}</details><div className={s.communityRules}><ShieldCheck size={20}/><p>با مهربانی گفتگو کنیم.<br/>اطلاعات خصوصی دیگران را منتشر نکنیم.</p></div></aside>
        <div className={s.conversation}><header className={s.conversationHeader}><div><h2>{room?.name || 'گفتگو'}</h2><p>{room?.kind === 'dm' ? 'فقط دو عضو گفتگو · بدون رمزگذاری سرتاسری' : 'آخرین ۵۰ پیام · دریافت خودکار هر ۸ ثانیه'}</p></div><div className={s.row}><button className={s.iconButton} type="button" disabled={busy || messagesLoading} aria-label="تازه‌کردن پیام‌ها" onClick={() => void perform(async () => refreshMessages())}><RefreshCw size={17}/></button>{room?.kind === 'group' && room.ownerId !== member.id && <button className={s.textButton} type="button" disabled={busy} onClick={() => roomAction('leave', room.id)}>ترک گروه</button>}</div></header>
          {room?.kind === 'group' && <details className={s.invite}><summary>دعوت یک دوست به گروه</summary><form onSubmit={event => { event.preventDefault(); void perform(async () => { await api('rooms', { action: 'invite', roomId: room.id, memberId: inviteMember }); setInviteMember(''); setNotice('دعوت برای دوستت ارسال شد.'); }); }}><label>شناسه دوست<select value={inviteMember} onChange={event => setInviteMember(event.target.value)} required onFocus={() => void refreshPeople().catch(reason => setError(errorText(reason)))}><option value="">انتخاب دوست</option>{friends.map(friend => <option key={friend.id} value={friend.id}>{friend.displayName}</option>)}</select></label><button className="g-btn" disabled={busy || !inviteMember}>ارسال دعوت</button></form></details>}
          <div className={s.messages} ref={messageList} aria-label="پیام‌های گفتگو" aria-busy={messagesLoading}>{messagesLoading ? <div className={s.messageSkeleton}><i/><i/><i/></div> : messages.length === 0 ? <div className={s.empty}><MessageCircle size={39}/><h3>گفتگوی خوب با یک سلام شروع می‌شود.</h3><p>هنوز پیامی برای نمایش نیست.</p></div> : messages.map(message => <article key={message.id} className={`${s.message} ${message.own ? s.ownMessage : ''}`}><span className={s.messageAvatar} aria-hidden="true">{avatar(message.author.displayName)}</span><div className={s.messageContent}><header><strong>{message.own ? 'شما' : message.author.displayName}</strong><span>سطح {number(message.author.level)}</span><time dateTime={message.createdAt} title={new Date(message.createdAt).toLocaleString('fa-IR')}>{formatTime(message.createdAt)}</time></header><div className={s.bubble}>{message.body && <p dir="auto">{message.body}</p>}{message.attachment && <a className={s.attachment} href={`/api/community/files?id=${message.attachment.id}`} download><Download size={18}/><span>{message.attachment.name}<small>{number(Math.ceil(message.attachment.size / 1024))} کیلوبایت · دریافت فایل</small></span></a>}</div><div className={s.messageActions}>{message.reactions.map(item => <button key={item.emoji} type="button" aria-label={`${item.emoji}، ${number(item.count)} واکنش`} aria-pressed={item.mine} disabled={busy} onClick={() => react(message.id, item.emoji)}>{item.emoji} <small>{number(item.count)}</small></button>)}<details><summary aria-label="واکنش و گزینه‌های پیام">···</summary><div className={s.messageMenu}><div className={s.row}>{reactions.map(emoji => <button key={emoji} type="button" disabled={busy} aria-label={`واکنش ${emoji}`} onClick={() => react(message.id, emoji)}>{emoji}</button>)}</div>{!message.own && <button type="button" onClick={() => { setReport({ messageId: message.id, label: `پیام ${message.author.displayName}` }); setReportReason(''); }}><Flag size={14}/> گزارش پیام</button>}{(message.own || room?.ownerId === member.id) && <button type="button" onClick={() => deleteMessage(message.id)} disabled={busy}><Trash2 size={14}/> حذف پیام</button>}</div></details></div></div></article>)}</div>
          <form className={s.composer} onSubmit={sendMessage}>{attachment && <div className={s.fileDraft}><Paperclip size={15}/><span>{attachment.name}</span><button type="button" aria-label="حذف پیوست" onClick={() => setAttachment(null)}><X size={15}/></button></div>}<label className={s.srOnly} htmlFor="community-message">پیام شما</label><textarea id="community-message" rows={2} maxLength={2000} value={body} onChange={event => setBody(event.target.value)} placeholder="یک سلام، یک تجربه، یک فکر تازه…" disabled={busy} dir="auto"/><div className={s.composerFooter}><input ref={fileInput} type="file" className={s.srOnly} accept="image/png,image/jpeg,image/webp,application/pdf,text/plain" onChange={event => void selectFile(event.target.files?.[0])}/><button type="button" className={s.iconButton} disabled={busy || fileLoading} onClick={() => fileInput.current?.click()} title="پیوست عکس، PDF یا متن؛ حداکثر ۱ مگابایت" aria-label="افزودن عکس یا فایل">{fileLoading ? <LoaderCircle className={s.spin} size={19}/> : <Paperclip size={19}/>}</button><small>{number(body.length)} / ۲٬۰۰۰</small><button className="g-btn primary" disabled={busy || fileLoading || (!body.trim() && !attachment)}>{busy ? <LoaderCircle className={s.spin} size={17}/> : <Send size={17}/>} ارسال</button></div></form>
        </div>
      </div>}
      {pane === 'people' && <section className={s.peopleSection}><div className={s.peopleHeading}><div><h2>آدم‌های هم‌مسیرت را پیدا کن.</h2><p>دوستی با رضایت دوطرفه؛ دنبال‌کردن برای حفظ ارتباط.</p></div><label className={s.search}><Search size={17}/><span className={s.srOnly}>جستجوی کاربران</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} maxLength={50} placeholder="نام یا نام کاربری"/></label></div><div className={s.filters}>{([{ key: 'all', label: 'کشف آدم‌ها' }, { key: 'friends', label: 'دوستان' }, { key: 'requests', label: 'درخواست‌ها' }, { key: 'following', label: 'دنبال‌شده‌ها' }] as const).map(item => <button key={item.key} type="button" aria-pressed={peopleFilter === item.key} onClick={() => setPeopleFilter(item.key)}>{item.label}</button>)}<button type="button" className={s.iconButton} disabled={busy} aria-label="تازه‌کردن افراد" onClick={() => void perform(refreshPeople)}><RefreshCw size={16}/></button></div>{peopleLoading ? <div className={s.skeleton}><div/><div/><div/></div> : filteredPeople.length === 0 ? <div className={s.empty}><Users size={38}/><h3>هنوز کسی در این فهرست نیست.</h3><p>با جستجوی نام، افراد تازه را پیدا کن یا کمی بعد برگرد.</p></div> : <div className={s.peopleGrid}>{filteredPeople.map(person => <article key={person.id} className={s.person}><div className={s.personTop}><span className={s.personAvatar}>{avatar(person.displayName)}<i className={person.online ? s.online : ''} aria-label={person.online ? 'فعال در دو دقیقه گذشته' : 'آفلاین'}/></span><span className={s.level}>سطح {number(person.level)}</span></div><h3>{person.displayName}</h3><small dir="ltr">@{person.username}</small><p>{person.bio || 'هنوز معرفی کوتاهی ننوشته است.'}</p><small>{person.online ? 'فعال در دو دقیقه گذشته' : 'اکنون فعال نیست'}</small><div className={s.personActions}><button className="g-btn" disabled={busy} type="button" onClick={() => relation(person.following ? 'unfollow' : 'follow', person.id)}>{person.following ? <Check size={15}/> : <Plus size={15}/>} {person.following ? 'دنبال می‌کنی' : 'دنبال‌کردن'}</button>{person.friendship === 'accepted' ? <button className="g-btn primary" type="button" disabled={busy} onClick={() => openDM(person.id)}><MessageCircle size={15}/> گفتگو</button> : <button className="g-btn primary" type="button" disabled={busy} onClick={() => relation(person.friendship === 'received' ? 'accept' : person.friendship === 'sent' ? 'remove' : 'request', person.id)}><UserRoundPlus size={15}/>{person.friendship === 'received' ? 'پذیرش دوستی' : person.friendship === 'sent' ? 'لغو درخواست' : 'درخواست دوستی'}</button>}</div><details className={s.personMore}><summary>گزینه‌های ارتباط</summary><div>{person.friendship !== 'none' && person.friendship !== 'sent' && <button type="button" disabled={busy} onClick={() => relation('remove', person.id)}>{person.friendship === 'received' ? 'رد درخواست' : 'پایان دوستی'}</button>}<button type="button" onClick={() => { setReport({ memberId: person.id, label: person.displayName }); setReportReason(''); }}>گزارش کاربر</button><button type="button" disabled={busy} onClick={() => { if (window.confirm(`${person.displayName} مسدود شود؟`)) relation('block', person.id); }}>بلاک کاربر</button></div></details></article>)}</div>}<p className={s.hint}>برای سبک‌ماندن صفحه، حداکثر ۵۰ نتیجه دریافت می‌شود. وضعیت آنلاین بر اساس فعالیت دو دقیقه اخیر است.</p></section>}
      {pane === 'profile' && <div className={s.profileLayout}><aside className={s.profileCard}><span className={s.bigAvatar}>{avatar(member.displayName)}</span><h2>{member.displayName}</h2><p dir="ltr">@{member.username}</p><span className={s.level}>سطح {number(member.level)} · {number(member.xp)} XP</span><p>{member.bio || 'یک معرفی کوتاه از خودت بنویس.'}</p><small>امتیاز، بازتاب فعالیت است و تأیید تخصص یا قابل‌اعتمادبودن شخص نیست. حداکثر ۱۰ پیام در روز، هرکدام یک XP دارند.</small></aside><div className={s.profileForms}><form className={s.formCard} onSubmit={event => { event.preventDefault(); void perform(async () => { const result = await api<{ user: Member }>('profile', { displayName: profileName, bio: profileBio }); setSession(result.user, true); setNotice('پروفایل ذخیره شد.'); }); }}><h2>پروفایلی به سبک خودت</h2><label>نام نمایشی<input value={profileName} onChange={event => setProfileName(event.target.value)} minLength={2} maxLength={50} required/></label><label>درباره من<textarea value={profileBio} onChange={event => setProfileBio(event.target.value)} maxLength={240} rows={3} placeholder="علاقه‌ها، مسیرت و چیزهایی که دوست داری درباره‌شان حرف بزنی"/></label><small>نام، معرفی و سطح شما برای اعضای اجتماع قابل مشاهده است.</small><button className="g-btn primary" disabled={busy}>ذخیره پروفایل</button></form><section className={s.formCard}><h2>حساب‌های مسدودشده</h2>{blocked.length ? blocked.map(person => <div className={s.discoverItem} key={person.id}><strong>{person.displayName}</strong><button className="g-btn" type="button" disabled={busy} onClick={() => relation('unblock', person.id)}>رفع بلاک</button></div>) : <p className={s.hint}>کسی را مسدود نکرده‌ای.</p>}</section><details className={s.formCard}><summary>تغییر رمز عبور</summary><form onSubmit={event => { event.preventDefault(); const form = event.currentTarget; const fields = new FormData(form); void perform(async () => { await api('account', { action: 'password', currentPassword: fields.get('currentPassword'), newPassword: fields.get('newPassword') }); form.reset(); setNotice('رمز تغییر کرد و نشست‌های قبلی بسته شدند.'); }); }}><label>رمز فعلی<input type="password" name="currentPassword" autoComplete="current-password" required maxLength={128}/></label><label>رمز جدید<input type="password" name="newPassword" autoComplete="new-password" required minLength={10} maxLength={128}/></label><button className="g-btn" disabled={busy}>تغییر رمز</button></form></details><details className={s.formCard}><summary>حریم خصوصی و حذف حساب</summary><p className={s.hint}>پیام‌ها، فایل‌ها، نام و ارتباطات اجتماعی در سرور نگهداری می‌شوند. با حذف حساب، فایل‌ها پاک، پیام‌ها خالی و پروفایل ناشناس می‌شود. شناسه‌های لازم برای گزارش تخلف و یکپارچگی سابقه بازی ممکن است باقی بمانند. این کار داده‌های شخصی روی دستگاه را حذف نمی‌کند.</p><form onSubmit={event => { event.preventDefault(); const fields = new FormData(event.currentTarget); if (!window.confirm('حساب اجتماعی و پیام‌هایت حذف شود؟ این کار برگشت‌پذیر نیست.')) return; void perform(async () => { await api('account', { action: 'delete', currentPassword: fields.get('password') }); setSession(null, true); setNotice('حساب اجتماعی حذف شد.'); }); }}><label>برای حذف، رمز فعلی را وارد کن<input name="password" type="password" autoComplete="current-password" required maxLength={128}/></label><button className={s.dangerButton} disabled={busy}>حذف حساب اجتماعی</button></form></details></div></div>}
    </>}
    <dialog ref={reportDialog} className={s.reportDialog} onCancel={() => setReport(null)} onClose={() => setReport(null)}><form onSubmit={submitReport}><header><h2>گزارش {report?.label}</h2><button type="button" className={s.iconButton} onClick={() => setReport(null)} aria-label="بستن گزارش"><X size={18}/></button></header><p>دلیل را روشن و کوتاه بنویس. گزارش برای مدیر ارسال می‌شود.</p><label>دلیل گزارش<textarea required minLength={5} maxLength={500} rows={4} value={reportReason} onChange={event => setReportReason(event.target.value)} placeholder="مزاحمت، محتوای نامناسب، افشای اطلاعات خصوصی…"/></label><button className="g-btn primary" disabled={busy}>ثبت گزارش</button></form></dialog>
  </section>;
}
