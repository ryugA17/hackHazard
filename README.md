# HackHazard

This is a React/TypeScript clone of the Codedex coding education platform's landing page with blockchain integration.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension
- Git

## Project Structure

```
.
├── blockchain/     # Smart contract code
├── src/           # React frontend code
└── ai/            # AI integration code
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd codedex-clone
```

### 2. Frontend Setup

Install the frontend dependencies:
```bash
npm install --legacy-peer-deps
```

> **Note:** The `--legacy-peer-deps` flag is required due to TypeScript version conflicts between the project (using TypeScript 4.9.x) and blockchain libraries (requiring TypeScript >=5.0.4). This flag allows npm to ignore peer dependency conflicts and install packages anyway.

Create a `.env` file in the root directory:
```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

### 3. Blockchain Setup

Navigate to the blockchain directory and install dependencies:
```bash
cd blockchain
npm install --legacy-peer-deps
```

Create a `.env` file in the blockchain directory:
```env
PRIVATE_KEY=your_wallet_private_key
VERIFY=true
NEXT_PUBLIC_GAME_ITEMS_ADDRESS=your_deployed_contract_address
```

### 4. AI Setup (Optional)

If you want to use the AI features, navigate to the AI directory and install Python dependencies:
```bash
cd ai
pip install -r requirements.txt
```

Create a `.env` file in the ai directory:
```env
GROQ_API_KEY=your_groq_api_key
```

## Running the Application

1. Start the frontend development server:
```bash
# From the root directory
npm start
```

2. Deploy the smart contracts (if needed):
```bash
# From the blockchain directory
npx hardhat run scripts/deploy.ts --network monadTestnet
```

3. Run the AI service (if needed):
```bash
# From the ai directory
python app.py
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Connecting to Monad Testnet

1. Add Monad Testnet to MetaMask:
   - Network Name: Monad Testnet
   - RPC URL: https://testnet-rpc.monad.xyz
   - Chain ID: 10143
   - Currency Symbol: MONAD

2. Get some test MONAD tokens from the faucet (link to be provided)

## Development

- Frontend code is in the `src` directory
- Smart contracts are in the `blockchain/contracts` directory
- AI integration code is in the `ai` directory

## Testing

```bash
# Frontend tests
npm test

# Smart contract tests
cd blockchain
npx hardhat test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details
