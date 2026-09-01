const WORDS: string[] = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'with',
  'for', 'not', 'on', 'this', 'but', 'from', 'they', 'you', 'do', 'at',
  'as', 'was', 'we', 'are', 'his', 'her', 'will', 'said', 'each', 'can',
  'like', 'time', 'just', 'know', 'make', 'more', 'than', 'then', 'them',
  'some', 'been', 'when', 'who', 'which', 'there', 'their', 'what', 'about',
  'after', 'because', 'would', 'could', 'your', 'into', 'year', 'good',
  'first', 'work', 'world', 'well', 'way', 'new', 'now', 'how', 'get',
  'only', 'over', 'come', 'back', 'look', 'two', 'other', 'people', 'see',
  'may', 'most', 'use', 'make', 'give', 'great', 'very', 'think', 'things',
  'right', 'left', 'hand', 'head', 'eyes', 'found', 'still', 'live', 'real',
  'name', 'next', 'never', 'night', 'open', 'room', 'city', 'light', 'long',
  'love', 'mind', 'money', 'move', 'music', 'need', 'news', 'once', 'page',
  'pass', 'play', 'read', 'safe', 'save', "school", 'short', 'slow', 'small',
  'soft', 'song', 'sound', 'speak', 'stand', 'start', 'state', 'story',
  'strong', 'street', 'study', 'sure', 'table', 'take', 'talk', 'test',
  'text', 'thing', 'three', 'today', 'told', 'tonight', 'town', 'travel',
  'tree', 'true', 'turn', 'under', 'until', 'voice', 'wait', 'walk', 'watch',
  'water', 'week', 'white', 'whole', 'window', 'woman', 'word', 'worker',
  'write', 'wrong', 'young', 'zone', 'type', 'fight', 'speed', 'score',
  'combo', 'letter', 'energy', 'power', 'fever', 'fury', 'dragon', 'ninja',
  'samurai', 'shadow', 'arena', 'battle', 'warrior', 'attack', 'shield',
  'strike', 'punch', 'kick', 'block', 'dodge', 'quest', 'guard', 'hero',
  'village', 'forest', 'mountain', 'river', 'bridge', 'cave', 'castle',
  'tower', 'gate', 'portal', 'token', 'potion', 'sword', 'blade', 'dark',
];

export function getRandomWord(exclude?: string): string {
  let word = '';
  let guard = 0;
  do {
    word = WORDS[Math.floor(Math.random() * WORDS.length)];
    guard++;
  } while (exclude !== undefined && word === exclude && guard < 20);
  return word;
}

export const PRACTICE_WORD_COUNT = WORDS.length;