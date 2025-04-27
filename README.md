![github-submission-banner](https://github.com/user-attachments/assets/a1493b84-e4e2-456e-a791-ce35ee2bcf2f)

# 🚀 QuestMint

> An immersive web3 gaming platform that combines D&D-style quests with blockchain collectibles

---

## 📌 Problem Statement

**Problem Statement -Build an Al dungeon crawler where Groq powers the narrative generation and Monad
handles item minting and progress tracking.**

---

## 🎯 Objective

QuestMint transforms traditional gaming experiences by integrating blockchain technology to create a meaningful ownership economy. Players can earn, trade, and collect NFT items through D&D-style quests, fostering an engaged community of gamers and creators. Our platform serves both casual gamers looking for engaging experiences and enthusiasts who value digital asset ownership.

---

## 🧠 Team & Approach

### Team Name:  
`ÇZARS`

### Team Members:  
- Hardik (Frontend Developer & designer)
- Aditya Pawar (Block-chain Developer)
- Prateek Sinha (AI Developer)
- Hardik Agrawal (Frontend Developer)

### Our Approach:  
We chose this problem because we saw a gap between engaging gameplay and meaningful asset ownership in the Web3 gaming space. Many blockchain games focus heavily on the financial aspects while neglecting user experience.

Our key breakthrough was developing a hybrid approach that uses AI to enhance storytelling and quest generation while leveraging blockchain for verifiable digital collectibles that have real utility within the game ecosystem.

---

## 🛠️ Tech Stack

### Core Technologies Used:
- **Frontend:** React, TypeScript, CSS3
- **Backend:** Firebase, Python Flask
- **Database:** Firebase Firestore
- **Blockchain:** Solidity, Hardhat, Ethers.js
- **AI:** Groq API, Python
- **Hosting:** Vercel

### Sponsor Technologies Used:
- ✅ **Groq:** AI-powered quest generation and character interactions
- ✅ **Monad:** Smart contracts for NFT items and game assets
- ❌ **Fluvio:** Not implemented
- ❌ **Base:** Not implemented
- ✅ **Screenpipe:** Used terminator for screen capturing and gameplay recording
- ❌ **Stellar:** Not implemented

---

## ✨ Key Features

- ✅ **Interactive Quest Board:** Dynamic quests with AI-generated storylines and challenges
- ✅ **NFT Collectibles:** Earn and trade unique game items backed by blockchain
- ✅ **Community Tavern:** Social hub for players to connect and form parties
- ✅ **Interactive Battle Maps:** Visualize quest locations and plan strategies
- ✅ **Profile Customization:** Create and personalize your adventurer profile

![gameplay-screenshot](src/assets/poke%20battle%2022.jpg)

---

## 📽️ Demo & Deliverables

- **Demo Video Link:** [https://youtu.be/demo-link](https://youtu.be/demo-link)
- **Pitch Deck Link:** [https://slides.com/hackhazards/questmint](https://slides.com/hackhazards/questmint)

---

## ✅ Tasks & Bonus Checklist

- ✅ **All members of the team completed the mandatory task - Followed at least 2 of our social channels and filled the form**
- ❌ **All members of the team completed Bonus Task 1 - Sharing of Badges and filled the form**
- ❌ **All members of the team completed Bonus Task 2 - Signing up for Sprint.dev and filled the form**

---

## 🧪 How to Run the Project

### Requirements:
- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension
- Python 3.9+ (for AI features)
- Git

### Local Setup:

```bash
# Clone the repository
git clone https://github.com/your-repo/hackhazard
cd hackhazard

# Frontend Setup
npm install --legacy-peer-deps

# Create .env file in root directory with Firebase config
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

# Blockchain Setup
cd blockchain
npm install --legacy-peer-deps

# Create .env file in blockchain directory
PRIVATE_KEY=your_wallet_private_key
VERIFY=true
NEXT_PUBLIC_GAME_ITEMS_ADDRESS=your_deployed_contract_address

# AI Setup
cd ../ai
pip install -r requirements.txt

# Create .env file in ai directory
GROQ_API_KEY=your_groq_api_key

# Start the frontend development server (from root directory)
cd ..
npm start

# In a separate terminal, start the AI server
cd ai
python app.py
```

### Connect to Monad Testnet:
1. Add Monad Testnet to MetaMask:
   - Network Name: Monad Testnet
   - RPC URL: https://testnet-rpc.monad.xyz
   - Chain ID: 10143
   - Currency Symbol: MONAD

2. Get test MONAD tokens from the faucet (available on the Monad website)

---

## 🧬 Future Scope

- 📈 **Multiplayer Quests:** Enable real-time collaborative gameplay between players
- 🛡️ **Community-Created Content:** Allow players to create and monetize their own quests and items
- 🌐 **Cross-Chain Integration:** Expand to multiple blockchain networks for wider accessibility
- 🎮 **Mobile App:** Develop companion mobile application for on-the-go gameplay
- 🤖 **Advanced AI NPCs:** Implement more sophisticated AI-driven non-player characters with memory

---

## 📎 Resources / Credits

- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [Hardhat Documentation](https://hardhat.org/getting-started/)
- [Groq API Documentation](https://console.groq.com/docs/quickstart)
- [Monad Testnet Documentation](https://docs.monad.xyz/)
- [Firebase Documentation](https://firebase.google.com/docs)
- Special thanks to the Hackhazard organizers and mentors for their support!

---

## 🏁 Final Words

Our team embraced the challenge of creating a gaming experience that feels familiar to traditional gamers while introducing blockchain benefits in a non-intrusive way. The biggest challenge was balancing complex technologies like AI and blockchain without overwhelming users with technical details. We're excited to continue developing QuestMint and hope it inspires more innovative approaches to gaming!

---
