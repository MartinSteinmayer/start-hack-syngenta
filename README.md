# Crop & Paster: Digital Twin for Agricultural Simulation

![Farm Bio-Boost Logo](/public/logo_white.png)

## 🌱 Project Overview

Crop & Paster is an AI-powered digital twin application designed to help farmers visualize environmental risks, recommend biological products for their specific crops, and track outcomes to improve yields sustainably. Created for the Syngenta START Hack 2025 challenge, this solution addresses the lack of understanding and data access on biological efficacy across various climates, soil types, and conditions.

### 🎯 Key Features

- **Environmental Visualization**: View real-time climate, soil, and disease risks to understand implications for your crops
- **Biological Product Recommendations**: Get tailored recommendations for biological products based on your specific crop, soil type, and field conditions
- **3D Farm Simulation**: Experience a realistic 3D representation of your farm with accurate crop growth simulation
- **Outcome Tracking**: Monitor results throughout the growing season and use the data to improve recommendations for subsequent years
- **Drought Risk Alerts**: Receive early warnings about potential drought conditions and recommended preventative measures

## 🚀 Live Demo

[View Live Demo](https://crop-and-paste.vercel.app/)

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Installation](#-installation)
- [Usage](#-usage)
- [Technical Architecture](#-technical-architecture)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Technologies Used](#-technologies-used)
- [Contributing](#-contributing)
- [License](#-license)

## 🔍 Problem Statement

Biological products can support crop health and sustainability outcomes, particularly in the face of climate challenges. However, many farmers struggle to select the most appropriate products due to:

1. Limited understanding of biological efficacy across different environments
2. Insufficient data access on product performance in specific soil and climate conditions
3. Difficulty in predicting how biological products will perform in changing weather patterns

This leads to suboptimal yields and worse outcomes when facing environmental challenges.

## 💡 Solution

Farm Bio-Boost creates a digital twin of your farm that:

1. **Visualizes Environmental Factors**: Displays real-time and forecasted weather, soil conditions, and potential stressors affecting your crops
2. **Simulates Product Application**: Allows farmers to simulate the application of different biological products and see their effects on crop development
3. **Provides Data-Driven Recommendations**: Uses AI algorithms to recommend the most suitable biological products based on your specific conditions
4. **Tracks Outcomes**: Records the performance of applied products to improve future recommendations

The system is designed specifically for farmers in regions like Brazil's Cerrado, where specific climate patterns and soil conditions create unique agricultural challenges.

## 🛠️ Installation

### Prerequisites

- Node.js (v18.0 or higher)
- npm (v9.0 or higher)
- Git

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/farm-bio-boost.git
   cd farm-bio-boost
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add the following variables:
     ```
     NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
     NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

## 🖥️ Usage

### Setting Up Your Farm

1. **Location Selection**:
   - Enter your farm's location by searching for a place name or clicking on the map
   - The system will automatically fetch climate and soil data for this location

2. **Farm Size Definition**:
   - Specify your farm's size in hectares
   - Draw the boundary of your farm on the satellite map for precise field definition

3. **Crop Selection**:
   - Choose the type of crop you're growing (corn, soybean, wheat, rice, or cotton)
   - The system will adjust growth models and product recommendations accordingly

### Simulation Features

1. **Timeline Control**:
   - Navigate through the growing season using the timeline controls
   - Play/pause, adjust speed, or jump to specific growth stages

2. **Weather Visualization**:
   - View current and forecasted weather conditions
   - See how weather affects crop growth and stress factors

3. **Product Application**:
   - Click "Simulate Product" to browse available biological products
   - Select a product to apply and observe its effects on crop growth and yield

4. **Risk Monitoring**:
   - Receive alerts about potential risks (drought, disease, etc.)
   - Get recommendations for preventative measures

## 🏗️ Technical Architecture

Farm Bio-Boost is built on a robust technical architecture designed for scalability and performance:

### Frontend Architecture

- **Next.js Framework**: Provides server-side rendering and efficient routing
- **React Components**: Feature-based component organization for maintainability
- **Three.js Integration**: Powers the 3D farm simulation with realistic rendering
- **Custom Hooks**: Abstract data fetching and state management logic
- **Context Providers**: Manage global application state

### Backend Services

- **NextJS API Routes**: Handle data requests and proxy third-party API calls
- **Environmental Data API**: Connects to CE Hub for weather, soil, and terrain data
- **Growth Simulation Engine**: Calculates crop growth based on environmental factors
- **Product Recommendation Algorithm**: Uses historical data and current conditions to suggest optimal biological products

### Data Processing Pipeline

1. **Data Collection**: Gathers environmental data from CE Hub API
2. **Data Transformation**: Processes raw data into formats suitable for visualization and analysis
3. **Simulation Calculation**: Applies growth models and product effects to generate predictions
4. **Visualization Rendering**: Presents results in the 3D farm model and UI charts

## 📁 Project Structure

The project follows a feature-based organization for better maintainability:

```
farm-bio-boost/
├── app/                       # Next.js app directory
│   ├── api/                   # API routes
│   ├── simulation/            # Simulation page and components
│   ├── page.tsx               # Home page
│   └── layout.tsx             # Root layout
├── components/                # Reusable components
│   ├── farm/                  # Farm-specific components
│   ├── ui/                    # UI components
│   └── styles/                # Component styles
├── lib/                       # Core logic and utilities
│   ├── crops/                 # Crop models and growth logic
│   ├── environment/           # Environmental rendering
│   ├── services/              # API services
│   ├── simulation/            # Simulation engine
│   ├── utils/                 # Utility functions
│   └── weather/               # Weather simulation
├── public/                    # Static assets
│   ├── data/                  # Mock data and CSVs
│   ├── images/                # Images
│   └── models/                # 3D models
├── types/                     # TypeScript type definitions
├── .env.local                 # Environment variables
├── package.json               # Project dependencies
└── tsconfig.json              # TypeScript configuration
```

## 📚 API Documentation

### CE Hub API

The application uses Syngenta's CE Hub API to access environmental data:

#### Forecast API Endpoints:

- `ShortRangeForecastDaily`: Get daily weather forecast data
- `ShortRangeForecastHourly`: Get hourly weather forecast data
- `Nowcast`: Get current weather conditions

#### Historical API Endpoints:

- `dataset/query`: Get historical weather and soil data

For detailed API specifications, refer to the [CE Hub API documentation](https://services.cehub.syngenta-ais.com/swagger/index.html).

### Internal API Routes

The application provides several internal API routes:

- `/api/environmental-data`: Proxy for CE Hub API requests
- `/api/products`: Retrieve biological product data
- `/api/growth-rate`: Calculate growth rate based on product application
- `/api/drought-risk`: Assess drought risk based on environmental conditions

## 🔧 Technologies Used

### Frontend
- **React & Next.js**: Core frontend framework
- **Three.js**: 3D visualization library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Leaflet**: Interactive maps

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **OpenAI SDK**: AI-powered recommendations
- **Papaparse**: CSV parsing

### Data Sources
- **CE Hub API**: Environmental data
- **Agronomy stress algorithms**: Science-driven stress models
- **Product data cards**: Biological product information

## 👥 Contributing

We welcome contributions to Farm Bio-Boost! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some feature'`)
5. Push to the branch (`git push origin feature/your-feature-name`)
6. Open a Pull Request

Please ensure your code follows our coding standards and includes appropriate tests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Syngenta for providing the CE Hub API and agricultural datasets
- START Hack 2025 for the challenge and opportunity
- All contributors and team members who made this project possible

---

Built with 💚 for sustainable agriculture | Crop & Paste Team © 2025
