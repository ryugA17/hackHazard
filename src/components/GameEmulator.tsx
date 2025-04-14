import React from 'react';
import './GameEmulator.css';

// Define the IodineGBA interface
interface IodineGBAType {
  attachCanvas: (canvas: HTMLCanvasElement) => void;
  play: () => void;
  pause: () => void;
  setCoreOptions: (options: object) => void;
  loadROMFromBuffer: (buffer: ArrayBuffer, filename: string) => Promise<void>;
}

declare global {
  interface Window {
    IodineGBA: IodineGBAType;
    keyZones: any;
    Iodine: any;
  }
}

const GameEmulator: React.FC = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Load the necessary scripts
    const loadScripts = async () => {
      try {
        // Load the emulator scripts
        const scripts = [
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/includes/TypedArrayShim.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/Cartridge.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/DMA.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/Emulator.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/Graphics.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/RunLoop.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/Memory.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/IRQ.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/JoyPad.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/Serial.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/Sound.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/Timer.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/Wait.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/CPU.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/Saves.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/sound/FIFO.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/sound/Channel1.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/sound/Channel2.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/sound/Channel3.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/sound/Channel4.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/CPU/ARM.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/CPU/THUMB.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/CPU/CPSR.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/graphics/Renderer.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/graphics/Background.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/graphics/Mosaic.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/graphics/OBJ.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/graphics/OBJWindow.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/graphics/Window.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/graphics/BlendEffects.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/core/graphics/Fade.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/IodineGBA/IodineGBA.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/IodineGBA/GameBoyAdvanceCartridgeCore.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/IodineGBA/GameBoyAdvanceDMACore.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/IodineGBA/GameBoyAdvanceEmulatorCore.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/IodineGBA/GameBoyAdvanceGraphicsCore.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/IodineGBA/GameBoyAdvanceJoyPadCore.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/IodineGBA/GameBoyAdvanceMemoryCore.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/IodineGBA/GameBoyAdvanceIRQCore.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/IodineGBA/GameBoyAdvanceRunLoop.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/IodineGBA/GameBoyAdvanceSoundCore.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/IodineGBA/GameBoyAdvanceTimerCore.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/IodineGBA/GameBoyAdvanceWaitCore.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/IodineGBA/GameBoyAdvanceCPUCore.js',
          'https://cdn.jsdelivr.net/gh/taisel/IodineGBA@master/IodineGBA/GameBoyAdvanceSavesCore.js'
        ];

        for (const scriptSrc of scripts) {
          await loadScript(scriptSrc);
        }

        // Configure the emulator
        if (window.IodineGBA && canvasRef.current) {
          window.IodineGBA.attachCanvas(canvasRef.current);
          window.IodineGBA.setCoreOptions({
            sound: true,
            volume: 1,
            skipBoot: true,
            toggleSmoothScaling: true,
            toggleDynamicSpeed: false,
            toggleOffthreadGraphics: true,
            toggleOffthreadCPU: false
          });

          // Fetch and load the ROM
          await loadPokemonFireRed();
          
          setIsLoading(false);
        } else {
          setError('Failed to initialize the emulator');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading emulator:', err);
        setError('Error loading the emulator');
        setIsLoading(false);
      }
    };

    loadScripts();

    // Clean up on component unmount
    return () => {
      if (window.IodineGBA) {
        window.IodineGBA.pause();
      }
    };
  }, []);

  // Helper function to load a script
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (error) => reject(error);
      document.body.appendChild(script);
    });
  };

  // Function to load the Pokémon FireRed ROM
  const loadPokemonFireRed = async () => {
    try {
      // First, check if the ROM exists in the public directory
      let romBuffer: ArrayBuffer;
      
      try {
        const response = await fetch('/roms/pokemon_firered.gba');
        if (response.ok) {
          romBuffer = await response.arrayBuffer();
        } else {
          throw new Error('ROM not found');
        }
      } catch (err) {
        // If the ROM doesn't exist, show a file input for the user to upload their own ROM
        setError('ROM not found. Please upload your own Pokémon FireRed ROM file.');
        setIsLoading(false);
        return;
      }
      
      await window.IodineGBA.loadROMFromBuffer(romBuffer, 'pokemon_firered.gba');
      console.log('ROM loaded successfully');
    } catch (err) {
      console.error('Error loading ROM:', err);
      setError('Failed to load the Pokémon FireRed ROM');
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (event.target?.result instanceof ArrayBuffer) {
          try {
            await window.IodineGBA.loadROMFromBuffer(event.target.result, file.name);
            console.log('ROM loaded successfully');
            setIsLoading(false);
          } catch (err) {
            console.error('Error loading ROM:', err);
            setError('Failed to load the ROM file. Make sure it is a valid GBA ROM.');
            setIsLoading(false);
          }
        }
      };
      
      reader.onerror = () => {
        setError('Error reading the file. Please try again.');
        setIsLoading(false);
      };
      
      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('Error handling file upload:', err);
      setError('Error processing the file. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle play/pause
  const togglePlay = () => {
    if (window.IodineGBA) {
      if (isPlaying) {
        window.IodineGBA.pause();
      } else {
        window.IodineGBA.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="game-emulator">
      <div className="game-container">
        <div className="game-header">
          <h2>Pokémon FireRed</h2>
          {error && <p className="error-message">{error}</p>}
        </div>
        
        {isLoading ? (
          <div className="loading-spinner">
            <p>Loading Game Boy Advance Emulator...</p>
            <div className="spinner"></div>
          </div>
        ) : error && error.includes('ROM not found') ? (
          <div className="rom-upload">
            <p>Please upload your own Pokémon FireRed ROM file:</p>
            <input 
              type="file" 
              accept=".gba" 
              onChange={handleFileUpload}
              className="file-input"
            />
            <p className="upload-note">Note: You must legally own the game to use this feature.</p>
          </div>
        ) : (
          <>
            <canvas 
              ref={canvasRef} 
              className="gba-screen"
              width={240}
              height={160}
            />
            
            <div className="game-controls">
              <button className="control-btn" onClick={togglePlay}>
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              
              <div className="control-info">
                <h3>Controls:</h3>
                <p>Arrow Keys: D-Pad</p>
                <p>Z: A button</p>
                <p>X: B button</p>
                <p>A: L button</p>
                <p>S: R button</p>
                <p>Enter: Start</p>
                <p>Backspace: Select</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GameEmulator; 