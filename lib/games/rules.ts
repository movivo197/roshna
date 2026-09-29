export type Mark = 'X' | 'O';
export type Cell = Mark | null;
export type Result = Mark | 'draw' | null;
const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

export function winner(board: Cell[]): Result {
  for (const [a,b,c] of lines) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  return board.every(Boolean) ? 'draw' : null;
}

export function bestMove(board: Cell[]): number {
  function evaluate(position: Cell[], turn: Mark, depth: number): number {
    const result = winner(position);
    if (result) return result === 'O' ? 10-depth : result === 'X' ? depth-10 : 0;
    const values = position.flatMap((cell,index) => {
      if (cell) return [];
      const next = [...position]; next[index] = turn;
      return [evaluate(next, turn === 'O' ? 'X' : 'O', depth+1)];
    });
    return turn === 'O' ? Math.max(...values) : Math.min(...values);
  }
  let best = -Infinity, selected = -1;
  for (const index of [4,0,2,6,8,1,3,5,7]) {
    if (board[index]) continue;
    const next = [...board]; next[index] = 'O';
    const score = evaluate(next,'X',0);
    if (score > best) { best = score; selected = index; }
  }
  return selected;
}

export type Direction = 'up'|'down'|'left'|'right';
export function slide(board: number[], direction: Direction): {board:number[];score:number;changed:boolean} {
  const result = [...board]; let score = 0;
  for (let line = 0; line < 4; line++) {
    let indexes = Array.from({length:4},(_,index) => direction === 'left' || direction === 'right' ? line*4+index : index*4+line);
    if (direction === 'right' || direction === 'down') indexes = indexes.reverse();
    const values = indexes.map(index => board[index]).filter(Boolean), merged:number[] = [];
    for (let index = 0; index < values.length; index++) {
      if (values[index] === values[index+1]) { const value = values[index]*2; merged.push(value); score += value; index++; }
      else merged.push(values[index]);
    }
    indexes.forEach((index,offset) => { result[index] = merged[offset] || 0; });
  }
  return {board:result,score,changed:result.some((value,index) => value !== board[index])};
}

export function addTile(board:number[]):number[] {
  const empty = board.flatMap((value,index) => value ? [] : [index]);
  if (!empty.length) return board;
  const result = [...board]; result[empty[Math.floor(Math.random()*empty.length)]] = Math.random() < .9 ? 2 : 4;
  return result;
}
export function newTiles():number[] { return addTile(addTile(Array(16).fill(0))); }
export function canSlide(board:number[]):boolean { return (['up','down','left','right'] as const).some(direction => slide(board,direction).changed); }

export type Tournament = {
  id:string; title:string; game:'tic-tac-toe'; state:'draft'|'registration'|'live'|'finished'|'cancelled';
  startsAt:string; capacity:number; organizerId:string; format:'round-robin'|'single-elimination';
  rounds:{index:number; matchIds:string[]}[];
};
export type GameTransport = {
  kind:'polling'|'websocket';
  subscribe:(matchId:string,onRevision:(revision:number)=>void)=>()=>void;
};
