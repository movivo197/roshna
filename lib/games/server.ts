import 'server-only';
import {randomBytes,randomUUID} from 'node:crypto';
import {getDb,isBlocked,HttpError,addNotification,type Member} from '../server/platform';
import {winner,type Cell} from './rules';

type MatchRow = {id:string;code:string;host_id:string;guest_id:string|null;visibility:string;state:string;board:string;turn:string;result:string|null;revision:number;created_at:string;updated_at:string;host_name:string;guest_name:string|null};
const selectMatch = `SELECT g.*,h.display_name AS host_name,p.display_name AS guest_name FROM game_matches g JOIN members h ON h.id=g.host_id LEFT JOIN members p ON p.id=g.guest_id`;
const initialized = new WeakSet<ReturnType<typeof getDb>>();

export function gameDb() {
  const db = getDb();
  if (!initialized.has(db)) { db.exec(`
    CREATE TABLE IF NOT EXISTS game_matches (
      id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, host_id TEXT NOT NULL REFERENCES members(id),
      guest_id TEXT REFERENCES members(id), visibility TEXT NOT NULL CHECK(visibility IN ('public','private')),
      state TEXT NOT NULL CHECK(state IN ('waiting','playing','finished','cancelled','expired')),
      board TEXT NOT NULL DEFAULT '[null,null,null,null,null,null,null,null,null]', turn TEXT NOT NULL DEFAULT 'X',
      result TEXT, revision INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS game_matches_state ON game_matches(state,created_at);
    CREATE INDEX IF NOT EXISTS game_matches_host ON game_matches(host_id,state);
    CREATE INDEX IF NOT EXISTS game_matches_guest ON game_matches(guest_id,state);
    CREATE TABLE IF NOT EXISTS game_moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT, match_id TEXT NOT NULL REFERENCES game_matches(id),
      member_id TEXT NOT NULL REFERENCES members(id), cell INTEGER NOT NULL, revision INTEGER NOT NULL,
      created_at TEXT NOT NULL, UNIQUE(match_id,revision)
    );
    CREATE TABLE IF NOT EXISTS game_rewards (
      match_id TEXT NOT NULL REFERENCES game_matches(id), member_id TEXT NOT NULL REFERENCES members(id),
      xp INTEGER NOT NULL, outcome TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(match_id,member_id)
    );
  `); initialized.add(db); }
  const cutoff = new Date(Date.now()-20*60*1000).toISOString();
  db.prepare("UPDATE game_matches SET state='expired',revision=revision+1 WHERE state IN ('waiting','playing') AND updated_at<?").run(cutoff);
  return db;
}

function getMatch(id:string):MatchRow {
  const row = gameDb().prepare(`${selectMatch} WHERE g.id=?`).get(id) as MatchRow|undefined;
  if (!row) throw new HttpError(404,'این بازی پیدا نشد.');
  return row;
}

function publicMatch(row:MatchRow,viewer?:string) {
  const participant = row.host_id === viewer || row.guest_id === viewer;
  return {id:row.id,code:participant?row.code:undefined,host:{id:row.host_id,name:row.host_name},guest:row.guest_id?{id:row.guest_id,name:row.guest_name}:null,
    visibility:row.visibility,state:row.state,board:JSON.parse(row.board) as Cell[],turn:row.turn,result:row.result,revision:row.revision,createdAt:row.created_at,updatedAt:row.updated_at,
    yourMark:row.host_id === viewer?'X':row.guest_id === viewer?'O':null};
}

function blocked(row:MatchRow,viewer?:string) {
  if(getDb().prepare('SELECT 1 FROM members WHERE id IN (?,?) AND suspended=1').get(row.host_id,row.guest_id))return true;
  return !!viewer && (isBlocked(viewer,row.host_id) || (!!row.guest_id && isBlocked(viewer,row.guest_id)));
}

export function gameOverview(user:Member|null,id?:string) {
  const db = gameDb();
  let match = null;
  if (id) {
    const row = getMatch(id);
    if (blocked(row,user?.id) || (row.visibility === 'private' && row.host_id !== user?.id && row.guest_id !== user?.id)) throw new HttpError(403,'این بازی برای شما قابل مشاهده نیست.');
    match = publicMatch(row,user?.id);
  }
  const publicRows = db.prepare(`${selectMatch} WHERE g.visibility='public' AND g.state IN ('waiting','playing') ORDER BY g.created_at DESC LIMIT 50`).all() as MatchRow[];
  const myRows = user ? db.prepare(`${selectMatch} WHERE (g.host_id=? OR g.guest_id=?) ORDER BY g.created_at DESC LIMIT 20`).all(user.id,user.id) as MatchRow[] : [];
  const leaderboard = db.prepare(`SELECT m.id,m.display_name AS name,SUM(r.xp) AS xp,COUNT(*) AS played,SUM(CASE WHEN r.outcome='win' THEN 1 ELSE 0 END) AS wins FROM game_rewards r JOIN members m ON m.id=r.member_id WHERE m.suspended=0 GROUP BY m.id ORDER BY xp DESC,wins DESC,m.id LIMIT 20`).all().filter(row=>!user||!isBlocked(user.id,String(row.id)));
  return {user:user?{id:user.id,displayName:user.displayName}:null,match,lobbies:publicRows.filter(row=>!blocked(row,user?.id)).map(row=>publicMatch(row,user?.id)),mine:myRows.map(row=>publicMatch(row,user?.id)),leaderboard};
}

function ensureAvailable(userId:string) {
  const current = gameDb().prepare("SELECT id FROM game_matches WHERE (host_id=? OR guest_id=?) AND state IN ('waiting','playing') LIMIT 1").get(userId,userId);
  if (current) throw new HttpError(409,'ابتدا بازی فعال خود را تمام کنید یا از آن خارج شوید.');
}

function join(row:MatchRow,user:Member) {
  if (row.state !== 'waiting' || row.guest_id) throw new HttpError(409,'این اتاق دیگر منتظر بازیکن نیست.');
  if (row.host_id === user.id) return publicMatch(row,user.id);
  if (blocked(row,user.id)) throw new HttpError(403,'امکان پیوستن به این اتاق وجود ندارد.');
  ensureAvailable(user.id);
  const db=gameDb();
  db.prepare("UPDATE game_matches SET guest_id=?,state='playing',revision=revision+1,updated_at=? WHERE id=? AND state='waiting'").run(user.id,new Date().toISOString(),row.id);
  addNotification(row.host_id,{kind:'game',title:`${user.displayName} به بازی دوز شما پیوست.`,href:'/#games'});
  return publicMatch(getMatch(row.id),user.id);
}

export function startGame(user:Member,action:'create'|'queue'|'join',visibility:'public'|'private',code?:string,id?:string) {
  const db=gameDb(); db.exec('BEGIN IMMEDIATE');
  try {
    let result;
    if (action === 'join') {
      const row=db.prepare(`${selectMatch} WHERE ${code?'g.code':'g.id'}=?`).get(code || id || '') as MatchRow|undefined;
      if (!row) throw new HttpError(404,'کد یا اتاق معتبر نیست؛ از دوست خود کد تازه بگیرید.');
      if (row.visibility === 'private' && !code && row.host_id !== user.id) throw new HttpError(403,'ورود به اتاق خصوصی به کد دعوت نیاز دارد.');
      result=join(row,user);
    } else {
      ensureAvailable(user.id);
      const candidates = action === 'queue' ? db.prepare(`${selectMatch} WHERE g.state='waiting' AND g.visibility='public' AND g.host_id<>? ORDER BY g.created_at LIMIT 100`).all(user.id) as MatchRow[] : [];
      const candidate=candidates.find(row=>!blocked(row,user.id));
      if (candidate) result=join(candidate,user);
      else {
        const matchId=randomUUID(),invite=randomBytes(6).toString('hex').toUpperCase(),now=new Date().toISOString();
        db.prepare("INSERT INTO game_matches(id,code,host_id,visibility,state,created_at,updated_at) VALUES(?,?,?,?,'waiting',?,?)").run(matchId,invite,user.id,action==='queue'?'public':visibility,now,now);
        result=publicMatch(getMatch(matchId),user.id);
      }
    }
    db.exec('COMMIT'); return result;
  } catch(error) { db.exec('ROLLBACK'); throw error; }
}

export function moveGame(user:Member,id:string,cell:number,revision:number) {
  const db=gameDb(); db.exec('BEGIN IMMEDIATE');
  try {
    const row=getMatch(id),mark=row.host_id===user.id?'X':row.guest_id===user.id?'O':null;
    if (!mark || blocked(row,user.id)) throw new HttpError(403,'شما بازیکن این مسابقه نیستید یا ارتباط مسدود شده است.');
    if (row.state !== 'playing' || row.turn !== mark || row.revision !== revision) throw new HttpError(409,'نوبت یا وضعیت بازی تغییر کرده؛ صفحه بازی به‌روز می‌شود.');
    const board=JSON.parse(row.board) as Cell[];
    if (!Number.isInteger(cell) || cell<0 || cell>8 || board[cell]) throw new HttpError(400,'خانه انتخاب‌شده آزاد نیست.');
    board[cell]=mark;
    const result=winner(board),now=new Date().toISOString();
    db.prepare('UPDATE game_matches SET board=?,turn=?,result=?,state=?,revision=revision+1,updated_at=? WHERE id=?').run(JSON.stringify(board),mark==='X'?'O':'X',result,result?'finished':'playing',now,id);
    db.prepare('INSERT INTO game_moves(match_id,member_id,cell,revision,created_at) VALUES(?,?,?,?,?)').run(id,user.id,cell,row.revision+1,now);
    if (result && row.guest_id) {
      for (const [memberId,playerMark] of [[row.host_id,'X'],[row.guest_id,'O']]) {
        // Only the first three completed matches against the same opponent per UTC day earn XP.
        const rewarded = db.prepare(`SELECT COUNT(*) AS n FROM game_rewards r JOIN game_matches g ON g.id=r.match_id WHERE r.member_id=? AND r.xp>0 AND r.created_at>=? AND ((g.host_id=? AND g.guest_id=?) OR (g.host_id=? AND g.guest_id=?))`).get(memberId,now.slice(0,10),row.host_id,row.guest_id,row.guest_id,row.host_id) as {n:number};
        const outcome=result==='draw'?'draw':result===playerMark?'win':'loss';
        const xp=rewarded.n>=3?0:outcome==='win'?20:outcome==='draw'?8:3;
        const inserted=db.prepare('INSERT OR IGNORE INTO game_rewards(match_id,member_id,xp,outcome,created_at) VALUES(?,?,?,?,?)').run(id,memberId,xp,outcome,now);
        if (inserted.changes && xp) db.prepare('UPDATE members SET xp=xp+? WHERE id=?').run(xp,memberId);
        addNotification(memberId,{kind:'game',title:`مسابقه دوز تمام شد؛ ${xp.toLocaleString('fa-IR')} امتیاز بازی دریافت کردید.`,href:'/#games'});
      }
    }
    db.exec('COMMIT'); return publicMatch(getMatch(id),user.id);
  } catch(error) { db.exec('ROLLBACK'); throw error; }
}

export function leaveGame(user:Member,id:string) {
  const db=gameDb(),row=getMatch(id);
  if (row.host_id!==user.id && row.guest_id!==user.id) throw new HttpError(403,'این بازی متعلق به شما نیست.');
  if (!['waiting','playing'].includes(row.state)) return publicMatch(row,user.id);
  db.prepare("UPDATE game_matches SET state='cancelled',revision=revision+1,updated_at=? WHERE id=?").run(new Date().toISOString(),id);
  return publicMatch(getMatch(id),user.id);
}
