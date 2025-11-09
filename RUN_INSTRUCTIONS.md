# How to Run PopoAI

## Prerequisites
- Node.js installed
- `.env` file in `Backend/Server/` with `NVIDIA_API_KEY` set

## Step 1: Start the Backend Server

Open Terminal 1 and run:

```bash
cd Backend/Server
npm install  # Only needed first time
npm start
```

The backend should start on port 3001. You should see:
```
Backend running on port 3001
```

## Step 2: Start the Frontend

Open Terminal 2 and run:

```bash
cd /Users/ethancortez/hackathon
npm install  # Only needed first time
npm start
```

The frontend should open automatically in your browser at `http://localhost:3000`

## Step 3: Upload a File

1. On the upload page, click or drag a `.txt` or `.csv` file
2. Click "Send Files"
3. Wait for the analysis to complete
4. You'll see two windows:
   - **Future Receipt Analysis** (top): Shows the ledger with numerical changes
   - **Popo's Receipt Summary** (bottom): Shows the full text analysis

## Example Test File

You can test with the sample file at:
`Backend/Server/test_files/Vendor_Daily_Usage__preview_.csv`

## Troubleshooting

- **Backend won't start**: Check that `.env` file exists in `Backend/Server/` with `NVIDIA_API_KEY`
- **Frontend can't connect**: Make sure backend is running on port 3001
- **No analysis shown**: Check browser console for errors

