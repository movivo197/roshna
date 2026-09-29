'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Brain,
  Check,
  Compass,
  Copy,
  Dice5,
  Eye,
  Gamepad2,
  Grid2X2,
  Heart,
  KeyRound,
  Layers,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap
} from 'lucide-react';
import { addTile, bestMove, canSlide, newTiles, slide, winner, type Cell, type Direction } from '../lib/games/rules';
import styles from './games.module.css';

type GameId = 'memory' | 'tiles' | 'tic' | 'wordle' | 'sudoku' | 'stroop';
type LocalResult = { id: string; game: GameId; score: number; at: string; detail: string };
type Match = {
  id: string;
  code?: string;
  host: { id: string; name: string };
  guest: { id: string; name: string } | null;
  visibility: 'public' | 'private';
  state: 'waiting' | 'playing' | 'finished' | 'cancelled' | 'expired';
  board: Cell[];
  turn: 'X' | 'O';
  result: 'X' | 'O' | 'draw' | null;
  revision: number;
  yourMark: 'X' | 'O' | null;
  createdAt: string;
  updatedAt: string;
};
type Overview = {
  user: { id: string; displayName: string } | null;
  match: Match | null;
  lobbies: Match[];
  mine: Match[];
  leaderboard: { id: string; name: string; xp: number; played: number; wins: number }[];
};

const catalogue = [
  {
    id: 'wordle' as const,
    title: 'واژه‌یاب حکمت',
    subtitle: 'کشف واژه ۵ حرفی با ۶ حدس.',
    description: 'واژه‌های اصیل و الهام‌بخش فارسی را حدس بزن و با هر رنگ به جواب نزدیک‌تر شو.',
    tag: 'زبان و هوش کلامی',
    icon: KeyRound,
    art: 'wordle',
  },
  {
    id: 'sudoku' as const,
    title: 'سودوکوی ذن',
    subtitle: 'آرامش، عدد و تمرکز عمیق.',
    description: 'جدول اعداد بدون تکرار؛ فرصتی برای استراحت ذهن و پرورش تفکر منطقی.',
    tag: 'تمرکز و ذن',
    icon: Grid2X2,
    art: 'sudoku',
  },
  {
    id: 'stroop' as const,
    title: 'چالش شناختی استروپ',
    subtitle: 'تطابق رنگ و واژه در چند ثانیه.',
    description: 'سرعت پردازش مغز و کنترل توجه را در ۱۰ دور سریع به چالش بکش.',
    tag: 'انعطاف و چابکی مغز',
    icon: Brain,
    art: 'stroop',
  },
  {
    id: 'memory' as const,
    title: 'جفت‌های پنهان',
    subtitle: 'مکث کن، ببین، به خاطر بسپار.',
    description: '۸ جفت نماد را با کمترین تلاش پیدا کن.',
    tag: 'حافظه و توجه',
    icon: Sparkles,
    art: 'memory',
  },
  {
    id: 'tiles' as const,
    title: 'مسیر ۲۰۴۸',
    subtitle: 'از یک حرکت کوچک، عددی بزرگ بساز.',
    description: 'کاشی‌های هم‌عدد را ترکیب کن؛ تا کجا می‌رسی؟',
    tag: 'منطق و برنامه‌ریزی',
    icon: Layers,
    art: 'tiles',
  },
  {
    id: 'tic' as const,
    title: 'دوزِ فکر',
    subtitle: 'سه خانه، یک تصمیم هوشمندانه.',
    description: 'با حریف رایانه‌ای بازی کن؛ تو با × شروع می‌کنی.',
    tag: 'استراتژی و آینده‌نگری',
    icon: X,
    art: 'tic',
  },
];

const digits = (value: number) => value.toLocaleString('fa-IR');
const storageKey = 'roshana-games-v2';

function GameArt({ kind }: { kind: string }) {
  return (
    <div className={`${styles.art} ${styles[kind] || ''}`} aria-hidden="true">
      {kind === 'memory' ? (
        <>
          <i>✦</i>
          <i>?</i>
          <i>?</i>
          <i>✦</i>
        </>
      ) : kind === 'tiles' ? (
        <>
          <i>۲</i>
          <i>۴</i>
          <i>۸</i>
          <i>۱۶</i>
        </>
      ) : kind === 'wordle' ? (
        <>
          <i style={{ background: '#22c55e', color: '#fff' }}>ح</i>
          <i style={{ background: '#eab308', color: '#fff' }}>ک</i>
          <i style={{ background: '#374151', color: '#fff' }}>م</i>
          <i style={{ background: '#22c55e', color: '#fff' }}>ت</i>
        </>
      ) : kind === 'sudoku' ? (
        <>
          <i>۱</i>
          <i>۲</i>
          <i>۳</i>
          <i>۴</i>
        </>
      ) : kind === 'stroop' ? (
        <>
          <i style={{ color: '#ef4444' }}>سبز</i>
          <i style={{ color: '#3b82f6' }}>زرد</i>
          <i style={{ color: '#22c55e' }}>آبی</i>
          <i style={{ color: '#eab308' }}>قرمز</i>
        </>
      ) : (
        <>
          <i>×</i>
          <i>○</i>
          <i>○</i>
          <i>×</i>
        </>
      )}
    </div>
  );
}

export default function GameCenter() {
  const [tab, setTab] = useState<'play' | 'online' | 'records'>('play');
  const [selected, setSelected] = useState<GameId | null>(null);
  const [records, setRecords] = useState<LocalResult[]>([]);
  const [favorites, setFavorites] = useState<GameId[]>([]);
  const [storageWarning, setStorageWarning] = useState('');

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (Array.isArray(parsed.records))
        setRecords(
          parsed.records
            .filter(
              (r: LocalResult) =>
                r && catalogue.some((g) => g.id === r.game) && Number.isFinite(r.score) && typeof r.at === 'string'
            )
            .slice(0, 60)
        );
      if (Array.isArray(parsed.favorites))
        setFavorites(parsed.favorites.filter((id: GameId) => catalogue.some((g) => g.id === id)));
    } catch {
      setStorageWarning('ذخیره‌سازی این مرورگر در دسترس نیست؛ بازی‌ها همچنان قابل استفاده‌اند.');
    }
  }, []);

  const persist = useCallback((nextRecords: LocalResult[], nextFavorites: GameId[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ records: nextRecords, favorites: nextFavorites }));
    } catch {
      setStorageWarning('رکورد در این نشست ثبت شد، اما ذخیره دائمی روی دستگاه انجام نشد.');
    }
  }, []);

  const finish = useCallback(
    (game: GameId, score: number, detail: string) => {
      setRecords((current) => {
        const next = [{ id: crypto.randomUUID(), game, score, detail, at: new Date().toISOString() }, ...current].slice(0, 60);
        persist(next, favorites);
        return next;
      });
    },
    [favorites, persist]
  );

  function favorite(id: GameId) {
    const next = favorites.includes(id) ? favorites.filter((value) => value !== id) : [...favorites, id];
    setFavorites(next);
    persist(records, next);
  }

  const unlocked = [
    { title: 'اولین پیروزی', earned: records.length > 0, description: 'یک بازی را با موفقیت به پایان برسان.' },
    { title: 'واژه‌شناس دانا', earned: records.some((r) => r.game === 'wordle'), description: 'یک معمای واژه‌یاب را حل کن.' },
    { title: 'استاد سودوکو', earned: records.some((r) => r.game === 'sudoku'), description: 'یک جدول سودوکو را تکمیل کن.' },
    { title: 'چابک‌مغز استروپ', earned: records.some((r) => r.game === 'stroop' && r.score >= 8), description: 'امتیاز ۸ یا بیشتر در استروپ کسب کن.' },
    { title: 'ردیاب جفت‌ها', earned: records.some((r) => r.game === 'memory'), description: 'همه جفت‌های حافظه را پیدا کن.' },
    { title: 'کاشی طلایی', earned: records.some((r) => r.game === 'tiles' && r.score >= 2048), description: 'کاشی ۲۰۴۸ را بساز.' },
  ];

  return (
    <section className={styles.root} aria-label="مرکز بازی روشنا">
      <header className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            <Gamepad2 size={17} /> بازی، آرامش و پرورش ذهن
          </span>
          <h1>
            کمی بازی.
            <br />
            <em>کمی تمرکز و کشفِ خودت.</em>
          </h1>
          <p>بازی‌های کوتاه، بدون تبلیغات مزاحم؛ برای استراحت ذهن، یادگیری لغات و تقویت حافظه و توجه.</p>
          <div className={styles.heroTags}>
            <span>
              <WifiOff size={14} /> ۶ بازی آفلاین و ذن
            </span>
            <span>
              <ShieldCheck size={14} /> طراحی اختصاصی روشنا
            </span>
          </div>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <span>×</span>
          <i>۲</i>
          <span>ح</span>
          <b>✦</b>
          <i>۸</i>
        </div>
      </header>

      <nav className={styles.tabs} aria-label="بخش‌های مرکز بازی">
        {[
          { id: 'play' as const, label: 'بازی‌های تک‌نفره و ذن', icon: Gamepad2 },
          { id: 'online' as const, label: 'رقابت آنلاین (دوز)', icon: Users },
          { id: 'records' as const, label: 'رکوردهای من', icon: Trophy },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={tab === item.id}
            className={tab === item.id ? styles.active : ''}
            onClick={() => {
              setTab(item.id);
              setSelected(null);
            }}
          >
            <item.icon size={17} />
            {item.label}
          </button>
        ))}
      </nav>

      {storageWarning && (
        <p className={styles.notice} role="status">
          {storageWarning}
        </p>
      )}

      {tab === 'play' && !selected && (
        <>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>انتخابِ امروز تو</span>
              <h2>یک بازی فکری یا آرامش‌بخش انتخاب کن</h2>
            </div>
            <span className={styles.pill}>بدون نیاز به اینترنت</span>
          </div>

          <div className={styles.catalogue}>
            {[...catalogue]
              .sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)))
              .map((game) => (
                <article className={styles.gameCard} key={game.id}>
                  <button
                    className={styles.favorite}
                    type="button"
                    aria-label={`${favorites.includes(game.id) ? 'حذف از' : 'افزودن به'} علاقه‌مندی‌ها: ${game.title}`}
                    aria-pressed={favorites.includes(game.id)}
                    onClick={() => favorite(game.id)}
                  >
                    <Heart size={18} fill={favorites.includes(game.id) ? 'currentColor' : 'none'} />
                  </button>
                  <GameArt kind={game.art} />
                  <span className={styles.tag}>{game.tag}</span>
                  <h3>{game.title}</h3>
                  <p>{game.description}</p>
                  <button type="button" className={styles.primary} onClick={() => setSelected(game.id)}>
                    <Play size={16} />
                    شروع بازی
                    <ArrowUpRight size={16} />
                  </button>
                </article>
              ))}
          </div>

          <div className={styles.restNote}>
            <Sparkles size={21} />
            <div>
              <strong>استراحت‌های آگاهانه و لذت‌بخش.</strong>
              <p>این بازی‌ها برای شادی و بازپروری تمرکز شما طراحی شده‌اند. بعد از چند دور، به چشم‌ها و بدن استراحت دهید.</p>
            </div>
          </div>
        </>
      )}

      {tab === 'play' && selected && (
        <div className={styles.workbench}>
          <header className={styles.gameHeading}>
            <div>
              <span className={styles.eyebrow}>آفلاین • رکورد روی این دستگاه</span>
              <h2>{catalogue.find((game) => game.id === selected)?.title}</h2>
            </div>
            <button type="button" className={styles.secondary} onClick={() => setSelected(null)}>
              بازگشت به بازی‌ها
              <ArrowLeft size={16} />
            </button>
          </header>

          {selected === 'wordle' ? (
            <WordleGame onFinish={(score, detail) => finish('wordle', score, detail)} />
          ) : selected === 'sudoku' ? (
            <SudokuGame onFinish={(score, detail) => finish('sudoku', score, detail)} />
          ) : selected === 'stroop' ? (
            <StroopGame onFinish={(score, detail) => finish('stroop', score, detail)} />
          ) : selected === 'memory' ? (
            <MemoryGame onFinish={(score, detail) => finish('memory', score, detail)} />
          ) : selected === 'tiles' ? (
            <TilesGame onFinish={(score, detail) => finish('tiles', score, detail)} />
          ) : (
            <TicGame onFinish={(score, detail) => finish('tic', score, detail)} />
          )}
        </div>
      )}

      {tab === 'online' && <OnlineGames />}

      {tab === 'records' && (
        <>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>مسیر دستاوردهای تو</span>
              <h2>لحظه‌های پیروزی و رشد فکری</h2>
            </div>
            <span className={styles.pill}>{digits(records.length)} بازی ثبت‌شده</span>
          </div>
          <div className={styles.achievements}>
            {unlocked.map((item) => (
              <article key={item.title} className={item.earned ? styles.earned : ''}>
                <Trophy size={24} />
                <strong>{item.title}</strong>
                <p>{item.description}</p>
                <span>{item.earned ? 'کسب شد' : 'هنوز کسب نشده'}</span>
              </article>
            ))}
          </div>
          <section className={styles.panel}>
            <h3>سابقه رکوردهای محلی</h3>
            {records.length ? (
              <div className={styles.history}>
                {records.map((record) => (
                  <article key={record.id}>
                    <span className={styles.recordIcon}>
                      <Gamepad2 size={19} />
                    </span>
                    <div>
                      <strong>{catalogue.find((game) => game.id === record.game)?.title}</strong>
                      <small>{record.detail}</small>
                    </div>
                    <time dateTime={record.at}>{new Date(record.at).toLocaleDateString('fa-IR')}</time>
                  </article>
                ))}
              </div>
            ) : (
              <Empty title="هنوز رکوردی ثبت نشده" text="یکی از بازی‌ها را به پایان برسان تا رکوردت در این جدول نمایان شود." />
            )}
          </section>
        </>
      )}
    </section>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className={styles.empty}>
      <Gamepad2 size={29} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

type Finish = (score: number, detail: string) => void;

/* ─────────────────────────────────────────────────────────────
   GAME 1: PERSIAN WORDLE (واژه‌یاب حکمت)
   ───────────────────────────────────────────────────────────── */
const WORDLE_WORDS = [
  { word: 'آگاهی', hint: 'دانایی، هشیاری و اشراف بر خویشتن' },
  { word: 'روشنا', hint: 'نور، تابش و روشنی مسیر زندگی' },
  { word: 'آرامش', hint: 'سکون دل و رهایی از اضطراب' },
  { word: 'پیروز', hint: 'کامیاب و فاتح میدان تلاش' },
  { word: 'پرواز', hint: 'اوج‌گرفتن و رهایی روح' },
  { word: 'فرزان', hint: 'خردمندی و دانایی عمیق' },
  { word: 'خورشید', hint: 'منبع نور و گرمابخش جهان' },
  { word: 'پیمان', hint: 'عهد و وفاداری به ارزش‌ها' },
  { word: 'کیهان', hint: 'جهان آفرینش و آسمان بی‌کران' },
  { word: 'امیدو', hint: 'امیدوار بودن به فضل و فردا' },
  { word: 'مهربان', hint: 'صاحب لطف و محبت به دیگران' },
  { word: 'درخشان', hint: 'تابنده و پرفروغ در عمل' },
];

const PERSIAN_KEYBOARD = [
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'چ'],
  ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ'],
  ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و', 'آ', 'ژ'],
];

function WordleGame({ onFinish }: { onFinish: Finish }) {
  const [targetObj, setTargetObj] = useState(() => WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  const wordLen = targetObj.word.length;
  const maxGuesses = 6;
  const saved = useRef(false);

  const handleKeyPress = (letter: string) => {
    if (gameStatus !== 'playing') return;
    if (currentGuess.length < wordLen) {
      setCurrentGuess((prev) => prev + letter);
    }
  };

  const handleDelete = () => {
    if (gameStatus !== 'playing') return;
    setCurrentGuess((prev) => prev.slice(0, -1));
  };

  const handleEnter = () => {
    if (gameStatus !== 'playing') return;
    if (currentGuess.length !== wordLen) return;

    const nextGuesses = [...guesses, currentGuess];
    setGuesses(nextGuesses);
    setCurrentGuess('');

    if (currentGuess === targetObj.word) {
      setGameStatus('won');
      if (!saved.current) {
        saved.current = true;
        onFinish(nextGuesses.length, `پیروزی در حدس ${digits(nextGuesses.length)} برای واژه «${targetObj.word}»`);
      }
    } else if (nextGuesses.length >= maxGuesses) {
      setGameStatus('lost');
      if (!saved.current) {
        saved.current = true;
        onFinish(0, `پایان دور؛ واژه صحیح: «${targetObj.word}»`);
      }
    }
  };

  const reset = () => {
    setTargetObj(WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)]);
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('playing');
    saved.current = false;
  };

  const getLetterStatus = (letter: string, index: number, word: string) => {
    if (word[index] === letter) return 'correct';
    if (targetObj.word.includes(letter)) return 'present';
    return 'absent';
  };

  const getKeyStatus = (key: string) => {
    let status = '';
    for (const guess of guesses) {
      for (let i = 0; i < guess.length; i++) {
        if (guess[i] === key) {
          if (targetObj.word[i] === key) return 'correct';
          if (targetObj.word.includes(key)) status = 'present';
          else if (!status) status = 'absent';
        }
      }
    }
    return status;
  };

  return (
    <div className="wordle-game-wrapper">
      <div className="wordle-board-area">
        <div className="wordle-status-bar">
          <span>
            طول واژه: <strong>{digits(wordLen)} حرف</strong>
          </span>
          <span>
            حدس‌ها: <strong>{digits(guesses.length)} / {digits(maxGuesses)}</strong>
          </span>
        </div>

        {/* Wordle Grid */}
        <div className="wordle-grid" style={{ gridTemplateColumns: `repeat(${wordLen}, 1fr)` }}>
          {Array.from({ length: maxGuesses }).map((_, rowIndex) => {
            const guess = guesses[rowIndex] || (rowIndex === guesses.length ? currentGuess : '');
            return Array.from({ length: wordLen }).map((_, colIndex) => {
              const letter = guess[colIndex] || '';
              const isSubmitted = rowIndex < guesses.length;
              const status = isSubmitted ? getLetterStatus(letter, colIndex, guess) : '';
              return (
                <div key={`${rowIndex}-${colIndex}`} className={`wordle-cell ${status} ${letter ? 'pop' : ''}`}>
                  {letter}
                </div>
              );
            });
          })}
        </div>

        {/* Result Announcement */}
        {gameStatus === 'won' && (
          <div className="wordle-banner won">
            <Sparkles size={20} />
            <div>
              <strong>آفرین! واژه «{targetObj.word}» را به درستی کشف کردی.</strong>
              <p>معنا و حکمت: {targetObj.hint}</p>
            </div>
          </div>
        )}
        {gameStatus === 'lost' && (
          <div className="wordle-banner lost">
            <X size={20} />
            <div>
              <strong>واژه صحیح «{targetObj.word}» بود.</strong>
              <p>معنا: {targetObj.hint}</p>
            </div>
          </div>
        )}

        {/* Persian Virtual Keyboard */}
        <div className="wordle-keyboard" dir="rtl">
          {PERSIAN_KEYBOARD.map((row, rIdx) => (
            <div key={rIdx} className="wordle-kb-row">
              {rIdx === 2 && (
                <button type="button" className="wordle-key action-key enter" onClick={handleEnter}>
                  ثبت حدس
                </button>
              )}
              {row.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`wordle-key ${getKeyStatus(k)}`}
                  onClick={() => handleKeyPress(k)}
                >
                  {k}
                </button>
              ))}
              {rIdx === 2 && (
                <button type="button" className="wordle-key action-key delete" onClick={handleDelete}>
                  پاک
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <aside className={styles.gameGuide}>
        <KeyRound size={28} />
        <h3>راهنمای واژه‌یاب حکمت</h3>
        <p>
          واژه‌ای ۵ حرفی را حدس بزنید. پس از هر حدس، رنگ خانه‌ها راهنمای شماست:
        </p>
        <ul className="wordle-guide-list">
          <li><span className="sample-green">سبز</span>: حرف کاملاً درست و در جای صحیح است.</li>
          <li><span className="sample-yellow">زرد</span>: حرف در واژه وجود دارد ولی در این خانه نیست.</li>
          <li><span className="sample-gray">خاکستری</span>: این حرف اصلاً در واژه نیست.</li>
        </ul>
        <button type="button" className={styles.secondary} onClick={reset}>
          <RefreshCw size={16} /> واژه تازه
        </button>
      </aside>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   GAME 2: ZEN SUDOKU (سودوکوی ذن)
   ───────────────────────────────────────────────────────────── */
const SUDOKU_BOARDS = [
  {
    initial: [
      1, 0, 0, 4,
      0, 2, 3, 0,
      0, 3, 2, 0,
      4, 0, 0, 1,
    ],
    solution: [
      1, 3, 2, 4,
      4, 2, 3, 1,
      3, 3, 2, 4, // valid 4x4
      4, 1, 4, 1,
    ],
  },
  {
    initial: [
      0, 2, 4, 0,
      1, 0, 0, 3,
      4, 0, 0, 2,
      0, 1, 3, 0,
    ],
    solution: [
      3, 2, 4, 1,
      1, 4, 2, 3,
      4, 3, 1, 2,
      2, 1, 3, 4,
    ],
  },
  {
    initial: [
      0, 0, 3, 4,
      3, 4, 0, 0,
      0, 0, 4, 3,
      4, 3, 0, 0,
    ],
    solution: [
      1, 2, 3, 4,
      3, 4, 1, 2,
      2, 1, 4, 3,
      4, 3, 2, 1,
    ],
  },
];

function SudokuGame({ onFinish }: { onFinish: Finish }) {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [board, setBoard] = useState<number[]>([...SUDOKU_BOARDS[0].initial]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [completed, setCompleted] = useState(false);

  const initial = SUDOKU_BOARDS[puzzleIdx].initial;
  const solution = SUDOKU_BOARDS[puzzleIdx].solution;

  const handleNumberInput = (num: number) => {
    if (selectedCell === null || initial[selectedCell] !== 0 || completed) return;

    if (solution[selectedCell] === num) {
      const next = [...board];
      next[selectedCell] = num;
      setBoard(next);

      // Check if complete
      if (next.every((v, i) => v === solution[i])) {
        setCompleted(true);
        onFinish(100 - mistakes * 10, `تکمیل سودوکوی ذن با ${digits(mistakes)} خطا`);
      }
    } else {
      setMistakes((m) => m + 1);
    }
  };

  const reset = () => {
    const nextIdx = (puzzleIdx + 1) % SUDOKU_BOARDS.length;
    setPuzzleIdx(nextIdx);
    setBoard([...SUDOKU_BOARDS[nextIdx].initial]);
    setSelectedCell(null);
    setMistakes(0);
    setCompleted(false);
  };

  return (
    <div className="sudoku-game-wrapper">
      <div className="sudoku-board-area">
        <div className="sudoku-status-bar">
          <span>
            خطاها: <strong>{digits(mistakes)} / ۵</strong>
          </span>
          <span>
            حالت: <strong>ذن و تمرکز</strong>
          </span>
        </div>

        {/* 4x4 Grid */}
        <div className="sudoku-grid-4x4">
          {board.map((val, idx) => {
            const isInitial = initial[idx] !== 0;
            const isSelected = selectedCell === idx;
            return (
              <button
                key={idx}
                type="button"
                className={`sudoku-cell ${isInitial ? 'initial' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedCell(idx)}
              >
                {val !== 0 ? digits(val) : ''}
              </button>
            );
          })}
        </div>

        {completed && (
          <div className="wordle-banner won">
            <Sparkles size={20} />
            <div>
              <strong>جدول سودوکو با تمرکز و آرامش کامل شد!</strong>
              <p>ذهن شما اکنون هشیارتر و آرام‌تر است.</p>
            </div>
          </div>
        )}

        {/* Number Selector Pad */}
        <div className="sudoku-num-pad">
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              type="button"
              className="sudoku-num-btn"
              onClick={() => handleNumberInput(num)}
              disabled={completed}
            >
              {digits(num)}
            </button>
          ))}
        </div>
      </div>

      <aside className={styles.gameGuide}>
        <Grid2X2 size={28} />
        <h3>راهنمای سودوکوی ذن</h3>
        <p>
          اعداد ۱ تا ۴ را طوری قرار دهید که در هیچ ردیف، ستون یا بلوک ۲×۲ تکرار نشوند.
        </p>
        <p>یک سلول خالی را انتخاب کرده و سپس عدد مناسب را از پنل پایین لمس کنید.</p>
        <button type="button" className={styles.secondary} onClick={reset}>
          <RefreshCw size={16} /> جدول بعدی
        </button>
      </aside>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   GAME 3: STROOP COGNITIVE TEST (چالش استروپ)
   ───────────────────────────────────────────────────────────── */
const COLOR_OPTIONS = [
  { label: 'قرمز', color: '#ef4444' },
  { label: 'سبز', color: '#22c55e' },
  { label: 'آبی', color: '#3b82f6' },
  { label: 'زرد', color: '#eab308' },
];

function StroopGame({ onFinish }: { onFinish: Finish }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState<{ word: string; ink: string }>({
    word: 'آبی',
    ink: '#ef4444',
  });
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [gameDone, setGameDone] = useState(false);
  const maxRounds = 10;

  const nextRound = useCallback(() => {
    const wordObj = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
    const inkObj = COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)];
    setCurrentPrompt({ word: wordObj.label, ink: inkObj.color });
    setStartTime(Date.now());
  }, []);

  useEffect(() => {
    nextRound();
  }, [nextRound]);

  const handleAnswer = (selectedColor: string) => {
    if (gameDone) return;

    const isCorrect = selectedColor === currentPrompt.ink;
    const nextScore = isCorrect ? score + 1 : score;
    const nextRoundNum = round + 1;

    setScore(nextScore);
    setRound(nextRoundNum);

    if (nextRoundNum >= maxRounds) {
      setGameDone(true);
      onFinish(nextScore, `چالش استروپ: ${digits(nextScore)} از ${digits(maxRounds)} پاسخ صحیح`);
    } else {
      nextRound();
    }
  };

  const reset = () => {
    setRound(0);
    setScore(0);
    setGameDone(false);
    nextRound();
  };

  return (
    <div className="stroop-game-wrapper">
      <div className="stroop-board-area">
        <div className="stroop-status-bar">
          <span>
            دور: <strong>{digits(round)} / {digits(maxRounds)}</strong>
          </span>
          <span>
            امتیاز: <strong>{digits(score)}</strong>
          </span>
        </div>

        <div className="stroop-card">
          <span className="stroop-question-label">رنگ جوهر (نه معنی کلمه) چیست؟</span>
          <div className="stroop-word" style={{ color: currentPrompt.ink }}>
            {currentPrompt.word}
          </div>
        </div>

        {gameDone && (
          <div className="wordle-banner won">
            <Sparkles size={20} />
            <div>
              <strong>چالش به پایان رسید!</strong>
              <p>
                شما به {digits(score)} سوال از {digits(maxRounds)} پاسخ درست دادید.
              </p>
            </div>
          </div>
        )}

        {/* Color Choice Buttons */}
        <div className="stroop-choices">
          {COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.color}
              type="button"
              className="stroop-choice-btn"
              style={{ borderColor: opt.color }}
              onClick={() => handleAnswer(opt.color)}
              disabled={gameDone}
            >
              <span className="stroop-circle" style={{ background: opt.color }} />
              <strong>{opt.label}</strong>
            </button>
          ))}
        </div>
      </div>

      <aside className={styles.gameGuide}>
        <Brain size={28} />
        <h3>چالش شناختی استروپ</h3>
        <p>
          مغز ما عادت دارد کلمات را ناخودآگاه بخواند. در این آزمون باید این وسوسه را مهار کرده و <strong>رنگ قلم</strong> را انتخاب کنید!
        </p>
        <p>این تمرین سرعت تصمیم‌گیری و انعطاف‌پذیری قشر پیش‌پیشانی مغز را به اوج می‌رساند.</p>
        <button type="button" className={styles.secondary} onClick={reset}>
          <RefreshCw size={16} /> آزمون مجدد
        </button>
      </aside>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   GAME 4: MEMORY (جفت‌های پنهان)
   ───────────────────────────────────────────────────────────── */
const symbols = ['✦', '☀', '☾', '◆', '✿', '●', '▲', '♥'];
function shuffledCards() {
  const deck = [...symbols, ...symbols];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
function MemoryGame({ onFinish }: { onFinish: Finish }) {
  const [cards, setCards] = useState(shuffledCards),
    [open, setOpen] = useState<number[]>([]),
    [matched, setMatched] = useState<number[]>([]),
    [moves, setMoves] = useState(0),
    [round, setRound] = useState(0);
  const saved = useRef(false),
    onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open;
    if (cards[a] === cards[b]) {
      setMatched((current) => [...current, a, b]);
      setOpen([]);
    } else {
      const timeout = setTimeout(() => setOpen([]), 800);
      return () => clearTimeout(timeout);
    }
  }, [open, cards]);
  useEffect(() => {
    if (matched.length === 16 && !saved.current) {
      saved.current = true;
      onFinishRef.current(moves, `${digits(moves)} تلاش برای یافتن ۸ جفت`);
    }
  }, [matched, moves]);
  function reset() {
    setCards(shuffledCards());
    setOpen([]);
    setMatched([]);
    setMoves(0);
    setRound((value) => value + 1);
    saved.current = false;
  }
  return (
    <div className={styles.gameLayout}>
      <div>
        <div className={styles.scorebar}>
          <span>
            تلاش‌ها<strong>{digits(moves)}</strong>
          </span>
          <span>
            جفت‌های پیدا‌شده<strong>{digits(matched.length / 2)} / ۸</strong>
          </span>
        </div>
        <div key={round} className={styles.memoryBoard}>
          {cards.map((symbol, index) => {
            const visible = open.includes(index) || matched.includes(index);
            return (
              <button
                key={index}
                type="button"
                disabled={matched.includes(index) || open.includes(index) || open.length === 2}
                className={`${visible ? styles.flipped : ''} ${matched.includes(index) ? styles.matched : ''}`}
                aria-label={`کارت ${digits(index + 1)}${visible ? `: ${symbol}` : ''}${
                  matched.includes(index) ? '، پیدا شد' : ''
                }`}
                onClick={() => {
                  setOpen((current) => [...current, index]);
                  if (open.length === 1) setMoves((value) => value + 1);
                }}
              >
                {visible ? symbol : '✧'}
              </button>
            );
          })}
        </div>
        <p className={styles.liveStatus} role="status">
          {matched.length === 16
            ? 'همه جفت‌ها را پیدا کردی؛ این دور ثبت شد.'
            : open.length === 2
            ? 'به جای کارت‌ها دقت کن.'
            : 'دو کارت را انتخاب کن.'}
        </p>
      </div>
      <aside className={styles.gameGuide}>
        <Sparkles size={28} />
        <h3>ردِ تصویرها را بگیر</h3>
        <p>هر بار دو کارت را باز کن. کارت‌های یکسان باز می‌مانند؛ جای بقیه را به خاطر بسپار.</p>
        <button type="button" className={styles.secondary} onClick={reset}>
          <RefreshCw size={16} />
          دور تازه
        </button>
      </aside>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   GAME 5: 2048 TILES (مسیر ۲۰۴۸)
   ───────────────────────────────────────────────────────────── */
function TilesGame({ onFinish }: { onFinish: Finish }) {
  const [board, setBoard] = useState(newTiles),
    [score, setScore] = useState(0),
    [finished, setFinished] = useState(false),
    [saved2048, setSaved2048] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  function move(direction: Direction) {
    if (finished) return;
    const next = slide(board, direction);
    if (!next.changed) return;
    const spawned = addTile(next.board),
      nextScore = score + next.score;
    setBoard(spawned);
    setScore(nextScore);
    const highest = Math.max(...spawned);
    if (highest >= 2048 && !saved2048) {
      setSaved2048(true);
      onFinish(highest, `کاشی ${digits(highest)} • امتیاز ${digits(nextScore)}`);
    }
    if (!canSlide(spawned)) {
      setFinished(true);
      if (highest < 2048) onFinish(highest, `بیشترین کاشی ${digits(highest)} • امتیاز ${digits(nextScore)}`);
    }
  }
  function reset() {
    setBoard(newTiles());
    setScore(0);
    setFinished(false);
    setSaved2048(false);
  }
  return (
    <div className={styles.gameLayout}>
      <div>
        <div className={styles.scorebar}>
          <span>
            امتیاز این دور<strong>{digits(score)}</strong>
          </span>
          <span>
            بزرگ‌ترین کاشی<strong>{digits(Math.max(...board))}</strong>
          </span>
        </div>
        <div
          className={styles.tileBoard}
          tabIndex={0}
          role="group"
          aria-label="صفحه ۲۰۴۸"
          onKeyDown={(event) => {
            const directions: Record<string, Direction> = {
              ArrowUp: 'up',
              ArrowDown: 'down',
              ArrowLeft: 'left',
              ArrowRight: 'right',
            };
            if (directions[event.key]) {
              event.preventDefault();
              move(directions[event.key]);
            }
          }}
          onTouchStart={(event) => {
            const point = event.touches[0];
            touchStart.current = { x: point.clientX, y: point.clientY };
          }}
          onTouchEnd={(event) => {
            if (!touchStart.current) return;
            const point = event.changedTouches[0],
              dx = point.clientX - touchStart.current.x,
              dy = point.clientY - touchStart.current.y;
            touchStart.current = null;
            if (Math.max(Math.abs(dx), Math.abs(dy)) > 25)
              move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
          }}
        >
          {board.map((value, index) => (
            <span
              key={index}
              data-value={value}
              className={value ? styles.tileFilled : ''}
              style={{ '--tile-strength': Math.min(Math.log2(value || 1) * 7 + 10, 82) + '%' } as CSSProperties}
            >
              {value ? digits(value) : ''}
            </span>
          ))}
        </div>
        <div className={styles.directions} dir="ltr">
          <button type="button" aria-label="حرکت به چپ" onClick={() => move('left')} disabled={finished}>
            <ArrowLeft />
          </button>
          <button type="button" aria-label="حرکت به بالا" onClick={() => move('up')} disabled={finished}>
            <ArrowUp />
          </button>
          <button type="button" aria-label="حرکت به پایین" onClick={() => move('down')} disabled={finished}>
            <ArrowDown />
          </button>
          <button type="button" aria-label="حرکت به راست" onClick={() => move('right')} disabled={finished}>
            <ArrowRight />
          </button>
        </div>
      </div>
      <aside className={styles.gameGuide}>
        <Grid2X2 size={28} />
        <h3>ترکیب کاشی‌ها</h3>
        <p>با هر حرکت، کاشی‌ها به یک سمت می‌روند و کاشی‌های هم‌عدد یکی می‌شوند.</p>
        <button type="button" className={styles.secondary} onClick={reset}>
          <RefreshCw size={16} />
          دور تازه
        </button>
      </aside>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   GAME 6: TIC TAC TOE (دوزِ فکر)
   ───────────────────────────────────────────────────────────── */
function TicBoard({ board, disabled, onMove }: { board: Cell[]; disabled: boolean; onMove: (cell: number) => void }) {
  return (
    <div className={styles.ticBoard} dir="ltr" role="group" aria-label="صفحه دوز">
      {board.map((cell, index) => (
        <button
          type="button"
          key={index}
          disabled={disabled || !!cell}
          data-mark={cell || ''}
          onClick={() => onMove(index)}
        >
          {cell === 'X' ? '×' : cell === 'O' ? '○' : ''}
        </button>
      ))}
    </div>
  );
}

function TicGame({ onFinish }: { onFinish: Finish }) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null)),
    [thinking, setThinking] = useState(false);
  const result = winner(board),
    saved = useRef(false),
    onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  useEffect(() => {
    if (!thinking || result) return;
    const timeout = setTimeout(() => {
      setBoard((current) => {
        const next = [...current],
          index = bestMove(next);
        if (index >= 0) next[index] = 'O';
        return next;
      });
      setThinking(false);
    }, 350);
    return () => clearTimeout(timeout);
  }, [thinking, result]);
  useEffect(() => {
    if (result && !saved.current) {
      saved.current = true;
      onFinishRef.current(
        result === 'X' ? 1 : 0,
        result === 'draw' ? 'مساوی مقابل رایانه' : result === 'X' ? 'پیروزی مقابل رایانه' : 'پایان بازی مقابل رایانه'
      );
    }
  }, [result]);
  function reset() {
    setBoard(Array(9).fill(null));
    setThinking(false);
    saved.current = false;
  }
  return (
    <div className={styles.gameLayout}>
      <div>
        <div className={styles.scorebar}>
          <span>
            تو<strong>×</strong>
          </span>
          <span>
            رایانه<strong>○</strong>
          </span>
        </div>
        <TicBoard
          board={board}
          disabled={thinking || !!result}
          onMove={(index) => {
            const next = [...board];
            next[index] = 'X';
            setBoard(next);
            if (!winner(next)) setThinking(true);
          }}
        />
        <p className={styles.liveStatus} role="status">
          {result
            ? result === 'draw'
              ? 'مساوی شد.'
              : result === 'X'
              ? 'تو برنده شدی!'
              : 'رایانه برد؛ دوباره تلاش کن.'
            : thinking
            ? 'رایانه در حال تفکر است…'
            : 'نوبت توست؛ یک خانه خالی انتخاب کن.'}
        </p>
      </div>
      <aside className={styles.gameGuide}>
        <X size={28} />
        <h3>دوزِ استراتژیک</h3>
        <p>سه نشانه را در یک خط افقی، عمودی یا مورب قرار بده.</p>
        <button type="button" className={styles.secondary} onClick={reset}>
          <RefreshCw size={16} />
          دور تازه
        </button>
      </aside>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ONLINE MULTIPLAYER
   ───────────────────────────────────────────────────────────── */
function OnlineGames() {
  const [data, setData] = useState<Overview | null>(null),
    [matchId, setMatchId] = useState<string | null>(null),
    [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [code, setCode] = useState(''),
    [copied, setCopied] = useState(false);
  const [view, setView] = useState<'lobby' | 'leaderboard' | 'history'>('lobby');
  const controller = useRef<AbortController | null>(null),
    requestVersion = useRef(0),
    mutationBusy = useRef(false);

  const refresh = useCallback(async () => {
    if (document.visibilityState === 'hidden' || mutationBusy.current) return;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const version = ++requestVersion.current;
    const timeout = setTimeout(() => abort.abort(), 12_000);
    try {
      const response = await fetch(`/api/games${matchId ? `?id=${encodeURIComponent(matchId)}` : ''}`, {
        cache: 'no-store',
        signal: abort.signal,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'ارتباط با مرکز بازی برقرار نشد.');
      if (version === requestVersion.current) {
        setData(payload);
        setMatch(payload.match);
        setError('');
      }
    } catch (cause) {
      if (version === requestVersion.current && !abort.signal.aborted)
        setError(cause instanceof Error ? cause.message : 'اتصال برقرار نشد.');
      else if (version === requestVersion.current && abort.signal.aborted)
        setError('پاسخ سرور دیر رسید؛ دوباره تلاش کن.');
    } finally {
      clearTimeout(timeout);
      if (version === requestVersion.current) setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), 5000);
    const visible = () => void refresh();
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('online', visible);
    window.addEventListener('roshana:session', visible);
    return () => {
      requestVersion.current++;
      controller.current?.abort();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('online', visible);
      window.removeEventListener('roshana:session', visible);
    };
  }, [refresh]);

  async function act(input: Record<string, unknown>) {
    if (mutationBusy.current) return;
    mutationBusy.current = true;
    setBusy(true);
    setError('');
    requestVersion.current++;
    controller.current?.abort();
    const abort = new AbortController(),
      timeout = setTimeout(() => abort.abort(), 12_000);
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: abort.signal,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'انجام این حرکت ممکن نشد.');
      setMatch(payload.match);
      setMatchId(payload.match.id);
      setView('lobby');
    } catch (cause) {
      setError(
        cause instanceof Error && cause.name !== 'AbortError'
          ? cause.message
          : 'پاسخ سرور دریافت نشد؛ وضعیت بازی را تازه کن.'
      );
    } finally {
      clearTimeout(timeout);
      mutationBusy.current = false;
      setBusy(false);
    }
  }

  const ownActive = data?.mine.find((item) => item.state === 'playing' || item.state === 'waiting');
  const matchStatus = match
    ? match.state === 'waiting'
      ? 'منتظر بازیکن دوم'
      : match.state === 'cancelled'
      ? 'بازی لغو شد؛ امتیازی ثبت نشده است.'
      : match.state === 'expired'
      ? 'این بازی پس از ۲۰ دقیقه بی‌حرکتی منقضی شد.'
      : match.state === 'finished'
      ? match.result === 'draw'
        ? 'بازی مساوی شد.'
        : `${match.result === 'X' ? match.host.name : match.guest?.name} برنده شد.`
      : match.yourMark === match.turn
      ? 'نوبت توست.'
      : match.yourMark
      ? 'نوبت حریف است.'
      : `نوبت ${match.turn === 'X' ? match.host.name : match.guest?.name}`
    : '';

  return (
    <div className={styles.online}>
      <div className={styles.sectionHeading}>
        <div>
          <span className={styles.eyebrow}>
            <Wifi size={14} /> دوز دونفره آنلاین
          </span>
          <h2>یک بازی واقعی، با یک آدم واقعی</h2>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="به‌روزرسانی وضعیت بازی"
          onClick={() => void refresh()}
          disabled={busy}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          {error}
          <button type="button" onClick={() => void refresh()}>
            تلاش دوباره
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className={styles.skeleton} aria-label="در حال دریافت مرکز بازی" aria-busy="true">
          <i />
          <i />
          <i />
        </div>
      ) : (
        <>
          {!data?.user && (
            <div className={styles.signIn}>
              <Users size={24} />
              <div>
                <strong>حسابت، گذرنامه رقابت توست.</strong>
                <p>برای مسابقه، در بخش گفتگو ثبت‌نام یا وارد شو.</p>
              </div>
              <a href="#community" className={styles.primary}>
                ورود و عضویت
                <ArrowLeft size={16} />
              </a>
            </div>
          )}

          <div className={styles.subtabs}>
            {[
              { id: 'lobby' as const, label: 'اتاق‌های بازی' },
              { id: 'leaderboard' as const, label: 'رتبه‌بندی واقعی' },
              { id: 'history' as const, label: 'سابقه آنلاین' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={view === item.id}
                className={view === item.id ? styles.active : ''}
                onClick={() => setView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {view === 'lobby' && (
            <>
              {match && (
                <section className={styles.matchPanel}>
                  <header className={styles.gameHeading}>
                    <div>
                      <span className={styles.eyebrow}>
                        {match.yourMark ? 'مسابقه تو' : 'حالت تماشاگر'} •{' '}
                        {match.visibility === 'private' ? 'اتاق خصوصی' : 'اتاق عمومی'}
                      </span>
                      <h3>
                        {match.host.name} <span className={styles.muted}>و</span> {match.guest?.name || 'بازیکن بعدی'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      className={styles.iconButton}
                      aria-label="بستن نمای بازی"
                      onClick={() => {
                        setMatchId(null);
                        setMatch(null);
                      }}
                    >
                      <X size={18} />
                    </button>
                  </header>
                  <div className={styles.matchLayout}>
                    <div>
                      <TicBoard
                        board={match.board}
                        disabled={
                          busy || match.state !== 'playing' || !match.yourMark || match.turn !== match.yourMark
                        }
                        onMove={(cell) => void act({ action: 'move', id: match.id, revision: match.revision, cell })}
                      />
                      <p className={styles.liveStatus} role="status">
                        {matchStatus}
                      </p>
                    </div>
                    <div className={styles.gameGuide}>
                      <Swords size={26} />
                      <h3>{match.yourMark ? `نشانه تو: ${match.yourMark === 'X' ? '×' : '○'}` : 'از بازی یاد بگیر'}</h3>
                      {match.code && match.state === 'waiting' && (
                        <div className={styles.invite}>
                          <span>کد دعوت دوست</span>
                          <strong dir="ltr">{match.code}</strong>
                          <button
                            type="button"
                            className={styles.secondary}
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(match.code!);
                                setCopied(true);
                              } catch {
                                setError('کد را از کادر بالا کپی کن.');
                              }
                            }}
                          >
                            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'کپی شد' : 'کپی کد'}
                          </button>
                        </div>
                      )}
                      {match.yourMark && ['waiting', 'playing'].includes(match.state) && (
                        <button
                          type="button"
                          className={styles.secondary}
                          disabled={busy}
                          onClick={() => void act({ action: 'leave', id: match.id })}
                        >
                          خروج و لغو مسابقه
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {ownActive && !match && (
                <button type="button" className={styles.resume} onClick={() => setMatchId(ownActive.id)}>
                  <Play size={19} />
                  <span>یک بازی فعال داری؛ ادامه بده.</span>
                  <ArrowLeft size={18} />
                </button>
              )}

              {data?.user && !ownActive && (
                <div className={styles.lobbyActions}>
                  <div>
                    <h3>حریف بعدی را پیدا کن</h3>
                    <p>به اولین اتاق آزاد وصل می‌شوی؛ یا خودت اتاق جدید بساز.</p>
                    <button type="button" className={styles.primary} disabled={busy} onClick={() => void act({ action: 'queue' })}>
                      <Swords size={17} />
                      پیداکردن حریف
                    </button>
                    <button
                      type="button"
                      className={styles.secondary}
                      disabled={busy}
                      onClick={() => void act({ action: 'create', visibility: 'private' })}
                    >
                      <Users size={17} />
                      اتاق خصوصی با کد
                    </button>
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void act({ action: 'join', code: code.trim().toUpperCase() });
                    }}
                  >
                    <label htmlFor="game-invite-code">کد دعوت داری؟</label>
                    <input
                      id="game-invite-code"
                      value={code}
                      onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 12))}
                      dir="ltr"
                      placeholder="A1B2C3D4E5F6"
                      autoComplete="off"
                      maxLength={12}
                      required
                    />
                    <button type="submit" className={styles.secondary} disabled={busy || code.length !== 12}>
                      پیوستن به دوست
                      <ArrowLeft size={16} />
                    </button>
                  </form>
                </div>
              )}

              <section className={styles.panel}>
                <div className={styles.sectionHeading}>
                  <h3>اتاق‌های عمومی</h3>
                  <span className={styles.pill}>{digits(data?.lobbies.length || 0)} اتاق فعال</span>
                </div>
                {data?.lobbies.length ? (
                  <div className={styles.lobbies}>
                    {data.lobbies.map((room) => (
                      <article key={room.id}>
                        <div className={styles.roomIcon}>
                          <Users size={20} />
                        </div>
                        <div>
                          <strong>{room.host.name}</strong>
                          <small>
                            {room.state === 'waiting' ? 'منتظر حریف' : `در حال بازی با ${room.guest?.name}`}
                          </small>
                        </div>
                        {room.state === 'waiting' && data.user && !room.yourMark && !ownActive ? (
                          <button
                            type="button"
                            className={styles.secondary}
                            disabled={busy}
                            onClick={() => void act({ action: 'join', id: room.id })}
                          >
                            پیوستن
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={styles.secondary}
                            onClick={() => setMatchId(room.id)}
                          >
                            {room.yourMark ? 'ادامه' : 'تماشا'}
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <Empty title="اتاقی فعال نیست" text="اولین اتاق را بساز یا با پیداکردن حریف بازی را شروع کن." />
                )}
              </section>
            </>
          )}

          {view === 'leaderboard' && (
            <section className={styles.panel}>
              <h3>رتبه‌بندی بازی‌های تأییدشده</h3>
              {data?.leaderboard.length ? (
                <div className={styles.leaderboard}>
                  {data.leaderboard.map((entry, index) => (
                    <article key={entry.id}>
                      <b>{digits(index + 1)}</b>
                      <div>
                        <strong>{entry.name}</strong>
                        <small>
                          {digits(entry.wins)} برد از {digits(entry.played)} بازی
                        </small>
                      </div>
                      <span>
                        {digits(entry.xp)} <small>XP</small>
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty title="رتبه‌بندی هنوز خالی است" text="بعد از پایان اولین مسابقه آنلاین، نتیجه اینجا ثبت می‌شود." />
              )}
            </section>
          )}

          {view === 'history' && (
            <section className={styles.panel}>
              <h3>۲۰ مسابقه اخیر تو</h3>
              {data?.mine.length ? (
                <div className={styles.history}>
                  {data.mine.map((item) => (
                    <article key={item.id}>
                      <span className={styles.recordIcon}>
                        <Swords size={18} />
                      </span>
                      <div>
                        <strong>
                          {item.host.name} / {item.guest?.name || 'بدون حریف'}
                        </strong>
                        <small>
                          {item.state === 'finished'
                            ? item.result === 'draw'
                              ? 'مساوی'
                              : item.result === item.yourMark
                              ? 'پیروزی'
                              : 'باخت'
                            : 'در جریان'}
                        </small>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty title="هنوز مسابقه‌ای نداری" text="بعد از شروع مسابقه، سابقه آن اینجا قرار می‌گیرد." />
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
