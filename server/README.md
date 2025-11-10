# WebCall Server

A simple Node.js server for web call testing.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation

1. Install Node.js from [nodejs.org](https://nodejs.org/)
2. Clone or download this project
3. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will start on `http://localhost:3000` by default.

## API Endpoints

- `GET /` - Welcome message with server info
- `GET /health` - Health check endpoint

## Environment Variables

- `PORT` - Server port (default: 3000)

## Project Structure

```
server/
├── .github/
│   └── copilot-instructions.md
├── index.js          # Main server file
├── package.json      # Project configuration
└── README.md         # This file
```

## Contributing

1. Make your changes
2. Test the server
3. Submit a pull request

## License

ISC