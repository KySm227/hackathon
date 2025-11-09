# 🚀 PopoAI - Intelligent Receipt Analysis for Small Businesses

[![Demo Video](https://img.shields.io/badge/📹-Watch%20Demo-red?style=for-the-badge)](#demo-video)

> **Watch the full demo video below:**

<div align="center">

### 🎬 Project Demo

<video width="800" controls>
  <source src="./demo.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

**Alternative:** [Download the demo video](./demo.mp4)

</div>

---

## 📖 Table of Contents

- [Inspiration](#-inspiration)
- [What it does](#-what-it-does)
- [How it works](#-how-it-works)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Setup](#-api-setup)
- [How we built it](#-how-we-built-it)
- [Challenges](#-challenges)
- [Accomplishments](#-accomplishments)
- [What we learned](#-what-we-learned)
- [What's next](#-whats-next)

---

## 💡 Inspiration

Small businesses often struggle to track spending patterns and inventory needs from piles of work order receipts. We wanted to build a smart assistant that not only reads those receipts but also provides actionable insights — helping owners make data-driven decisions about what to buy more of and where to cut costs.

---

## ✨ What it does

PopoAI analyzes uploaded work order receipts and generates real-time advice on inventory management and spending optimization. It suggests which items should be restocked, which ones to reduce spending on, and produces a generated receipt summary that visually lists all recommendations.

### Key Features:
- 📄 **Multi-file upload** - Drag and drop or select multiple receipt files (.txt, .csv)
- 🤖 **AI-Powered Analysis** - Uses NVIDIA Nemotron to intelligently parse and analyze receipt data
- 📊 **Prioritized Recommendations** - Automatically prioritizes essential business expenses
- 📈 **Business Context Awareness** - Infers business type (restaurant, office, retail) from receipt items
- 🔄 **Real-time Updates** - Continuously updates analysis as new files are added
- 📋 **Scrollable Summary** - View detailed AI-generated recommendations in an easy-to-read format

---

## 🔄 How it works

### File Processing Pipeline

1. **File Upload**: Users upload receipt files (.txt or .csv format) through the web interface
2. **File Parsing**: The backend reads and parses the receipt data, extracting item descriptions, quantities, and costs
3. **AI Analysis**: The parsed data is sent to NVIDIA Nemotron AI model with a specialized prompt that:
   - Identifies the business type from receipt items
   - Filters out non-essential personal items
   - Prioritizes essential business expenses
   - Generates cost-per-unit estimates
   - Recommends restock quantities based on usage patterns
4. **Output Generation**: The AI generates a structured markdown response with:
   - **Summary Section**: Brief analysis overview and business type inference
   - **Prioritized Expense Table**: Detailed table with priority rankings, item descriptions, quantities, costs, and business justifications
5. **Display**: The analysis is displayed in the "Popo's Receipt Summary" panel, which is scrollable for long summaries
6. **Continuous Learning**: As new files are added, the AI re-analyzes all data to provide updated recommendations

### AI Prompt Structure

The AI is pre-prompted with specific instructions to:
- Act as a financial and inventory assistant
- Infer business context from receipt items
- Filter non-essential items
- Prioritize items based on business type and perishability
- Generate structured markdown tables with priority rankings

---

## 🛠 Tech Stack

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![NVIDIA](https://img.shields.io/badge/NVIDIA-76B900?style=for-the-badge&logo=nvidia&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![VS Code](https://img.shields.io/badge/VS%20Code-007ACC?style=for-the-badge&logo=visual-studio-code&logoColor=white)

</div>

### Core Technologies

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 19.2.0, JavaScript (ES6+), HTML5, CSS3 |
| **Backend** | Node.js, Express.js 4.18.2 |
| **AI/ML** | NVIDIA Nemotron (via OpenAI SDK), OpenAI API 6.8.1 |
| **File Processing** | Multer 1.4.5, MIME-types 2.1.35 |
| **Development** | Git, GitHub, VS Code, Create React App |
| **Environment** | dotenv 16.3.1, CORS 2.8.5 |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **NVIDIA API Key** (see [API Setup](#-api-setup) section)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/KySm227/hackathon.git
   cd hackathon
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd Backend/Server
   npm install
   cd ../..
   ```

4. **Set up environment variables**
   ```bash
   cd Backend/Server
   cp .env.example .env  # If .env.example exists, or create .env manually
   ```
   
   Create a `.env` file in `Backend/Server/` with your NVIDIA API key:
   ```env
   NVIDIA_API_KEY=your_nvidia_api_key_here
   ```

5. **Start the backend server** (Terminal 1)
   ```bash
   cd Backend/Server
   npm start
   ```
   The backend will run on `http://localhost:3001`

6. **Start the frontend** (Terminal 2)
   ```bash
   npm start
   ```
   The frontend will run on `http://localhost:3000` and automatically open in your browser

---

## 🔑 API Setup

### Getting Your NVIDIA API Key

1. **Visit NVIDIA API Portal**
   - Go to [NVIDIA API Catalog](https://build.nvidia.com/)
   - Sign up or log in to your NVIDIA account

2. **Create an API Key**
   - Navigate to your account settings
   - Generate a new API key for the Nemotron model
   - Copy the API key (you won't be able to see it again!)

3. **Configure Your Environment**
   - Create a `.env` file in the `Backend/Server/` directory
   - Add your API key:
     ```env
     NVIDIA_API_KEY=your_actual_api_key_here
     ```
   - **Important**: Never commit the `.env` file to version control!

4. **Verify Setup**
   - The backend server will automatically load the API key from the `.env` file
   - Check the console for any API connection errors

### API Configuration Details

The application uses the NVIDIA Nemotron model through the OpenAI-compatible API:

- **Base URL**: `https://integrate.api.nvidia.com/v1`
- **Model**: `nvidia/llama-3.1-nemotron-nano-vl-8b-v1`
- **Configuration**: Set in `Backend/Server/nvidiaClient.js` and `Backend/Server/server.js`

### Troubleshooting API Issues

- **"API key not found"**: Ensure `.env` file exists in `Backend/Server/` directory
- **"Invalid API key"**: Verify your API key is correct and active
- **"Rate limit exceeded"**: Check your NVIDIA API usage limits
- **Connection errors**: Verify your internet connection and NVIDIA API status

---

## 🏗 How we built it

We built PopoAI using **React** and **JavaScript** for the frontend and **Node.js** for the backend. The NVIDIA Nemotron model powers the AI's analytical engine, interpreting text from receipts and generating intelligent spending recommendations. 

### Architecture Overview

```
┌─────────────────┐
│   React Frontend │
│   (Port 3000)    │
└────────┬─────────┘
         │ HTTP Requests
         ▼
┌─────────────────┐
│  Express Backend │
│   (Port 3001)    │
└────────┬─────────┘
         │ File Processing
         ▼
┌─────────────────┐
│  NVIDIA Nemotron │
│      API         │
└─────────────────┘
```

### Key Components

- **Frontend (`src/App.js`)**: Main React component handling file uploads, drag-and-drop, and displaying AI analysis
- **Backend (`Backend/Server/server.js`)**: Express server handling file uploads, parsing, and AI integration
- **File Reader (`Backend/Server/utils/fileReader.js`)**: Utility for reading and parsing .txt and .csv files
- **NVIDIA Client (`Backend/Server/nvidiaClient.js`)**: Client configuration for NVIDIA API
- **Nemotron Model (`Backend/Server/Nvidia Model/nemotron.js`)**: Function to send messages to NVIDIA model

For the visual aspect, we integrated dynamic UI components to create a professional interface that presents suggested inventory and cost breakdowns in an intuitive format. **Git** and **GitHub** were used to manage collaboration across our team — creating branches, reviewing pull requests, and pushing commits frequently to ensure everyone was updated and able to contribute simultaneously.

---

## 🎯 Challenges we ran into

One of the biggest challenges was connecting the AI model to read and understand uploaded receipt files and outputting its responses in a structured format through the React interface. We also faced challenges in:

- **File Format Parsing**: Handling different receipt formats and extracting structured data
- **AI Response Formatting**: Ensuring consistent markdown table output from the AI model
- **Real-time Updates**: Synchronizing analysis results as new files are added
- **Team Collaboration**: Synchronizing work among multiple developers, handling merge conflicts, and keeping all branches aligned with the latest updates
- **Error Handling**: Managing file upload errors, API failures, and user feedback

---

## 🏆 Accomplishments that we're proud of

We successfully built a working prototype that ties together multiple AI systems and a clean user interface. Seeing the AI analyze real receipts, provide accurate inventory suggestions, and automatically generate a polished summary felt like a huge step toward real-world automation.

Key achievements:
- ✅ Seamless file upload and processing pipeline
- ✅ Intelligent business type inference from receipt data
- ✅ Prioritized expense recommendations with cost analysis
- ✅ Real-time analysis updates as new files are added
- ✅ Professional, scrollable UI for displaying results
- ✅ Successful integration of NVIDIA Nemotron AI model

---

## 📚 What we learned

We learned how to integrate AI models into full-stack applications, manage real-time updates in React, and coordinate a collaborative development workflow using Git branching strategies. We also gained a deeper understanding of:

- **AI Integration**: How to structure prompts for consistent AI output
- **File Processing**: Parsing and extracting data from various file formats
- **State Management**: Managing complex state in React applications
- **API Design**: Creating RESTful endpoints for file upload and analysis
- **Team Collaboration**: Effective Git workflows and conflict resolution
- **User Experience**: Presenting AI-generated content in an intuitive format

---

## 🔮 What's next for PopoAI

Next, we plan to enhance PopoAI's analytics by adding:

- 📈 **Trend Tracking**: Track spending patterns over time
- 🏷️ **Automatic Categorization**: Auto-categorize expenses by type
- 💳 **POS Integration**: Connect with point-of-sale systems
- 📊 **Advanced Analytics**: Dashboard with charts and visualizations
- 🔔 **Alerts & Notifications**: Low stock alerts and spending warnings
- 🌐 **Multi-format Support**: Support for PDF and image-based receipts
- 👥 **Multi-user Support**: Team accounts and role-based access
- 🎯 **Accuracy Improvements**: Enhanced AI model fine-tuning

We also want to optimize the AI's accuracy and improve collaboration tools to make the project even more scalable for larger teams and businesses.

---

## 📝 License

This project was created for HackUTD 2025. All rights reserved.

---

## 👥 Contributors

Built with ❤️ by the PopoAI team

---

## 📞 Support

For issues, questions, or contributions, please open an issue on [GitHub](https://github.com/KySm227/hackathon/issues).

---

<div align="center">

**Made with ❤️ for small businesses everywhere**

[⬆ Back to Top](#-popoai---intelligent-receipt-analysis-for-small-businesses)

</div>
