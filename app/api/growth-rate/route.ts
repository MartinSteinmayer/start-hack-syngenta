import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';
dotenv.config();

interface WeatherData {
    precipitation: number;
    min_temperature: number;
    max_temperature: number;
    humidity: number;
}

interface CropGrowthRequest {
    weather: WeatherData;
    crop: string;
    product: string;
    soil_ph: number;
    soil_nitrogen: number;
}

interface CropGrowthResponse {
    growth_rate_increase: number;
    daily_growth_percentage: number;
    yield_risk: number;
    estimated_yield: number;
    observations: string;
}

interface CropGddData {
    crop: string;
    base_temperature: number;
    total_gdd: number;
    baseline_yield: number;
}

interface CropOptimalData {
    crop: string;
    gdd_optimal: number;
    precipitation_optimal: number;
    ph_optimal: number;
    n_optimal: number;
}

class OpenAIService {
    private static instance: OpenAIService;
    private openai: OpenAI;
    private conversationHistory: ChatCompletionMessageParam[] = [];
    private isInitialized = false;
    private cropGddData: CropGddData[] = [];
    private cropOptimalData: CropOptimalData[] = [];

    private constructor(apiKey: string) {
        this.openai = new OpenAI({ apiKey });
    }

    public static getInstance(apiKey: string): OpenAIService {
        if (!OpenAIService.instance) {
            OpenAIService.instance = new OpenAIService(apiKey);
        }
        return OpenAIService.instance;
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            const markdownDir = path.join(process.cwd(), 'public/data/markdown');
            const productCropFitMarkdown = fs.readFileSync(path.join(markdownDir, 'product_crop_fit.md'), 'utf-8');
            const stressBusterMarkdown = fs.readFileSync(path.join(markdownDir, 'stress_buster.md'), 'utf-8');
            const yieldBoosterMarkdown = fs.readFileSync(path.join(markdownDir, 'yield_booster.md'), 'utf-8');
            const nueMarkdown = fs.readFileSync(path.join(markdownDir, 'nue.md'), 'utf-8');
            
            await this.loadCropGddData();
            
            await this.loadCropOptimalData();
            
            const systemPrompt = `You are an algorithm that calculates the growth rate of a certain crop based on the following conditions: {weather: {precipitation: mm, min_temperature: celsius degrees, max_temperature: celsius degrees, humidity: percentage}, crop: string, product: string}. The crops can be: soybean, wheat, corn, cotton, rice.
            There are three types of products, Stress Buster, Yield Booster, and Nutrient use efficiency (NUE) products.
            In product, I will pass: stress_buster, yield_booster, or nue, depending on the product you should use.
            Based on it, you should rely on the respective information for each product (given below in markdown format,
            one product per time) to predict the growth rate of the crop given the other conditions (like weather).
            Furthermore, you should return a field Observations (short) with a key insight on why that product increase
            the growth rate or not. Observations should be some short phrase telling why it worked or not, associating the
            effectivess with the weather conditions received (cite the received temperature and precipitation, for example)
            and the product effect. Be specific, but precise. Also, there are some products that are adequate for certain crops only.
            Below, there is the list of adequate products vs crops applicable (in table in markdown).
            You should take this into consideration when returning the growth rate for each set of conditions.
            If the product is not applicable to that crop, please return growth_rate_increase as 0, and in the observations
            return that product not applicable, and won't make a difference (in better words).
            Attention, yield booster is applicable to cotton.
            
            ${productCropFitMarkdown}

            INFORMATIONS FOR EACH PRODUCT: ${stressBusterMarkdown} ${yieldBoosterMarkdown} ${nueMarkdown}
            
            From now on, I will send you conditions for each request. Your answer should look like 

            {
            "growth_rate_increase": X,
            "observations": x
            }
            Only answer with this, nothing else. If growth_rate_increase is 5%, for example, the result should return 0.05. IT'S JUST AN EXAMPLE of the format of the output`;

            this.conversationHistory = [{ role: "system", content: systemPrompt }];
            
            this.isInitialized = true;
            console.log("OpenAI service initialized with system prompt, crop GDD data, and crop optimal data");
        } catch (error) {
            console.error("Failed to initialize OpenAI service:", error);
            throw error;
        }
    }

    private async loadCropGddData(): Promise<void> {
        try {
            const csvFilePath = path.join(process.cwd(), 'public/data/crop_gdd_data.csv');
            const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
            
            const records = parse(csvContent, {
                columns: true,
                skip_empty_lines: true
            });
            
            this.cropGddData = records.map((record: any) => ({
                crop: record.crop.toLowerCase(),
                base_temperature: parseFloat(record.base_temperature),
                total_gdd: parseFloat(record.total_gdd),
                baseline_yield: parseFloat(record.baseline_yield) // Add this line to extract baseline yield
            }));
            
            console.log(`Loaded GDD data for ${this.cropGddData.length} crops`);
        } catch (error) {
            console.error("Failed to load crop GDD data:", error);
            throw error;
        }
    }

    private async loadCropOptimalData(): Promise<void> {
        try {
            const csvFilePath = path.join(process.cwd(), 'public/data/crop_optimal_data.csv');
            const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
            
            const records = parse(csvContent, {
                columns: true,
                skip_empty_lines: true
            });
            
            this.cropOptimalData = records.map((record: any) => ({
                crop: record.Crop_Name.toLowerCase(),
                gdd_optimal: parseFloat(record.GDD_Optimal),
                precipitation_optimal: parseFloat(record.Precipitation_Optimal),
                ph_optimal: parseFloat(record.pH_Optimal),
                n_optimal: parseFloat(record.N_Optimal)
            }));
            
            console.log(`Loaded optimal data for ${this.cropOptimalData.length} crops`);
        } catch (error) {
            console.error("Failed to load crop optimal data:", error);
            throw error;
        }
    }

    private calculateGdd(minTemp: number, maxTemp: number, baseTemp: number): number {
        const avgTemp = (minTemp + maxTemp) / 2;
        
        return Math.max(0, avgTemp - baseTemp);
    }

    public async getCropGrowthRate(requestData: CropGrowthRequest): Promise<CropGrowthResponse> {
        if (!this.isInitialized) {
            await this.initialize();
        }
    
        const userMessage = `Current conditions: ${JSON.stringify(requestData)}`;
        
        const resultContent = await this.callOpenAI(userMessage);
        
        let openAIResponse: { growth_rate_increase: number, observations: string };
        
        try {
            openAIResponse = JSON.parse(resultContent);
        } catch (parseError) {
            console.log("Failed to parse response as JSON directly, trying regex extraction");
            
            const jsonMatch = resultContent.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
                try {
                    openAIResponse = JSON.parse(jsonMatch[0]);
                } catch (nestedError) {
                    console.error("Failed to parse extracted JSON:", nestedError);
                    openAIResponse = {
                        growth_rate_increase: 0,
                        observations: "Failed to process AI response. Please try again."
                    };
                }
            } else {
                console.error("Could not extract JSON from response");
                openAIResponse = {
                    growth_rate_increase: 0,
                    observations: "Failed to parse AI response. Please try again."
                };
            }
        }
    
        if (typeof openAIResponse.growth_rate_increase !== 'number') {
            console.warn(`Invalid growth_rate_increase value, defaulting to 0`);
            openAIResponse.growth_rate_increase = 0;
        }
    
        if (!openAIResponse.observations) {
            openAIResponse.observations = "No observations provided.";
        }
    
        const cropData = this.cropGddData.find(crop => crop.crop === requestData.crop.toLowerCase());
        const cropOptimal = this.cropOptimalData.find(crop => crop.crop === requestData.crop.toLowerCase());
        
        let dailyGrowthPercentage = 0;
        let yieldRisk = 0;
        let calculatedGdd = 0;
        let estimatedYield = 0;
        
        if (cropData) {
            calculatedGdd = this.calculateGdd(
                requestData.weather.min_temperature,
                requestData.weather.max_temperature,
                cropData.base_temperature
            );
            
            dailyGrowthPercentage = (calculatedGdd / cropData.total_gdd) * 100;
            
            dailyGrowthPercentage *= (1 + openAIResponse.growth_rate_increase);
            
            estimatedYield = cropData.baseline_yield * (1 + openAIResponse.growth_rate_increase);
        } else {
            console.warn(`No GDD data found for crop: ${requestData.crop}`);
        }
        
        if (cropOptimal) {
            const actualGDD = calculatedGdd;
            const actualPrecipitation = requestData.weather.precipitation;
            const actualPH = requestData.soil_ph;
            const actualNitrogen = requestData.soil_nitrogen;
            
            const optimalGDD = cropOptimal.gdd_optimal;
            const optimalPrecipitation = cropOptimal.precipitation_optimal;
            const optimalPH = cropOptimal.ph_optimal;
            const optimalNitrogen = cropOptimal.n_optimal;
            
            // Define weights as per the example in Syngenta's documentation 
            const w1 = 0.3;
            const w2 = 0.3;
            const w3 = 0.2;
            const w4 = 0.2;
            
            // Calculate yield risk using the formula:
            // YR = w1·(GDD - GDD_opt)² + w2·(P - P_opt)² + w3·(pH - pH_opt)² + w4·(N - N_opt)²
            yieldRisk = 
                w1 * Math.pow(actualGDD - optimalGDD, 2) +
                w2 * Math.pow(actualPrecipitation - optimalPrecipitation, 2) +
                w3 * Math.pow(actualPH - optimalPH, 2) +
                w4 * Math.pow(actualNitrogen - optimalNitrogen, 2);
            
        } else {
            console.warn(`No optimal data found for crop: ${requestData.crop}`);
        }
        
        const growthRateResponse: CropGrowthResponse = {
            growth_rate_increase: openAIResponse.growth_rate_increase,
            daily_growth_percentage: parseFloat(dailyGrowthPercentage.toFixed(2)),
            yield_risk: parseFloat(yieldRisk.toFixed(2)),
            estimated_yield: parseFloat(estimatedYield.toFixed(2)),
            observations: openAIResponse.observations
        };
    
        return growthRateResponse;
    }

    private async callOpenAI(userMessage: string): Promise<string> {
        this.conversationHistory.push({ role: "user", content: userMessage });

        const response = await this.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: this.conversationHistory,
            temperature: 0.5,
        });

        const resultContent = response.choices[0]?.message.content || '';
        
        this.conversationHistory.push({ role: "assistant", content: resultContent });
        
        if (this.conversationHistory.length > 10) {
            this.conversationHistory = [
                this.conversationHistory[0],
                ...this.conversationHistory.slice(-8)
            ];
        }
        
        return resultContent;
    }
}

/**
 * Crop growth rate API route handler
 * Uses a singleton OpenAI service to maintain conversation history
 */
export async function POST(request: NextRequest) {
    try {
        const requestData: CropGrowthRequest = await request.json();

        if (!requestData.weather || !requestData.crop || !requestData.product) {
            return NextResponse.json(
                { error: 'Missing required parameters: weather, crop, or product' },
                { status: 400 }
            );
        }

        if (requestData.soil_ph === undefined || requestData.soil_nitrogen === undefined) {
            return NextResponse.json(
                { error: 'Missing required parameters: soil_ph or soil_nitrogen' },
                { status: 400 }
            );
        }

        if (requestData.weather.min_temperature === undefined || requestData.weather.max_temperature === undefined) {
            return NextResponse.json(
                { error: 'Missing required weather parameters: min_temperature or max_temperature' },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.error('OpenAI API key not found');
            return NextResponse.json(
                { error: 'API configuration error' },
                { status: 500 }
            );
        }

        const openAIService = OpenAIService.getInstance(apiKey);
        
        await openAIService.initialize();

        const growthRateResponse = await openAIService.getCropGrowthRate(requestData);

        return NextResponse.json(growthRateResponse);
        
    } catch (error) {
        console.error('Error processing crop growth rate:', error);
        return NextResponse.json(
            { 
                error: 'Failed to process crop growth rate',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}