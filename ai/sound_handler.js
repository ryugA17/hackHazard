/**
 * Sound Handler for D&D Game
 * This script handles playing sound effects and background music
 * for the D&D game based on WebSocket messages.
 */

// Cache for audio elements to avoid creating duplicates
const audioCache = {};

// Volume settings
const settings = {
  masterVolume: 0.5,
  musicVolume: 0.3,
  effectsVolume: 0.7,
  isMuted: false
};

/**
 * Play a sound effect or music
 * @param {string} soundUrl - URL of the sound file to play
 * @param {boolean} isMusic - Whether this is background music (looped)
 * @param {number} volume - Volume level (0.0 to 1.0)
 */
function playSound(soundUrl, isMusic = false, volume = 1.0) {
  // If muted, don't play anything
  if (settings.isMuted) {
    return;
  }
  
  // Calculate actual volume based on settings
  const actualVolume = isMusic 
    ? settings.masterVolume * settings.musicVolume * volume
    : settings.masterVolume * settings.effectsVolume * volume;
  
  // Check if we already have this audio in cache
  if (!audioCache[soundUrl]) {
    // Create new audio element
    const audio = new Audio(soundUrl);
    audio.volume = actualVolume;
    
    // Set looping for music
    if (isMusic) {
      audio.loop = true;
    }
    
    // Store in cache
    audioCache[soundUrl] = audio;
  } else {
    // Update volume of cached audio
    audioCache[soundUrl].volume = actualVolume;
    
    // If it's already playing, don't restart it (especially for music)
    if (isMusic && !audioCache[soundUrl].paused) {
      return;
    }
    
    // For sound effects, reset to beginning
    if (!isMusic) {
      audioCache[soundUrl].currentTime = 0;
    }
  }
  
  // Play the sound
  try {
    const playPromise = audioCache[soundUrl].play();
    
    // Handle play promise (modern browsers return a promise from play())
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error("Error playing sound:", error);
      });
    }
  } catch (error) {
    console.error("Error playing sound:", error);
  }
}

/**
 * Stop a specific sound
 * @param {string} soundUrl - URL of the sound to stop
 */
function stopSound(soundUrl) {
  if (audioCache[soundUrl]) {
    audioCache[soundUrl].pause();
    audioCache[soundUrl].currentTime = 0;
  }
}

/**
 * Stop all sounds
 */
function stopAllSounds() {
  Object.values(audioCache).forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
}

/**
 * Set master volume
 * @param {number} volume - Volume level (0.0 to 1.0)
 */
function setMasterVolume(volume) {
  settings.masterVolume = Math.max(0, Math.min(1, volume));
  updateAllVolumes();
}

/**
 * Set music volume
 * @param {number} volume - Volume level (0.0 to 1.0)
 */
function setMusicVolume(volume) {
  settings.musicVolume = Math.max(0, Math.min(1, volume));
  updateAllVolumes();
}

/**
 * Set sound effects volume
 * @param {number} volume - Volume level (0.0 to 1.0)
 */
function setEffectsVolume(volume) {
  settings.effectsVolume = Math.max(0, Math.min(1, volume));
  updateAllVolumes();
}

/**
 * Toggle mute state
 * @returns {boolean} - New mute state
 */
function toggleMute() {
  settings.isMuted = !settings.isMuted;
  
  if (settings.isMuted) {
    // Mute all sounds without stopping them
    Object.values(audioCache).forEach(audio => {
      audio.muted = true;
    });
  } else {
    // Unmute all sounds
    Object.values(audioCache).forEach(audio => {
      audio.muted = false;
    });
  }
  
  return settings.isMuted;
}

/**
 * Update volumes for all cached audio elements
 */
function updateAllVolumes() {
  Object.entries(audioCache).forEach(([url, audio]) => {
    // Determine if this is music (simple check based on URL)
    const isMusic = url.includes('background') || url.includes('music');
    
    // Set appropriate volume
    audio.volume = isMusic
      ? settings.masterVolume * settings.musicVolume
      : settings.masterVolume * settings.effectsVolume;
  });
}

/**
 * Handle WebSocket message for sound playback
 * @param {Object} message - WebSocket message object
 */
function handleSoundMessage(message) {
  if (message.type === 'play_sound' && message.sound_url) {
    // Determine if this is background music
    const isMusic = message.sound_url.includes('background') || 
                   message.sound_url.includes('music');
    
    // Play the sound
    playSound(message.sound_url, isMusic);
  }
}

// Export functions for use in main game code
window.GameSounds = {
  playSound,
  stopSound,
  stopAllSounds,
  setMasterVolume,
  setMusicVolume,
  setEffectsVolume,
  toggleMute,
  handleSoundMessage
};

console.log("Sound handler initialized");
