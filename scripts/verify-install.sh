# Check Node.js version
node --version

# Check npm version
npm --version

# Check Python version
python --version

# Check Hardhat installation
cd blockchain
npx hardhat --version
cd ..

# Check AI dependencies
cd ai
source myenv/bin/activate  # or myenv\Scripts\activate on Windows
python -c "import groq; import cv2; import numpy; print('AI dependencies installed successfully')"
cd ..