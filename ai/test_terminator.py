import pyautogui
import time
import subprocess
import sys

def focus_window(window_title):
    """Focus the window with the given title"""
    try:
        # For Linux, use xdotool
        if sys.platform.startswith('linux'):
            subprocess.run(['xdotool', 'search', '--name', window_title, 'windowactivate'])
            return True
    except Exception as e:
        print(f"Failed to focus window: {e}")
        return False

def test_window_automation():
    try:
        print("Starting window automation test...")
        
        # Focus the game window
        print("\nAttempting to focus VisualBoyAdvance window...")
        game_window_title = "VisualBoyAdvance"
        if not focus_window(game_window_title):
            print("Failed to focus game window. Please focus the window manually.")
            print("Press Enter when ready...")
            input()
        
        # Get screen size
        screen_width, screen_height = pyautogui.size()
        print(f"Screen size: {screen_width}x{screen_height}")
        
        # Take a screenshot
        screenshot = pyautogui.screenshot()
        print("Screenshot captured successfully")
        
        # Add delay before starting key presses
        print("\nStarting key tests in 3 seconds...")
        time.sleep(3)
        
        # Test game controls with actual key presses
        print("\nTesting game controls:")
        controls = {
            'up': 'w',
            'down': 's',
            'left': 'a',
            'right': 'd',
            'A button': 'z',
            'B button': 'x',
            'Start': 'enter',
            'Select': 'backspace'
        }
        
        # First, test just directional controls
        print("\nTesting directional controls...")
        directional = ['up', 'right', 'down', 'left']
        for direction in directional:
            key = controls[direction]
            print(f"Pressing {direction} ({key})")
            pyautogui.keyDown(key)
            time.sleep(0.2)  # Hold key briefly
            pyautogui.keyUp(key)
            time.sleep(0.3)  # Wait between presses
            
        # Ask for confirmation before testing action buttons
        print("\nDirectional controls tested. Press Enter to test action buttons, or Ctrl+C to abort...")
        input()
        
        # Test action buttons
        action_buttons = ['A button', 'B button', 'Start', 'Select']
        for action in action_buttons:
            key = controls[action]
            print(f"Pressing {action} ({key})")
            pyautogui.keyDown(key)
            time.sleep(0.2)  # Hold key briefly
            pyautogui.keyUp(key)
            time.sleep(0.3)  # Wait between presses
        
        print("\nWindow automation test completed successfully")
            
    except Exception as e:
        print(f"Error during window automation test: {e}")

if __name__ == "__main__":
    # Add a 3 second delay before starting
    print("Starting in 3 seconds...")
    time.sleep(3)
    
    # Enable fail-safe (move mouse to corner to abort)
    pyautogui.FAILSAFE = True
    print("Fail-safe enabled: Move mouse to screen corner to abort")
    
    test_window_automation()
