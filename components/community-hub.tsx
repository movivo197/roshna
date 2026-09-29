'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Check,
  Download,
  Flag,
  Globe2,
  Heart,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  MessageCircle,
  Paperclip,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  UserRound,
  UserRoundPlus,
  UserX,
  Users,
  X,
  Zap,
  HelpCircle,
  Camera
} from 'lucide-react';
import type { CommunityMessage, CommunityPerson, CommunityRoom, Member, Gender, AnonymousPeer } from '../lib/community/types';
import { communityRequest as api } from '../lib/community/client';
import s from './community.module.css';

type PeopleResponse = { people: CommunityPerson[]; blocked: { id: string; displayName: string }[] };
type RoomsResponse = { rooms: CommunityRoom[]; discover: CommunityRoom[] };
type FileDraft = { name: string; mime: string; data: string };
type Pane = 'chat' | 'anonymous' | 'people' | 'profile';

const reactions = ['❤️', '👏', '✨', '👍', '😂'];
const errorText = (error: unknown) => (error instanceof Error ? error.message : 'عملیات انجام نشد. دوباره تلاش کنید.');
const number = (value: number) => value.toLocaleString('fa-IR');
const formatTime = (value: string) => new Date(value).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
];

const ICEBREAKERS = [
  'عمیق‌ترین آرزویی که این روزها تو ذهنت داری چیه؟',
  'بهترین کتاب، فیلم یا پادکستی که اخیراً دیدی یا شنیدی چی بوده؟',
  'بزرگ‌ترین درسی که از یک شکست یا چالش گرفتی چی بوده؟',
  'اگر قرار بود یک مهارت خارق‌العاده رو یک‌شبه یاد بگیری، چی رو انتخاب می‌کردی؟',
  'یک عادت خوب که زندگیت رو بهتر کرده به من یاد بده!',
  'چه چیزی تو زندگی بیشترین آرامش رو بهت میده؟'
];

function RenderAvatar({ user, className, size = 42 }: { user: { displayName: string; avatar?: string }; className?: string; size?: number }) {
  if (user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:image'))) {
    return (
      <img
        src={user.avatar}
        alt={user.displayName}
        className={className || s.avatar}
        style={{ width: size, height: size, objectFit: 'cover', borderRadius: Math.round(size * 0.35) }}
      />
    );
  }
  return (
    <span className={className || s.avatar} style={{ width: size, height: size, borderRadius: Math.round(size * 0.35) }}>
      {user.displayName.trim().slice(0, 1) || 'ر'}
    </span>
  );
}

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
  const [peopleFilter, setPeopleFilter] = useState<'all' | 'friends' | 'requests' | 'following'>('all');
  const [groupName, setGroupName] = useState('');
  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState<FileDraft | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [report, setReport] = useState<{ messageId?: string; memberId?: string; label: string } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [inviteMember, setInviteMember] = useState('');

  // Profile fields
  const [profileName, setProfileName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [profileGender, setProfileGender] = useState<Gender>('unspecified');
  const [profileAge, setProfileAge] = useState<number>(20);
  const [profileAvatar, setProfileAvatar] = useState<string>('');

  // Anonymous Chat state
  const [anonPreference, setAnonPreference] = useState<'any' | 'male' | 'female'>('any');
  const [anonQueueId, setAnonQueueId] = useState<string | null>(null);
  const [anonStatus, setAnonStatus] = useState<'idle' | 'waiting' | 'matched'>('idle');
  const [anonRoomId, setAnonRoomId] = useState<string | null>(null);
  const [anonPeer, setAnonPeer] = useState<AnonymousPeer | null>(null);
  const [anonSearchSeconds, setAnonSearchSeconds] = useState(0);

  const reportDialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const messageList = useRef<HTMLDivElement>(null);
  const identity = useRef<string | null>(null);
  const currentRoom = useRef(selectedRoom);
  const requestSequence = useRef(0);

  const setSession = useCallback((user: Member | null, broadcast = false) => {
    if (identity.current !== user?.id) {
      identity.current = user?.id || null;
      requestSequence.current += 1;
      setMessages([]);
      setRooms([]);
      setDiscover([]);
      setPeople([]);
      setBlocked([]);
      setBody('');
      setAttachment(null);
      setSelectedRoom('public-lobby');
      setReport(null);
      setAnonStatus('idle');
      setAnonQueueId(null);
      setAnonRoomId(null);
    }
    setMember(user);
    setProfileName(user?.displayName || '');
    setProfileBio(user?.bio || '');
    setProfileGender(user?.gender || 'unspecified');
    setProfileAge(user?.age && user.age >= 12 ? user.age : 20);
    setProfileAvatar(user?.avatar || '');
    if (broadcast) window.dispatchEvent(new CustomEvent('roshana:session', { detail: { user } }));
  }, []);

  const loadSession = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api<{ user: Member | null }>('session');
      setSession(result.user);
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setLoading(false);
    }
  }, [setSession]);

  useEffect(() => {
    void loadSession();
    const sessionChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ user: Member | null }>).detail;
      if (detail && 'user' in detail) setSession(detail.user);
      else void loadSession();
    };
    window.addEventListener('roshana:session', sessionChanged);
    return () => {
      window.removeEventListener('roshana:session', sessionChanged);
      identity.current = null;
      requestSequence.current += 1;
    };
  }, [loadSession, setSession]);

  const refreshRooms = useCallback(async () => {
    const owner = identity.current;
    if (!owner) return;
    const result = await api<RoomsResponse>('rooms');
    if (identity.current !== owner) return;
    setRooms(result.rooms);
    setDiscover(result.discover);
  }, []);

  const refreshPeople = useCallback(async () => {
    const owner = identity.current;
    if (!owner) return;
    const result = await api<PeopleResponse>(`people?q=${encodeURIComponent(query)}`);
    if (identity.current !== owner) return;
    setPeople(result.people);
    setBlocked(result.blocked);
  }, [query]);

  const refreshMessages = useCallback(async (roomId = currentRoom.current) => {
    const owner = identity.current;
    if (!owner) return;
    const sequence = ++requestSequence.current;
    const result = await api<{ messages: CommunityMessage[] }>(`messages?room=${encodeURIComponent(roomId)}`);
    if (identity.current !== owner || currentRoom.current !== roomId || sequence !== requestSequence.current) return;
    const nearBottom =
      !messageList.current || messageList.current.scrollHeight - messageList.current.scrollTop - messageList.current.clientHeight < 140;
    setMessages(result.messages);
    if (nearBottom) {
      requestAnimationFrame(() => {
        if (messageList.current) messageList.current.scrollTop = messageList.current.scrollHeight;
      });
    }
  }, []);

  // Periodic rooms refresh
  useEffect(() => {
    if (!member) return;
    let active = true;
    const refresh = () => {
      if (document.hidden) return;
      void refreshRooms().catch((reason) => {
        if (active) setError(errorText(reason));
      });
    };
    refresh();
    const interval = window.setInterval(refresh, 20_000);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [member?.id, refreshRooms]);

  // Periodic messages refresh for active room
  useEffect(() => {
    const activeTarget = pane === 'anonymous' && anonRoomId ? anonRoomId : selectedRoom;
    currentRoom.current = activeTarget;
    requestSequence.current += 1;
    setMessages([]);
    setAttachment(null);
    setBody('');

    if (!member || (pane !== 'chat' && (pane !== 'anonymous' || !anonRoomId))) return;

    let active = true;
    setMessagesLoading(true);
    const refresh = () => {
      if (document.hidden) return;
      void refreshMessages(activeTarget)
        .catch((reason) => {
          if (active) {
            setMessages([]);
            setError(errorText(reason));
          }
        })
        .finally(() => {
          if (active) setMessagesLoading(false);
        });
    };
    refresh();
    const interval = window.setInterval(refresh, pane === 'anonymous' ? 3000 : 7000);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      requestSequence.current += 1;
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [member?.id, selectedRoom, pane, anonRoomId, refreshMessages]);

  // People list auto fetch
  useEffect(() => {
    if (!member || pane !== 'people') return;
    let active = true;
    setPeopleLoading(true);
    const timer = window.setTimeout(() => {
      void refreshPeople()
        .catch((reason) => {
          if (active) setError(errorText(reason));
        })
        .finally(() => {
          if (active) setPeopleLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [member?.id, pane, refreshPeople]);

  // Anonymous chat polling timer
  useEffect(() => {
    if (anonStatus !== 'waiting' || !anonQueueId) return;
    let active = true;
    const timer = window.setInterval(() => {
      setAnonSearchSeconds((s) => s + 1);
    }, 1000);

    const poll = async () => {
      try {
        const res = await api<{ status: string; roomId?: string; peer?: AnonymousPeer }>(`anonymous?queueId=${anonQueueId}`);
        if (!active) return;
        if (res.status === 'matched' && res.roomId) {
          setAnonStatus('matched');
          setAnonRoomId(res.roomId);
          if (res.peer) setAnonPeer(res.peer);
          setNotice('هم‌صحبت پیدا شد! گفتگو آغاز شد.');
        } else if (res.status === 'cancelled') {
          setAnonStatus('idle');
          setAnonQueueId(null);
        }
      } catch (err) {
        // quiet retry
      }
    };

    const pollInterval = window.setInterval(poll, 2200);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.clearInterval(pollInterval);
    };
  }, [anonStatus, anonQueueId]);

  useEffect(() => {
    if (report && reportDialog.current && !reportDialog.current.open) reportDialog.current.showModal();
    else if (!report) reportDialog.current?.close();
  }, [report]);

  async function perform(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  }

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void perform(async () => {
      const result = await api<{ user: Member }>('session', {
        action: register ? 'register' : 'login',
        username: fields.get('username'),
        password: fields.get('password'),
        ...(register ? { displayName: fields.get('displayName'), accepted: fields.get('accepted') === 'on' } : {})
      });
      setSession(result.user, true);
      setNotice(register ? 'حساب شما ساخته شد. به جمع روشنا خوش آمدید.' : 'خوش آمدید.');
    });
  }

  function logout() {
    void perform(async () => {
      await api('session', { action: 'logout' });
      setSession(null, true);
      setNotice('از حساب خارج شدید.');
    });
  }

  function relation(action: string, memberId: string) {
    void perform(async () => {
      await api('relations', { action, memberId });
      await Promise.all([refreshPeople(), refreshRooms()]);
      setNotice(action === 'block' ? 'حساب مسدود شد؛ پیام‌ها و تعاملات دوطرفه مخفی شدند.' : 'تغییر ذخیره شد.');
    });
  }

  function openDM(memberId: string) {
    void perform(async () => {
      const result = await api<{ roomId: string }>('rooms', { action: 'dm', memberId });
      await refreshRooms();
      setSelectedRoom(result.roomId);
      setPane('chat');
    });
  }

  function roomAction(action: 'join' | 'leave', roomId: string) {
    void perform(async () => {
      const result = await api<{ roomId?: string }>('rooms', { action, roomId });
      await refreshRooms();
      setSelectedRoom(result.roomId || 'public-lobby');
      setPane('chat');
    });
  }

  function createGroup(event: FormEvent) {
    event.preventDefault();
    void perform(async () => {
      const result = await api<{ roomId: string }>('rooms', { action: 'create', name: groupName });
      setGroupName('');
      await refreshRooms();
      setSelectedRoom(result.roomId);
    });
  }

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    const targetRoom = pane === 'anonymous' && anonRoomId ? anonRoomId : selectedRoom;
    void perform(async () => {
      await api('messages', { action: 'send', roomId: targetRoom, body, ...(attachment ? { attachment } : {}) });
      if (currentRoom.current === targetRoom) {
        setBody('');
        setAttachment(null);
        await refreshMessages(targetRoom);
      }
      if (pane === 'chat') await refreshRooms();
    });
  }

  async function selectFile(file: File | undefined) {
    if (!file) return;
    setError('');
    if (!['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain'].includes(file.type) || !file.size || file.size > 1_048_576) {
      setError('فقط PNG، JPEG، WebP، PDF و متن ساده تا ۱ مگابایت قابل ارسال است.');
      return;
    }
    const owner = identity.current;
    const targetRoom = pane === 'anonymous' && anonRoomId ? anonRoomId : selectedRoom;
    setFileLoading(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = () => reject(new Error('خواندن فایل ممکن نشد.'));
        reader.readAsDataURL(file);
      });
      if (identity.current === owner && currentRoom.current === targetRoom) setAttachment({ name: file.name, mime: file.type, data });
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setFileLoading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  async function selectAvatarFile(file: File | undefined) {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1_048_576) {
      setError('عکس پروفایل باید PNG، JPEG یا WebP تا ۱ مگابایت باشد.');
      return;
    }
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('خطا در خواندن تصویر'));
        reader.readAsDataURL(file);
      });
      setProfileAvatar(data);
      setNotice('عکس پروفایل انتخاب شد. برای ذخیره نهایی، دکمه ذخیره پروفایل را بزنید.');
    } catch (err) {
      setError(errorText(err));
    }
  }

  function react(messageId: string, emoji: string) {
    void perform(async () => {
      await api('messages', { action: 'react', messageId, emoji });
      await refreshMessages();
    });
  }

  function deleteMessage(messageId: string) {
    if (window.confirm('این پیام و فایل پیوست آن حذف شود؟')) {
      void perform(async () => {
        await api('messages', { action: 'delete', messageId });
        await refreshMessages();
      });
    }
  }

  function submitReport(event: FormEvent) {
    event.preventDefault();
    if (!report) return;
    void perform(async () => {
      await api('reports', { ...(report.messageId ? { messageId: report.messageId } : { memberId: report.memberId }), reason: reportReason });
      setReport(null);
      setReportReason('');
      setNotice('گزارش برای بررسی مدیر ثبت شد.');
    });
  }

  // Anonymous Chat Handlers
  async function startAnonymousSearch() {
    if (!member) return;
    if (!member.gender || member.gender === 'unspecified' || !member.age || member.age < 12 || member.displayName.trim().length < 2) {
      setPane('profile');
      setError('برای شروع چت ناشناس، لطفاً ابتدا نام، جنسیت و سن خود را در پروفایل مشخص کنید.');
      return;
    }

    setAnonStatus('waiting');
    setAnonSearchSeconds(0);
    setAnonPeer(null);
    setAnonRoomId(null);

    void perform(async () => {
      const res = await api<{ status: string; queueId?: string; roomId?: string; peer?: AnonymousPeer }>('anonymous', {
        action: 'find',
        preferredGender: anonPreference,
      });
      if (res.status === 'matched' && res.roomId) {
        setAnonStatus('matched');
        setAnonRoomId(res.roomId);
        if (res.peer) setAnonPeer(res.peer);
        setNotice('هم‌صحبت پیدا شد! گفتگو آغاز شد.');
      } else if (res.status === 'waiting' && res.queueId) {
        setAnonQueueId(res.queueId);
      }
    });
  }

  async function cancelAnonymousSearch() {
    if (anonQueueId) {
      void perform(async () => {
        await api('anonymous', { action: 'leave', queueId: anonQueueId });
        setAnonStatus('idle');
        setAnonQueueId(null);
        setNotice('جستجوی هم‌صحبت لغو شد.');
      });
    } else {
      setAnonStatus('idle');
    }
  }

  async function leaveAnonymousChat() {
    if (anonRoomId) {
      if (window.confirm('آیا مایل به ترک این گفتگوی ناشناس هستید؟')) {
        void perform(async () => {
          await api('anonymous', { action: 'leave', roomId: anonRoomId });
          setAnonStatus('idle');
          setAnonRoomId(null);
          setAnonPeer(null);
          setNotice('گفتگو پایان یافت.');
        });
      }
    }
  }

  async function nextAnonymousChat() {
    if (anonRoomId) {
      void perform(async () => {
        await api('anonymous', { action: 'leave', roomId: anonRoomId });
        setAnonRoomId(null);
        setAnonPeer(null);
        await startAnonymousSearch();
      });
    }
  }

  async function revealIdentity() {
    if (anonRoomId) {
      void perform(async () => {
        await api('anonymous', { action: 'reveal', roomId: anonRoomId });
        setNotice('اطلاعات معرفی شما در چت ارسال شد.');
        await refreshMessages(anonRoomId);
      });
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!profileGender || profileGender === 'unspecified') {
      setError('لطفاً جنسیت خود را مشخص کنید.');
      return;
    }
    if (!profileAge || profileAge < 12 || profileAge > 120) {
      setError('سن باید عددی معتبر بین ۱۲ تا ۱۲۰ سال باشد.');
      return;
    }
    void perform(async () => {
      const result = await api<{ user: Member }>('profile', {
        displayName: profileName,
        bio: profileBio,
        gender: profileGender,
        age: profileAge,
        avatar: profileAvatar,
      });
      setSession(result.user, true);
      setNotice('پروفایل با موفقیت بروزرسانی و ذخیره شد.');
    });
  }

  const room = rooms.find((item) => item.id === selectedRoom);
  const isProfileComplete = member && member.gender && member.gender !== 'unspecified' && member.age && member.age >= 12;

  const filteredPeople = people.filter(
    (person) =>
      peopleFilter === 'all' ||
      (peopleFilter === 'friends' && person.friendship === 'accepted') ||
      (peopleFilter === 'requests' && ['received', 'sent'].includes(person.friendship)) ||
      (peopleFilter === 'following' && person.following)
  );
  const friendRequestsReceived = people.filter((p) => p.friendship === 'received');
  const friends = people.filter((person) => person.friendship === 'accepted');

  return (
    <section className={s.hub} aria-label="گفتگو و اجتماع روشنا">
      <header className={s.hero}>
        <div>
          <span className={s.eyebrow}>
            <Sparkles size={15} /> آدم‌ها، ایده‌ها، ارتباط‌های ناب
          </span>
          <h1>گفتگو، آغاز یک همراهی سازنده.</h1>
          <p>اتصال به هم‌صحبت‌های واقعی، چت تصادفی ناشناس با فیلتر هوشمند، و اشتراک تجربه‌ها در محیطی امن و محترمانه.</p>
        </div>
        <div className={s.heroArt} aria-hidden="true">
          <div>
            <MessageCircle size={44} />
          </div>
          <i>
            <Heart size={22} />
          </i>
          <b>
            <Users size={24} />
          </b>
          <span />
        </div>
      </header>

      {error && (
        <div className={s.error} role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="بستن پیام خطا">
            <X size={17} />
          </button>
        </div>
      )}
      {notice && (
        <div className={s.notice} role="status">
          <Check size={17} />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="بستن پیام">
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className={s.skeleton} aria-busy="true" aria-label="در حال دریافت حساب">
          <div />
          <div />
          <div />
        </div>
      ) : !member ? (
        <div className={s.entry}>
          <div className={s.entryCopy}>
            <span className={s.badge}>
              <ShieldCheck size={15} /> جامعه‌ای پاک، آرام و هوشمند
            </span>
            <h2>
              جایی برای هم‌صحبت شدن،
              <br />
              نه رقابت برای دیده‌شدن.
            </h2>
            <p>گفتگوی عمومی، تالارهای موضوعی، چت ناشناس تصادفی و پیام خصوصی امن با دوستانت.</p>
            <ul>
              <li>
                <Radio size={19} />
                <span>
                  <strong>چت ناشناس تصادفی:</strong> گفتگو با کاربران آنلاین با فیلتر ترجیح دختر / پسر
                </span>
              </li>
              <li>
                <Users size={19} />
                <span>پروفایل اختصاصی، کشف افراد هم‌فکر و سیستم دوستیابی دوطرفه</span>
              </li>
              <li>
                <LockKeyhole size={19} />
                <span>چت خصوصی امن پس از پذیرش دوستی بدون هرزنامه</span>
              </li>
              <li>
                <Flag size={19} />
                <span>سیستم هوشمند گزارش، مسدودسازی و نظارت مدیریتی</span>
              </li>
            </ul>
          </div>
          <form className={s.auth} onSubmit={signIn}>
            <div className={s.authTabs}>
              <button type="button" aria-pressed={!register} onClick={() => setRegister(false)}>
                ورود
              </button>
              <button type="button" aria-pressed={register} onClick={() => setRegister(true)}>
                ساخت حساب جدید
              </button>
            </div>
            <h2>{register ? 'یک شروع تازه و روشن' : 'خوش برگشتی'}</h2>
            {register && (
              <label>
                نام نمایشی
                <input name="displayName" required minLength={2} maxLength={50} autoComplete="nickname" placeholder="دوست داری چه صدایت کنیم؟" />
              </label>
            )}
            <label>
              نام کاربری
              <input
                name="username"
                required
                minLength={3}
                maxLength={24}
                pattern="[a-zA-Z][a-zA-Z0-9_]*"
                autoComplete="username"
                dir="ltr"
                placeholder="your_username"
              />
            </label>
            <label>
              رمز عبور
              <input
                name="password"
                required
                minLength={register ? 10 : 1}
                maxLength={128}
                type="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                placeholder={register ? 'حداقل ۱۰ کاراکتر' : 'رمز عبورت را وارد کن'}
              />
            </label>
            {register && (
              <>
                <label className={s.agreement}>
                  <input type="checkbox" name="accepted" required />
                  <span>قوانین احترام به دیگران، حفظ حریم خصوصی و منع هرگونه مزاحمت را می‌پذیرم.</span>
                </label>
                <small>نام کاربری با حرف انگلیسی شروع می‌شود.</small>
              </>
            )}
            <button className="g-btn primary" type="submit" disabled={busy}>
              {busy ? <LoaderCircle className={s.spin} size={17} /> : <ArrowLeft size={17} />} {register ? 'ساخت حساب و ورود' : 'ورود به گفتگو'}
            </button>
            {error && (
              <button type="button" className={s.textButton} disabled={busy} onClick={() => void loadSession()}>
                <RefreshCw size={14} /> بررسی دوباره اتصال
              </button>
            )}
          </form>
        </div>
      ) : (
        <>
          <div className={s.accountBar}>
            <div className={s.identity}>
              <RenderAvatar user={member} size={44} />
              <div>
                <strong>{member.displayName}</strong>
                <small dir="ltr">@{member.username}</small>
              </div>
              <span className={s.level}>سطح {number(member.level)}</span>
              {member.gender && member.gender !== 'unspecified' && (
                <span className={s.genderTag}>
                  {member.gender === 'male' ? '🌿 پسر' : '🌸 دختر'} {member.age ? `· ${number(member.age)} سال` : ''}
                </span>
              )}
            </div>

            <nav aria-label="بخش‌های گفتگو">
              <button type="button" aria-current={pane === 'chat' ? 'page' : undefined} onClick={() => setPane('chat')}>
                <MessageCircle size={17} /> گفتگوها
              </button>
              <button
                type="button"
                className="anon-nav-btn"
                aria-current={pane === 'anonymous' ? 'page' : undefined}
                onClick={() => setPane('anonymous')}
              >
                <Radio size={17} /> چت ناشناس تصادفی
              </button>
              <button type="button" aria-current={pane === 'people' ? 'page' : undefined} onClick={() => setPane('people')}>
                <Users size={17} /> آدم‌ها {friendRequestsReceived.length > 0 && <span className={s.badgeDot}>{friendRequestsReceived.length}</span>}
              </button>
              <button type="button" aria-current={pane === 'profile' ? 'page' : undefined} onClick={() => setPane('profile')}>
                <UserRound size={17} /> پروفایل من
              </button>
            </nav>

            <button type="button" className={s.iconButton} onClick={logout} disabled={busy} title="خروج از حساب" aria-label="خروج از حساب">
              <LogOut size={18} />
            </button>
          </div>

          {/* TAB 1: REGULAR CHAT & GROUPS */}
          {pane === 'chat' && (
            <div className={s.chatLayout}>
              <aside className={s.roomPanel}>
                <header>
                  <h2>گفتگوهای من</h2>
                  <span>{number(rooms.length)}</span>
                </header>
                <div className={s.roomList}>
                  {rooms.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={item.id === selectedRoom ? s.activeRoom : ''}
                      onClick={() => setSelectedRoom(item.id)}
                      aria-pressed={item.id === selectedRoom}
                    >
                      <span className={s.roomIcon}>
                        {item.kind === 'public' ? <Globe2 size={19} /> : item.kind === 'dm' ? <LockKeyhole size={18} /> : <Users size={19} />}
                      </span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.kind === 'public' ? 'فضای عمومی روشنا' : item.kind === 'dm' ? 'گفتگوی خصوصی' : `${number(item.memberCount)} عضو · گروه باز`}</small>
                      </span>
                    </button>
                  ))}
                </div>

                <details className={s.roomDetails}>
                  <summary>
                    <Plus size={16} /> ساخت گروه باز تازه
                  </summary>
                  <form onSubmit={createGroup}>
                    <label>
                      نام گروه
                      <input
                        value={groupName}
                        onChange={(event) => setGroupName(event.target.value)}
                        minLength={3}
                        maxLength={60}
                        required
                        placeholder="مثلاً کتاب‌خوان‌های توسعه فردی"
                      />
                    </label>
                    <small>گروه در فهرست کشف نمایش داده می‌شود؛ پیام‌ها برای اعضا قابل مشاهده‌اند.</small>
                    <button className="g-btn primary" disabled={busy}>
                      ساخت گروه
                    </button>
                  </form>
                </details>

                <details className={s.roomDetails}>
                  <summary>
                    <Search size={16} /> کشف گروه‌ها ({number(discover.length)})
                  </summary>
                  {discover.length ? (
                    discover.map((item) => (
                      <div className={s.discoverItem} key={item.id}>
                        <span>
                          <strong>{item.name}</strong>
                          <small>{number(item.memberCount)} عضو</small>
                        </span>
                        <button type="button" className={s.textButton} disabled={busy} onClick={() => roomAction('join', item.id)}>
                          پیوستن
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className={s.hint}>گروه تازه‌ای برای پیوستن وجود ندارد.</p>
                  )}
                </details>

                <div className={s.communityRules}>
                  <ShieldCheck size={20} />
                  <p>
                    با مهربانی و احترام گفتگو کنیم.
                    <br />
                    حریم خصوصی کاربران خط قرمز ماست.
                  </p>
                </div>
              </aside>

              <div className={s.conversation}>
                <header className={s.conversationHeader}>
                  <div>
                    <h2>{room?.name || 'گفتگو'}</h2>
                    <p>{room?.kind === 'dm' ? 'گفتگوی خصوصی دوطرفه' : 'آخرین ۵۰ پیام · دریافت خودکار زنده'}</p>
                  </div>
                  <div className={s.row}>
                    <button
                      className={s.iconButton}
                      type="button"
                      disabled={busy || messagesLoading}
                      aria-label="تازه‌کردن پیام‌ها"
                      onClick={() => void perform(async () => refreshMessages())}
                    >
                      <RefreshCw size={17} />
                    </button>
                    {room?.kind === 'group' && room.ownerId !== member.id && (
                      <button className={s.textButton} type="button" disabled={busy} onClick={() => roomAction('leave', room.id)}>
                        ترک گروه
                      </button>
                    )}
                  </div>
                </header>

                {room?.kind === 'group' && (
                  <details className={s.invite}>
                    <summary>دعوت یک دوست به گروه</summary>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void perform(async () => {
                          await api('rooms', { action: 'invite', roomId: room.id, memberId: inviteMember });
                          setInviteMember('');
                          setNotice('دعوت برای دوستت ارسال شد.');
                        });
                      }}
                    >
                      <label>
                        شناسه دوست
                        <select
                          value={inviteMember}
                          onChange={(event) => setInviteMember(event.target.value)}
                          required
                          onFocus={() => void refreshPeople().catch((reason) => setError(errorText(reason)))}
                        >
                          <option value="">انتخاب دوست</option>
                          {friends.map((friend) => (
                            <option key={friend.id} value={friend.id}>
                              {friend.displayName}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button className="g-btn" disabled={busy || !inviteMember}>
                        ارسال دعوت
                      </button>
                    </form>
                  </details>
                )}

                <div className={s.messages} ref={messageList} aria-label="پیام‌های گفتگو" aria-busy={messagesLoading}>
                  {messagesLoading ? (
                    <div className={s.messageSkeleton}>
                      <i />
                      <i />
                      <i />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className={s.empty}>
                      <MessageCircle size={39} />
                      <h3>گفتگوی خوب با یک سلام شروع می‌شود.</h3>
                      <p>هنوز پیامی برای نمایش نیست. اولین پیام را شما بنویسید!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <article key={message.id} className={`${s.message} ${message.own ? s.ownMessage : ''}`}>
                        <RenderAvatar user={message.author} className={s.messageAvatar} size={30} />
                        <div className={s.messageContent}>
                          <header>
                            <strong>{message.own ? 'شما' : message.author.displayName}</strong>
                            <span>سطح {number(message.author.level)}</span>
                            <time dateTime={message.createdAt} title={new Date(message.createdAt).toLocaleString('fa-IR')}>
                              {formatTime(message.createdAt)}
                            </time>
                          </header>
                          <div className={s.bubble}>
                            {message.body && <p dir="auto">{message.body}</p>}
                            {message.attachment && (
                              <a className={s.attachment} href={`/api/community/files?id=${message.attachment.id}`} download>
                                <Download size={18} />
                                <span>
                                  {message.attachment.name}
                                  <small>{number(Math.ceil(message.attachment.size / 1024))} کیلوبایت · دریافت فایل</small>
                                </span>
                              </a>
                            )}
                          </div>
                          <div className={s.messageActions}>
                            {message.reactions.map((item) => (
                              <button
                                key={item.emoji}
                                type="button"
                                aria-label={`${item.emoji}، ${number(item.count)} واکنش`}
                                aria-pressed={item.mine}
                                disabled={busy}
                                onClick={() => react(message.id, item.emoji)}
                              >
                                {item.emoji} <small>{number(item.count)}</small>
                              </button>
                            ))}
                            <details>
                              <summary aria-label="واکنش و گزینه‌های پیام">···</summary>
                              <div className={s.messageMenu}>
                                <div className={s.row}>
                                  {reactions.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      disabled={busy}
                                      aria-label={`واکنش ${emoji}`}
                                      onClick={() => react(message.id, emoji)}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                                {!message.own && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReport({ messageId: message.id, label: `پیام ${message.author.displayName}` });
                                      setReportReason('');
                                    }}
                                  >
                                    <Flag size={14} /> گزارش پیام
                                  </button>
                                )}
                                {(message.own || room?.ownerId === member.id) && (
                                  <button type="button" onClick={() => deleteMessage(message.id)} disabled={busy}>
                                    <Trash2 size={14} /> حذف پیام
                                  </button>
                                )}
                              </div>
                            </details>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>

                <form className={s.composer} onSubmit={sendMessage}>
                  {attachment && (
                    <div className={s.fileDraft}>
                      <Paperclip size={15} />
                      <span>{attachment.name}</span>
                      <button type="button" aria-label="حذف پیوست" onClick={() => setAttachment(null)}>
                        <X size={15} />
                      </button>
                    </div>
                  )}
                  <label className={s.srOnly} htmlFor="community-message">
                    پیام شما
                  </label>
                  <textarea
                    id="community-message"
                    rows={2}
                    maxLength={2000}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="یک سلام، یک تجربه، یک فکر تازه…"
                    disabled={busy}
                    dir="auto"
                  />
                  <div className={s.composerFooter}>
                    <input
                      ref={fileInput}
                      type="file"
                      className={s.srOnly}
                      accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
                      onChange={(event) => void selectFile(event.target.files?.[0])}
                    />
                    <button
                      type="button"
                      className={s.iconButton}
                      disabled={busy || fileLoading}
                      onClick={() => fileInput.current?.click()}
                      title="پیوست عکس، PDF یا متن؛ حداکثر ۱ مگابایت"
                      aria-label="افزودن عکس یا فایل"
                    >
                      {fileLoading ? <LoaderCircle className={s.spin} size={19} /> : <Paperclip size={19} />}
                    </button>
                    <small>
                      {number(body.length)} / {number(2000)}
                    </small>
                    <button className="g-btn primary" disabled={busy || fileLoading || (!body.trim() && !attachment)}>
                      {busy ? <LoaderCircle className={s.spin} size={17} /> : <Send size={17} />} ارسال
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: ANONYMOUS RANDOM CHAT */}
          {pane === 'anonymous' && (
            <div className="anon-chat-wrapper">
              {!isProfileComplete ? (
                <div className="anon-profile-gate">
                  <div className="anon-gate-card">
                    <div className="anon-gate-icon">
                      <Radio size={40} />
                    </div>
                    <h2>تکمیل پروفایل برای ورود به چت ناشناس</h2>
                    <p>
                      برای حفظ سلامت فضا و ارتباط هدفمند، مشخص‌کردن <strong>نام، جنسیت و سن</strong> شما الزامی است. عکس و سایر موارد
                      اختیاری هستند.
                    </p>
                    <form onSubmit={saveProfile} className="anon-gate-form">
                      <label>
                        نام نمایشی
                        <input
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          required
                          minLength={2}
                          maxLength={50}
                          placeholder="مثلاً سارا یا آرش"
                        />
                      </label>

                      <div className="anon-gender-select">
                        <label>جنسیت شما:</label>
                        <div className="anon-gender-options">
                          <button
                            type="button"
                            className={`gender-btn ${profileGender === 'female' ? 'selected' : ''}`}
                            onClick={() => setProfileGender('female')}
                          >
                            🌸 دختر (خانم)
                          </button>
                          <button
                            type="button"
                            className={`gender-btn ${profileGender === 'male' ? 'selected' : ''}`}
                            onClick={() => setProfileGender('male')}
                          >
                            🌿 پسر (آقا)
                          </button>
                        </div>
                      </div>

                      <label>
                        سن شما (سال)
                        <input
                          type="number"
                          min={12}
                          max={120}
                          value={profileAge}
                          onChange={(e) => setProfileAge(parseInt(e.target.value) || 20)}
                          required
                        />
                      </label>

                      <button type="submit" className="g-btn primary" disabled={busy}>
                        {busy ? <LoaderCircle className={s.spin} size={17} /> : <Sparkles size={17} />} ذخیره و ورود به چت ناشناس
                      </button>
                    </form>
                  </div>
                </div>
              ) : anonStatus === 'idle' ? (
                <div className="anon-start-card">
                  <div className="anon-header">
                    <span className="anon-badge">
                      <Radio size={15} /> سامانه هم‌صحبتی هوشمند روشنا
                    </span>
                    <h2>چت ناشناس تصادفی</h2>
                    <p>
                      بدون افشای هویت، در فضایی امن و صمیمی با کاربران آنلاین هم‌صحبت شو. هر زمان خواستی می‌توانی هم‌صحبت را عوض کنی یا هویتت
                      را معرفی کنی.
                    </p>
                  </div>

                  <div className="anon-preference-box">
                    <h3>طرف مقابل من باشد:</h3>
                    <div className="anon-pref-options">
                      <button
                        type="button"
                        className={`anon-pref-btn ${anonPreference === 'any' ? 'active' : ''}`}
                        onClick={() => setAnonPreference('any')}
                      >
                        💫 فرقی نمی‌کنه (هر دو)
                      </button>
                      <button
                        type="button"
                        className={`anon-pref-btn ${anonPreference === 'female' ? 'active' : ''}`}
                        onClick={() => setAnonPreference('female')}
                      >
                        🌸 دختر
                      </button>
                      <button
                        type="button"
                        className={`anon-pref-btn ${anonPreference === 'male' ? 'active' : ''}`}
                        onClick={() => setAnonPreference('male')}
                      >
                        🌿 پسر
                      </button>
                    </div>
                  </div>

                  <div className="anon-features-row">
                    <div className="anon-feat">
                      <ShieldCheck size={20} />
                      <h4>امن و خصوصی</h4>
                      <small>هویت شما کاملاً پنهان است مگر خودتان بخواهید معرفی کنید.</small>
                    </div>
                    <div className="anon-feat">
                      <Zap size={20} />
                      <h4>تعویض فوری هم‌صحبت</h4>
                      <small>با یک کلیک به نفر بعدی وصل شوید.</small>
                    </div>
                    <div className="anon-feat">
                      <Sparkles size={20} />
                      <h4>پیشنهاد موضوعات جذاب</h4>
                      <small>ایده‌ها و پرسش‌های عمیق برای شکستن یخ گفتگو.</small>
                    </div>
                  </div>

                  <button type="button" className="anon-search-btn" onClick={startAnonymousSearch} disabled={busy}>
                    <Radio size={20} />
                    <span>شروع جستجوی هم‌صحبت ناشناس</span>
                  </button>
                </div>
              ) : anonStatus === 'waiting' ? (
                <div className="anon-radar-card">
                  <div className="anon-radar">
                    <div className="radar-circle circle-1" />
                    <div className="radar-circle circle-2" />
                    <div className="radar-circle circle-3" />
                    <div className="radar-sweep" />
                    <div className="radar-center">
                      <Radio size={28} />
                    </div>
                  </div>
                  <h3>در حال جستجوی هم‌صحبت مناسب...</h3>
                  <p>
                    فیلتر انتخابی: <strong>{anonPreference === 'female' ? '🌸 دختر' : anonPreference === 'male' ? '🌿 پسر' : '💫 فرقی نمی‌کنه'}</strong>
                  </p>
                  <span className="anon-timer">
                    زمان انتظار: {number(Math.floor(anonSearchSeconds / 60))}:{anonSearchSeconds % 60 < 10 ? '۰' : ''}{number(anonSearchSeconds % 60)}
                  </span>
                  <button type="button" className="g-btn" onClick={cancelAnonymousSearch} disabled={busy}>
                    <X size={16} /> لغو جستجو
                  </button>
                </div>
              ) : (
                /* anonStatus === 'matched' */
                <div className="anon-active-room">
                  <div className="anon-top-bar">
                    <div className="anon-peer-info">
                      <div className="anon-peer-avatar">
                        <UserRound size={22} />
                      </div>
                      <div>
                        <strong>
                          هم‌صحبت ناشناس (
                          {anonPeer?.gender === 'female' ? '🌸 دختر' : anonPeer?.gender === 'male' ? '🌿 پسر' : 'هم‌صحبت'}
                          {anonPeer?.age ? `، ${number(anonPeer.age)} ساله` : ''})
                        </strong>
                        <small>ارتباط فعال و زنده</small>
                      </div>
                    </div>

                    <div className="anon-actions-group">
                      <button type="button" className="anon-action-btn reveal-btn" onClick={revealIdentity} title="ارسال اطلاعات معرفی هویت">
                        <Sparkles size={15} /> معرفی من
                      </button>
                      <button type="button" className="anon-action-btn next-btn" onClick={nextAnonymousChat} title="اتصال به نفر بعدی">
                        <Zap size={15} /> نفر بعدی
                      </button>
                      <button type="button" className="anon-action-btn leave-btn" onClick={leaveAnonymousChat} title="خروج از چت ناشناس">
                        <LogOut size={15} /> خروج
                      </button>
                    </div>
                  </div>

                  {/* Icebreaker bar */}
                  <div className="anon-icebreakers">
                    <span>
                      <HelpCircle size={14} /> پیشنهاد موضوع گفتگو:
                    </span>
                    <div className="anon-ice-chips">
                      {ICEBREAKERS.map((text, idx) => (
                        <button key={idx} type="button" onClick={() => setBody(text)} className="anon-ice-chip">
                          {text}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className={s.messages} ref={messageList} aria-label="پیام‌های چت ناشناس" style={{ height: '360px' }}>
                    {messagesLoading ? (
                      <div className={s.messageSkeleton}>
                        <i />
                        <i />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className={s.empty}>
                        <Radio size={36} />
                        <h3>اتصال با هم‌صحبت برقرار شد!</h3>
                        <p>یک سلام گرم بفرستید یا از ایده‌های بالا استفاده کنید.</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <article key={message.id} className={`${s.message} ${message.own ? s.ownMessage : ''}`}>
                          <div className={s.messageContent}>
                            <header>
                              <strong>{message.own ? 'شما' : 'هم‌صحبت'}</strong>
                              <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                            </header>
                            <div className={s.bubble}>
                              {message.body && <p dir="auto">{message.body}</p>}
                              {message.attachment && (
                                <a className={s.attachment} href={`/api/community/files?id=${message.attachment.id}`} download>
                                  <Download size={18} />
                                  <span>{message.attachment.name}</span>
                                </a>
                              )}
                            </div>
                            <div className={s.messageActions}>
                              {message.reactions.map((item) => (
                                <button key={item.emoji} type="button" aria-pressed={item.mine} onClick={() => react(message.id, item.emoji)}>
                                  {item.emoji} <small>{number(item.count)}</small>
                                </button>
                              ))}
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>

                  {/* Composer */}
                  <form className={s.composer} onSubmit={sendMessage}>
                    {attachment && (
                      <div className={s.fileDraft}>
                        <Paperclip size={15} />
                        <span>{attachment.name}</span>
                        <button type="button" aria-label="حذف پیوست" onClick={() => setAttachment(null)}>
                          <X size={15} />
                        </button>
                      </div>
                    )}
                    <textarea
                      rows={2}
                      maxLength={2000}
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      placeholder="پیام خود را بنویسید..."
                      disabled={busy}
                      dir="auto"
                    />
                    <div className={s.composerFooter}>
                      <input
                        ref={fileInput}
                        type="file"
                        className={s.srOnly}
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => void selectFile(event.target.files?.[0])}
                      />
                      <button
                        type="button"
                        className={s.iconButton}
                        disabled={busy || fileLoading}
                        onClick={() => fileInput.current?.click()}
                        title="ارسال عکس"
                      >
                        <Paperclip size={19} />
                      </button>
                      <button className="g-btn primary" disabled={busy || fileLoading || (!body.trim() && !attachment)}>
                        <Send size={17} /> ارسال
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PEOPLE & FRIEND REQUESTS */}
          {pane === 'people' && (
            <section className={s.peopleSection}>
              <div className={s.peopleHeading}>
                <div>
                  <h2>آدم‌های هم‌مسیرت را پیدا کن.</h2>
                  <p>دوستی با رضایت دوطرفه؛ دنبال‌کردن برای حفظ ارتباط و گفتگوهای سازنده.</p>
                </div>
                <label className={s.search}>
                  <Search size={17} />
                  <span className={s.srOnly}>جستجوی کاربران</span>
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    maxLength={50}
                    placeholder="نام یا نام کاربری"
                  />
                </label>
              </div>

              {/* Received Requests Notification Strip */}
              {friendRequestsReceived.length > 0 && (
                <div className="friend-requests-banner">
                  <div className="fr-banner-title">
                    <UserPlus size={18} />
                    <strong>شما {number(friendRequestsReceived.length)} درخواست دوستی جدید دارید:</strong>
                  </div>
                  <div className="fr-banner-list">
                    {friendRequestsReceived.map((req) => (
                      <div key={req.id} className="fr-banner-item">
                        <RenderAvatar user={req} size={36} />
                        <span>
                          <strong>{req.displayName}</strong> ({req.gender === 'female' ? 'دختر' : req.gender === 'male' ? 'پسر' : ''}
                          {req.age ? `، ${number(req.age)} ساله` : ''})
                        </span>
                        <div className="fr-banner-actions">
                          <button
                            type="button"
                            className="fr-accept-btn"
                            disabled={busy}
                            onClick={() => relation('accept', req.id)}
                            title="پذیرش دوستی"
                          >
                            <UserCheck size={14} /> پذیرش
                          </button>
                          <button
                            type="button"
                            className="fr-reject-btn"
                            disabled={busy}
                            onClick={() => relation('remove', req.id)}
                            title="رد درخواست"
                          >
                            <UserX size={14} /> رد
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={s.filters}>
                {(
                  [
                    { key: 'all', label: 'همه کاربران' },
                    { key: 'friends', label: `دوستان (${number(friends.length)})` },
                    { key: 'requests', label: `درخواست‌ها (${number(people.filter((p) => ['received', 'sent'].includes(p.friendship)).length)})` },
                    { key: 'following', label: 'دنبال‌شده‌ها' },
                  ] as const
                ).map((item) => (
                  <button key={item.key} type="button" aria-pressed={peopleFilter === item.key} onClick={() => setPeopleFilter(item.key)}>
                    {item.label}
                  </button>
                ))}
                <button type="button" className={s.iconButton} disabled={busy} aria-label="تازه‌کردن افراد" onClick={() => void perform(refreshPeople)}>
                  <RefreshCw size={16} />
                </button>
              </div>

              {peopleLoading ? (
                <div className={s.skeleton}>
                  <div />
                  <div />
                  <div />
                </div>
              ) : filteredPeople.length === 0 ? (
                <div className={s.empty}>
                  <Users size={38} />
                  <h3>هنوز کاربری در این فهرست نیست.</h3>
                  <p>با جستجوی نام، افراد تازه را پیدا کن یا کمی بعد برگرد.</p>
                </div>
              ) : (
                <div className={s.peopleGrid}>
                  {filteredPeople.map((person) => (
                    <article key={person.id} className={s.person}>
                      <div className={s.personTop}>
                        <div className="person-avatar-wrap" style={{ position: 'relative' }}>
                          <RenderAvatar user={person} className={s.personAvatar} size={54} />
                          <i className={person.online ? s.online : ''} aria-label={person.online ? 'آنلاین' : 'آفلاین'} />
                        </div>
                        <span className={s.level}>سطح {number(person.level)}</span>
                      </div>
                      <h3>{person.displayName}</h3>
                      <small dir="ltr">@{person.username}</small>
                      {person.gender && person.gender !== 'unspecified' && (
                        <span className="person-gender-badge">
                          {person.gender === 'male' ? '🌿 پسر' : '🌸 دختر'} {person.age ? `· ${number(person.age)} ساله` : ''}
                        </span>
                      )}
                      <p>{person.bio || 'هنوز معرفی کوتاهی ننوشته است.'}</p>
                      <small>{person.online ? '🟢 فعال و آنلاین' : 'اکنون فعال نیست'}</small>

                      <div className={s.personActions}>
                        <button
                          className="g-btn"
                          disabled={busy}
                          type="button"
                          onClick={() => relation(person.following ? 'unfollow' : 'follow', person.id)}
                        >
                          {person.following ? <Check size={15} /> : <Plus size={15} />} {person.following ? 'دنبال می‌کنی' : 'دنبال‌کردن'}
                        </button>
                        {person.friendship === 'accepted' ? (
                          <button className="g-btn primary" type="button" disabled={busy} onClick={() => openDM(person.id)}>
                            <MessageCircle size={15} /> گفتگو
                          </button>
                        ) : (
                          <button
                            className="g-btn primary"
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              relation(person.friendship === 'received' ? 'accept' : person.friendship === 'sent' ? 'remove' : 'request', person.id)
                            }
                          >
                            <UserRoundPlus size={15} />
                            {person.friendship === 'received'
                              ? 'پذیرش دوستی'
                              : person.friendship === 'sent'
                              ? 'لغو درخواست'
                              : 'درخواست دوستی'}
                          </button>
                        )}
                      </div>

                      <details className={s.personMore}>
                        <summary>گزینه‌های ارتباط</summary>
                        <div>
                          {person.friendship !== 'none' && person.friendship !== 'sent' && (
                            <button type="button" disabled={busy} onClick={() => relation('remove', person.id)}>
                              {person.friendship === 'received' ? 'رد درخواست' : 'پایان دوستی'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setReport({ memberId: person.id, label: person.displayName });
                              setReportReason('');
                            }}
                          >
                            گزارش کاربر
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              if (window.confirm(`${person.displayName} مسدود شود؟`)) relation('block', person.id);
                            }}
                          >
                            بلاک کاربر
                          </button>
                        </div>
                      </details>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 4: MY PROFILE & EDIT */}
          {pane === 'profile' && (
            <div className={s.profileLayout}>
              <aside className={s.profileCard}>
                <RenderAvatar user={member} className={s.bigAvatar} size={88} />
                <h2>{member.displayName}</h2>
                <p dir="ltr">@{member.username}</p>
                <span className={s.level}>
                  سطح {number(member.level)} · {number(member.xp)} XP
                </span>
                {member.gender && member.gender !== 'unspecified' && (
                  <span className="profile-gender-pill">
                    {member.gender === 'male' ? '🌿 پسر' : '🌸 دختر'} {member.age ? `· ${number(member.age)} سال` : ''}
                  </span>
                )}
                <p>{member.bio || 'یک معرفی کوتاه از خودت بنویس.'}</p>
                <small>امتیاز و سطح، بازتاب تعامل مثبت شما در جامعه روشناست.</small>
              </aside>

              <div className={s.profileForms}>
                <form className={s.formCard} onSubmit={saveProfile}>
                  <h2>ویرایش و تکمیل پروفایل من</h2>

                  {/* Avatar Picker */}
                  <div className="avatar-picker-section">
                    <label>عکس پروفایل:</label>
                    <div className="avatar-presets-grid">
                      {AVATAR_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`avatar-preset-btn ${profileAvatar === preset ? 'active' : ''}`}
                          onClick={() => setProfileAvatar(preset)}
                        >
                          <img src={preset} alt={`آواتار ${idx + 1}`} />
                        </button>
                      ))}
                    </div>
                    <div className="avatar-upload-row">
                      <input
                        ref={avatarInput}
                        type="file"
                        className={s.srOnly}
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => void selectAvatarFile(e.target.files?.[0])}
                      />
                      <button type="button" className="g-btn" onClick={() => avatarInput.current?.click()}>
                        <Camera size={16} /> بارگذاری عکس از دستگاه
                      </button>
                      {profileAvatar && (
                        <button type="button" className={s.textButton} onClick={() => setProfileAvatar('')}>
                          حذف عکس
                        </button>
                      )}
                    </div>
                  </div>

                  <label>
                    نام نمایشی
                    <input value={profileName} onChange={(event) => setProfileName(event.target.value)} minLength={2} maxLength={50} required />
                  </label>

                  <div className="anon-gender-select">
                    <label>جنسیت:</label>
                    <div className="anon-gender-options">
                      <button
                        type="button"
                        className={`gender-btn ${profileGender === 'female' ? 'selected' : ''}`}
                        onClick={() => setProfileGender('female')}
                      >
                        🌸 دختر (خانم)
                      </button>
                      <button
                        type="button"
                        className={`gender-btn ${profileGender === 'male' ? 'selected' : ''}`}
                        onClick={() => setProfileGender('male')}
                      >
                        🌿 پسر (آقا)
                      </button>
                    </div>
                  </div>

                  <label>
                    سن (سال)
                    <input
                      type="number"
                      min={12}
                      max={120}
                      value={profileAge}
                      onChange={(e) => setProfileAge(parseInt(e.target.value) || 20)}
                      required
                    />
                  </label>

                  <label>
                    درباره من (بیوگرافی کوتاه)
                    <textarea
                      value={profileBio}
                      onChange={(event) => setProfileBio(event.target.value)}
                      maxLength={240}
                      rows={3}
                      placeholder="علاقه‌ها، کتاب‌های مورد علاقه، اهداف رشد و چیزهایی که دوست داری درباره‌شان صحبت کنی..."
                    />
                  </label>

                  <button className="g-btn primary" disabled={busy}>
                    {busy ? <LoaderCircle className={s.spin} size={17} /> : <Check size={17} />} ذخیره تغییرات پروفایل
                  </button>
                </form>

                <section className={s.formCard}>
                  <h2>حساب‌های مسدودشده</h2>
                  {blocked.length ? (
                    blocked.map((person) => (
                      <div className={s.discoverItem} key={person.id}>
                        <strong>{person.displayName}</strong>
                        <button className="g-btn" type="button" disabled={busy} onClick={() => relation('unblock', person.id)}>
                          رفع بلاک
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className={s.hint}>کسی را مسدود نکرده‌ای.</p>
                  )}
                </section>

                <details className={s.formCard}>
                  <summary>تغییر رمز عبور</summary>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = event.currentTarget;
                      const fields = new FormData(form);
                      void perform(async () => {
                        await api('account', {
                          action: 'password',
                          currentPassword: fields.get('currentPassword'),
                          newPassword: fields.get('newPassword'),
                        });
                        form.reset();
                        setNotice('رمز تغییر کرد و نشست‌های قبلی بسته شدند.');
                      });
                    }}
                  >
                    <label>
                      رمز فعلی
                      <input type="password" name="currentPassword" autoComplete="current-password" required maxLength={128} />
                    </label>
                    <label>
                      رمز جدید
                      <input type="password" name="newPassword" autoComplete="new-password" required minLength={10} maxLength={128} />
                    </label>
                    <button className="g-btn" disabled={busy}>
                      تغییر رمز
                    </button>
                  </form>
                </details>

                <details className={s.formCard}>
                  <summary>حریم خصوصی و حذف حساب</summary>
                  <p className={s.hint}>
                    پیام‌ها، فایل‌ها و ارتباطات اجتماعی در سرور نگهداری می‌شوند. با حذف حساب، فایل‌ها پاک و اطلاعات شخصی ناشناس می‌شود. این کار داده‌های
                    شخصی درون مرورگرت را پاک نمی‌کند.
                  </p>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      const fields = new FormData(event.currentTarget);
                      if (!window.confirm('حساب اجتماعی و پیام‌هایت حذف شود؟ این کار برگشت‌پذیر نیست.')) return;
                      void perform(async () => {
                        await api('account', { action: 'delete', currentPassword: fields.get('password') });
                        setSession(null, true);
                        setNotice('حساب اجتماعی حذف شد.');
                      });
                    }}
                  >
                    <label>
                      برای حذف، رمز فعلی را وارد کن
                      <input name="password" type="password" autoComplete="current-password" required maxLength={128} />
                    </label>
                    <button className={s.dangerButton} disabled={busy}>
                      حذف حساب اجتماعی
                    </button>
                  </form>
                </details>
              </div>
            </div>
          )}
        </>
      )}

      <dialog ref={reportDialog} className={s.reportDialog} onCancel={() => setReport(null)} onClose={() => setReport(null)}>
        <form onSubmit={submitReport}>
          <header>
            <h2>گزارش {report?.label}</h2>
            <button type="button" className={s.iconButton} onClick={() => setReport(null)} aria-label="بستن گزارش">
              <X size={18} />
            </button>
          </header>
          <p>دلیل را روشن و کوتاه بنویس. گزارش برای مدیر ارسال می‌شود.</p>
          <label>
            دلیل گزارش
            <textarea
              required
              minLength={5}
              maxLength={500}
              rows={4}
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              placeholder="مزاحمت، محتوای نامناسب، افشای اطلاعات خصوصی…"
            />
          </label>
          <button className="g-btn primary" disabled={busy}>
            ثبت گزارش
          </button>
        </form>
      </dialog>
    </section>
  );
}
