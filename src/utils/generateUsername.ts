const adjectives = [
  'Shadow', 'Cyber', 'Ghost', 'Phantom', 'Neon', 'Stealth', 'Void', 
  'Crypto', 'Silent', 'Dark', 'Rogue', 'Mystic', 'Quantum', 'Zero',
  'Binary', 'Pixel', 'Glitch', 'Matrix', 'Vector', 'Code'
];

const nouns = [
  'Fox', 'Wolf', 'Hawk', 'Raven', 'Viper', 'Phoenix', 'Dragon',
  'Knight', 'Ninja', 'Spectre', 'Agent', 'Wanderer', 'Hacker', 'Runner',
  'Byte', 'Node', 'Spark', 'Storm', 'Cipher', 'Echo'
];

export const generateUsername = (): string => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 999);
  return `${adjective}${noun}${number}`;
};

export const generateUserId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};
