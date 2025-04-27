// Sound handler for D&D game
class SoundHandler {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.musicTrack = null;
    this.effectsEnabled = true;
    this.musicEnabled = true;
    this.musicVolume = 0.5;
    this.effectsVolume = 0.7;
    
    // Sound mapping
    this.soundMap = {
      // Background music
      "music": {
        "main_theme": "/assets/sounds/main_theme.mp3",
        "combat_theme": "/assets/sounds/combat_theme.mp3",
        "dungeon_theme": "/assets/sounds/dungeon_theme.mp3",
        "cave_theme": "/assets/sounds/cave_theme.mp3",
        "forest_theme": "/assets/sounds/forest_theme.mp3"
      },
      
      // Environmental sounds
      "environment": {
        "rain": "/assets/sounds/rain.mp3",
        "wind": "/assets/sounds/wind.mp3",
        "water": "/assets/sounds/water.mp3",
        "fire": "/assets/sounds/fire.mp3",
        "forest": "/assets/sounds/forest.mp3"
      },
      
      // Sound effects
      "effects": {
        // Movement sounds
        "footstep_grass": "/assets/sounds/footstep_grass.mp3",
        "footstep_stone": "/assets/sounds/footstep_stone.mp3",
        "footstep_water": "/assets/sounds/footstep_water.mp3",
        
        // Combat sounds
        "sword_swing": "/assets/sounds/sword_swing.mp3",
        "arrow_shoot": "/assets/sounds/arrow_shoot.mp3",
        "spell_cast": "/assets/sounds/spell_cast.mp3",
        "monster_growl": "/assets/sounds/monster_growl.mp3",
        
        // Item interaction sounds
        "item_pickup": "/assets/sounds/item_pickup.mp3",
        "potion_drink": "/assets/sounds/potion_drink.mp3",
        "chest_open": "/assets/sounds/chest_open.mp3",
        "door_open": "/assets/sounds/door_open.mp3",
        
        // Dice rolling sounds
        "dice_roll": "/assets/sounds/dice_roll.mp3",
        "dice_d20": "/assets/sounds/dice_d20.mp3",
        
        // Trap sounds
        "trap_triggered": "/assets/sounds/trap_triggered.mp3",
        "trap_alert": "/assets/sounds/trap_alert.mp3",
        
        // UI sounds
        "button_click": "/assets/sounds/button_click.mp3",
        "menu_open": "/assets/sounds/menu_open.mp3",
        "notification": "/assets/sounds/notification.mp3"
      }
    };
  }

  // Initialize audio context
  initialize() {
    try {
      // Create AudioContext
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      console.log("Audio context initialized successfully");
      return true;
    } catch (e) {
      console.error("Failed to initialize audio context:", e);
      return false;
    }
  }

  // Load a sound file
  async loadSound(key, url) {
    if (!this.audioContext) {
      if (!this.initialize()) {
        return false;
      }
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.sounds[key] = audioBuffer;
      console.log(`Sound loaded: ${key}`);
      return true;
    } catch (e) {
      console.error(`Failed to load sound ${key} from ${url}:`, e);
      return false;
    }
  }

  // Play a sound effect
  playSound(key, options = {}) {
    if (!this.effectsEnabled) return null;
    
    const sound = this.sounds[key];
    if (!sound) {
      console.warn(`Sound ${key} not loaded`);
      return null;
    }

    try {
      // Create source
      const source = this.audioContext.createBufferSource();
      source.buffer = sound;
      
      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = options.volume !== undefined ? options.volume : this.effectsVolume;
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Set playback options
      if (options.loop) {
        source.loop = true;
      }
      
      if (options.playbackRate) {
        source.playbackRate.value = options.playbackRate;
      }
      
      // Start playback
      const startTime = options.delay ? this.audioContext.currentTime + options.delay : this.audioContext.currentTime;
      source.start(startTime);
      
      // Return the source for later control
      return source;
    } catch (e) {
      console.error(`Error playing sound ${key}:`, e);
      return null;
    }
  }

  // Play background music
  playMusic(key, options = {}) {
    if (!this.musicEnabled) return null;
    
    // Stop current music if playing
    this.stopMusic();
    
    const music = this.sounds[key];
    if (!music) {
      console.warn(`Music ${key} not loaded`);
      return null;
    }

    try {
      // Create source
      const source = this.audioContext.createBufferSource();
      source.buffer = music;
      
      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = options.volume !== undefined ? options.volume : this.musicVolume;
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Set up looping
      source.loop = options.loop !== undefined ? options.loop : true;
      
      // Start playback
      source.start();
      
      // Save reference to current music track
      this.musicTrack = {
        source,
        gainNode
      };
      
      return this.musicTrack;
    } catch (e) {
      console.error(`Error playing music ${key}:`, e);
      return null;
    }
  }

  // Stop background music
  stopMusic() {
    if (this.musicTrack) {
      try {
        this.musicTrack.source.stop();
      } catch (e) {
        console.warn("Error stopping music:", e);
      }
      this.musicTrack = null;
    }
  }

  // Set music volume
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    if (this.musicTrack) {
      this.musicTrack.gainNode.gain.value = this.musicVolume;
    }
  }

  // Set effects volume
  setEffectsVolume(volume) {
    this.effectsVolume = Math.max(0, Math.min(1, volume));
  }

  // Enable/disable music
  enableMusic(enabled) {
    this.musicEnabled = enabled;
    
    if (!enabled && this.musicTrack) {
      this.stopMusic();
    }
  }

  // Enable/disable sound effects
  enableSoundEffects(enabled) {
    this.effectsEnabled = enabled;
  }

  // Play sound based on terrain type
  playTerrainSound(terrain) {
    switch (terrain) {
      case 'grass':
        return this.playSound('footstep_grass');
      case 'mountain':
      case 'cave':
        return this.playSound('footstep_stone');
      case 'water':
        return this.playSound('footstep_water');
      default:
        return this.playSound('footstep_grass');
    }
  }

  // Play dice roll sound
  playDiceSound(diceType) {
    // Different dice can have different sounds
    if (diceType === 'd20') {
      return this.playSound('dice_d20');
    } else {
      return this.playSound('dice_roll');
    }
  }

  // Play trap sound
  playTrapSound(detected = false) {
    if (detected) {
      return this.playSound('trap_alert');
    } else {
      return this.playSound('trap_triggered');
    }
  }

  // Preload common sounds
  async preloadCommonSounds() {
    // Load essential gameplay sounds
    const promises = [
      this.loadSound('main_theme', this.soundMap.music.main_theme),
      this.loadSound('footstep_grass', this.soundMap.effects.footstep_grass),
      this.loadSound('footstep_stone', this.soundMap.effects.footstep_stone),
      this.loadSound('footstep_water', this.soundMap.effects.footstep_water),
      this.loadSound('dice_roll', this.soundMap.effects.dice_roll),
      this.loadSound('dice_d20', this.soundMap.effects.dice_d20),
      this.loadSound('item_pickup', this.soundMap.effects.item_pickup),
      this.loadSound('trap_triggered', this.soundMap.effects.trap_triggered),
      this.loadSound('trap_alert', this.soundMap.effects.trap_alert)
    ];
    
    return Promise.all(promises);
  }
}

// Export as both a class and a singleton instance
export const soundHandler = new SoundHandler();
export default SoundHandler;
