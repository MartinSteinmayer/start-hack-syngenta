import { NextRequest, NextResponse } from 'next/server';

// Define interfaces for API responses
interface CEHubResponse {
    success: boolean;
    data: any;
    error?: string;
}

interface WeatherData {
    forecast: {
        daily: Array<{
            date: string;
            temperature: {
                max: number;
                min: number;
                avg: number;
            };
            precipitation: number;
            humidity: number;
            windSpeed: number;
            globalRadiation: number;
        }>;
        hourly?: Array<any>;
    };
    historical?: any;
    soil?: any;
}

/**
 * Environmental data API route handler
 * Fetches weather forecast and soil data from CE Hub API
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const type = searchParams.get('type') || 'forecast';
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Validate required parameters
    if (!lat || !lng) {
        return NextResponse.json(
            { error: 'Missing required parameters: lat and lng' },
            { status: 400 }
        );
    }

    try {
        // Get API config based on endpoint type
        let apiUrl, apiKey, apiEndpoint, requestBody, requestMethod = 'GET';
        let headers: Record<string, string> = { 'Content-Type': 'application/json' };

        // Configure API parameters based on request type
        if (type === 'forecast') {
            // FORECAST API CONFIGURATION
            apiUrl = process.env.CE_HUB_FORECAST_API_URL;
            apiKey = process.env.CE_HUB_FORECAST_API_KEY;

            if (!apiUrl || !apiKey) {
                console.log('Forecast API config missing, using mock data');
                return NextResponse.json(await getMockData(type, lat, lng, startDate, endDate));
            }

            console.log(`Forecast API config: ${apiUrl} ${apiKey}`);
            headers['ApiKey'] = apiKey;

            // Match Postman example for Forecast API path
            apiEndpoint = `${apiUrl}/api/Forecast/ShortRangeForecastDaily?latitude=${lat}&longitude=${lng}&startDate=${startDate}&endDate=${endDate}&supplier=Meteoblue&measureLabel=TempAir_DailyMax;TempAir_DailyMin;TempAir_DailyAvg;Precip_DailySum;HumidityRel_DailyAvg;WindSpeed_DailyAvg;GlobalRadiation_DailySum&format=json`;
        } 
        else if (type === 'historical') {
            // HISTORICAL API CONFIGURATION
            apiUrl = process.env.CE_HUB_HISTORICAL_API_URL;
            apiKey = process.env.CE_HUB_HISTORICAL_API_KEY;

            if (!apiUrl || !apiKey) {
                console.log('Historical API config missing, using mock data');
                return NextResponse.json(await getMockData(type, lat, lng, startDate, endDate));
            }

            console.log(`Historical API config: ${apiUrl} ${apiKey}`);
            
            // For historical API, key goes in URL
            apiEndpoint = `${apiUrl}?apikey=${apiKey}`;
            requestMethod = 'POST';
            
            // Match Postman example for Historical API
            requestBody = {
                units: {
                    temperature: "C",
                    velocity: "km/h", // Changed from m/s to match Postman example
                    length: "metric",
                    energy: "watts"
                },
                geometry: {
                    type: "MultiPoint", // Changed from Point to match Postman
                    coordinates: [[parseFloat(lng), parseFloat(lat)]],
                    locationNames: ["Location"],
                    mode: "preferLandWithMatchingElevation"
                },
                format: "json",
                timeIntervals: [`${startDate}T+00:00/${endDate}T+00:00`],
                timeIntervalsAlignment: "none",
                queries: [
                    {
                        domain: "ERA5T", // Matches Postman example
                        gapFillDomain: "NEMSGLOBAL",
                        timeResolution: "daily",
                        codes: [
                            { 
                                code: 11, 
                                level: "2 m above gnd",
                                aggregation: "mean"
                            }
                        ]
                    },
                    {
                        domain: "ERA5T",
                        gapFillDomain: "NEMSGLOBAL",
                        timeResolution: "daily",
                        codes: [
                            {
                                code: 61,
                                level: "sfc",
                                aggregation: "sum"
                            }
                        ]
                    }
                ]
            };
        } 
        else if (type === 'soil') {
            // SOIL API CONFIGURATION
            apiUrl = process.env.CE_HUB_HISTORICAL_API_URL;
            apiKey = process.env.CE_HUB_HISTORICAL_API_KEY;

            if (!apiUrl || !apiKey) {
                console.log('Soil API config missing, using mock data');
                return NextResponse.json(await getMockData(type, lat, lng, startDate, endDate));
            }

            console.log(`Soil API config: ${apiUrl} ${apiKey}`);
            
            // For soil API, key goes in URL
            apiEndpoint = `${apiUrl}?apikey=${apiKey}`;
            requestMethod = 'POST';
            
            // Match Postman example for Soil API exactly
            requestBody = {
                units: {
                    temperature: "C",
                    velocity: "km/h",
                    length: "metric",
                    energy: "watts"
                },
                geometry: {
                    type: "MultiPoint",
                    coordinates: [[parseFloat(lng), parseFloat(lat)]],
                    locationNames: ["Location"],
                    mode: "preferLandWithMatchingElevation"
                },
                format: "json",
                timeIntervals: [`${startDate}T+00:00/${endDate}T+00:00`],
                timeIntervalsAlignment: "none",
                queries: [
                    {
                        domain: "SOILGRIDS1000", // Critical: Correct domain from Postman
                        gapFillDomain: null,
                        timeResolution: "static",
                        codes: [
                            { code: 812, level: "5 cm" } // Specific soil code from Postman
                        ]
                    },
                    {
                        domain: "SOILGRIDS1000",
                        gapFillDomain: null,
                        timeResolution: "static",
                        codes: [
                            { code: 806, level: "0 cm" } // Specific soil code from Postman
                        ]
                    },
                    {
                        domain: "WISE30",
                        gapFillDomain: null,
                        timeResolution: "static",
                        codes: [
                            { code: 831, level: "0-20 cm" } // Additional soil property
                        ]
                    }
                ]
            };
        } 
        else {
            return NextResponse.json(
                { error: `Unsupported data type: ${type}` },
                { status: 400 }
            );
        }

        // Make request to CE Hub API with enhanced logging
        console.log(`Making ${requestMethod} request to: ${apiEndpoint.split('?')[0]}`);

        const response = requestMethod === 'GET'
            ? await fetch(apiEndpoint, { headers })
            : await fetch(apiEndpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody)
            });

        console.log(`CE Hub API response: ${response.status} ${response.statusText}`);

        // Handle different response statuses appropriately
        let responseData;
        
        if (response.status === 204) {
            // Handle No Content responses
            console.log('Received 204 No Content response - using empty data set');
            responseData = { data: [] };
        } 
        else if (!response.ok) {
            // Try to get error details for better diagnostics
            let errorDetails = '';
            try {
                const errorText = await response.text();
                errorDetails = errorText.substring(0, 200);
                console.error(`API Error response details: ${errorDetails}`);
            } catch (readError) {
                console.error('Could not read error response body');
            }
            
            // Throw appropriate error based on status code
            if (response.status === 401 || response.status === 403) {
                throw new Error(`Authentication failed for CE Hub ${type} API: Invalid API key`);
            } else if (response.status === 400) {
                throw new Error(`Invalid request to CE Hub ${type} API: Bad Request - ${errorDetails || 'Check parameters'}`);
            } else if (response.status === 404) {
                throw new Error(`Endpoint not found for CE Hub ${type} API: Check URL configuration`);
            } else {
                throw new Error(`CE Hub API responded with ${response.status}: ${response.statusText}`);
            }
        } 
        else {
            // Process successful responses
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    responseData = await response.json();
                } else {
                    console.log(`Non-JSON response received: ${contentType}`);
                    const textResponse = await response.text();
                    console.log(`Response preview: ${textResponse.substring(0, 100)}...`);
                    responseData = { data: [] };
                }
            } catch (parseError) {
                console.error('Error parsing response:', parseError);
                responseData = { data: [] };
            }
        }

        // Process the data based on the type
        const processedData = processApiResponse(type, responseData);
        console.log(`Successfully processed ${type} data`);

        return NextResponse.json(processedData);
    } catch (error) {
        console.error('Error fetching environmental data:', error);

        // Return mock data if API request fails
        const mockData = await getMockData(type, lat, lng, startDate, endDate);
        return NextResponse.json(mockData);
    }
}

/**
 * Process the API response based on the type of data requested
 */
function processApiResponse(type: string, responseData: any) {
    switch (type) {
        case 'forecast':
            // Extract and format forecast data from the response
            const dailyData = responseData.data?.map((item: any) => ({
                date: item.date,
                temperature: {
                    max: item.TempAir_DailyMax,
                    min: item.TempAir_DailyMin,
                    avg: item.TempAir_DailyAvg
                },
                precipitation: item.Precip_DailySum,
                humidity: item.HumidityRel_DailyAvg,
                windSpeed: item.WindSpeed_DailyAvg,
                globalRadiation: item.GlobalRadiation_DailySum
            })) || [];

            return {
                forecast: {
                    daily: dailyData
                }
            };

        case 'historical':
            // Process historical data - improved with structured response
            try {
                // Extract temperature and precipitation data
                const tempData = responseData.data?.find((dataset: any) => 
                    dataset.domain === 'ERA5T' && dataset.code === 11);
                
                const precipData = responseData.data?.find((dataset: any) => 
                    dataset.domain === 'ERA5T' && dataset.code === 61);
                
                return {
                    historical: {
                        temperature: {
                            data: tempData?.data || [],
                            unit: 'C'
                        },
                        precipitation: {
                            data: precipData?.data || [],
                            unit: 'mm'
                        },
                        raw: responseData // Include raw data for debugging/reference
                    }
                };
            } catch (err) {
                console.error('Error processing historical data:', err);
                return { historical: responseData };
            }

        case 'soil':
            // Process soil data with improved extraction
            try {
                // Find soil datasets from response
                const soilTexture = responseData.data?.find((dataset: any) => 
                    dataset.domain === 'SOILGRIDS1000' && dataset.code === 806);
                
                const soilProps = responseData.data?.find((dataset: any) => 
                    dataset.domain === 'SOILGRIDS1000' && dataset.code === 812);
                
                const soilWise = responseData.data?.find((dataset: any) => 
                    dataset.domain === 'WISE30' && dataset.code === 831);
                
                // Extract soil texture class
                const textureValue = getFirstDataValue(soilTexture);
                const texture = getSoilTextureDescription(textureValue);
                
                // Extract soil properties
                const properties = {
                    bulkDensity: getFirstDataValue(soilProps) ?? 0,
                    organicMatter: getFirstDataValue(soilWise) ?? 0,
                    ph: 6.5, // Default if not available
                    waterHoldingCapacity: 0.2,
                    cationExchangeCapacity: 10
                };
                
                return {
                    soil: {
                        texture,
                        properties,
                        raw: responseData // Include raw data for debugging
                    }
                };
            } catch (err) {
                console.error('Error processing soil data:', err);
                return {
                    soil: {
                        texture: "Unknown",
                        properties: {
                            bulkDensity: 0,
                            organicMatter: 0,
                            ph: 0
                        },
                        error: 'Failed to process soil data'
                    }
                };
            }

        default:
            return responseData;
    }
}

/**
 * Helper to get the first data value from a dataset
 */
function getFirstDataValue(dataset: any): number | null {
    if (!dataset) {
        console.warn('Dataset not found in response');
        return null;
    }
    
    if (!dataset.data || !dataset.data.length) {
        console.warn(`Dataset ${dataset.domain}/${dataset.code} has no data points`);
        return null;
    }
    
    return typeof dataset.data[0].value === 'number' ? dataset.data[0].value : null;
}

/**
 * Get the soil texture description based on the value
 */
function getSoilTextureDescription(textureValue: number | null): string {
    if (textureValue === null) return "Unknown";
    
    // Soil texture classification mapping
    const textureClassMap: { [key: number]: string } = {
        1: "Clay (Cl)",
        2: "Silty Clay (SiCl)",
        3: "Sandy Clay (SaCl)",
        4: "Clay Loam (ClLo)",
        5: "Silty Clay Loam (SiClLo)",
        6: "Sandy Clay Loam (SaClLo)",
        7: "Loam (Lo)",
        8: "Silty Loam (SiLo)",
        9: "Sandy Loam (SaLo)",
        10: "Silt (Si)",
        11: "Loamy Sand (LoSa)",
        12: "Sand (Sa)"
    };
    
    return textureClassMap[textureValue] || "Unknown";
}

/**
 * Get mock data for development and testing
 */
async function getMockData(type: string, lat: string, lng: string, startDate: string, endDate: string): Promise<any> {
    // Generate realistic mock data based on type and params
    switch (type) {
        case 'forecast':
            return generateMockForecast(startDate, endDate);
        case 'historical':
            return generateMockHistorical(startDate, endDate);
        case 'soil':
            return generateMockSoil(lat, lng);
        default:
            return { error: "Unknown data type requested" };
    }
}

/**
 * Generate mock forecast data
 */
function generateMockForecast(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const dailyData = [];

    for (let i = 0; i < days; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);

        // Generate somewhat realistic weather data with some variability
        const baseTemp = 25 + Math.sin(i / 3) * 5; // Oscillating temperature pattern

        dailyData.push({
            date: currentDate.toISOString().split('T')[0],
            temperature: {
                max: baseTemp + Math.random() * 3,
                min: baseTemp - 10 + Math.random() * 3,
                avg: baseTemp - 5 + Math.random() * 2
            },
            precipitation: Math.random() > 0.7 ? Math.random() * 10 : 0, // 30% chance of rain
            humidity: 50 + Math.random() * 30,
            windSpeed: 2 + Math.random() * 6,
            globalRadiation: 5000 + Math.random() * 3000
        });
    }

    return {
        forecast: {
            daily: dailyData
        }
    };
}

/**
 * Generate mock historical data
 */
function generateMockHistorical(startDate: string, endDate: string) {
    // Simple mock historical data
    return {
        historical: {
            temperature: {
                avg: 24.5,
                max: 35.2,
                min: 15.1
            },
            precipitation: {
                annual: 850,
                monthly: [45, 60, 75, 90, 120, 65, 45, 35, 70, 95, 85, 65]
            }
        }
    };
}

/**
 * Generate mock soil data
 */
function generateMockSoil(lat: string, lng: string) {
    // Generate mock soil data based on coordinates
    // This is very simplified - real soil data would be much more complex
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);

    // Use coordinates to deterministically generate different soil types
    // This creates a simple pattern across different locations
    const soilTextureIndex = Math.floor((Math.abs(latNum * 10) + Math.abs(lngNum * 10)) % 12) + 1;

    const soilTextureMap: { [key: number]: string } = {
        1: "Clay (Cl)",
        2: "Silty Clay (SiCl)",
        3: "Sandy Clay (SaCl)",
        4: "Clay Loam (ClLo)",
        5: "Silty Clay Loam (SiClLo)",
        6: "Sandy Clay Loam (SaClLo)",
        7: "Loam (Lo)",
        8: "Silty Loam (SiLo)",
        9: "Sandy Loam (SaLo)",
        10: "Silt (Si)",
        11: "Loamy Sand (LoSa)",
        12: "Sand (Sa)"
    };

    return {
        soil: {
            texture: soilTextureMap[soilTextureIndex],
            properties: {
                bulkDensity: 1.2 + Math.random() * 0.4,
                organicMatter: 1 + Math.random() * 3,
                ph: 5.5 + Math.random() * 2.5,
                waterHoldingCapacity: 0.1 + Math.random() * 0.2,
                cationExchangeCapacity: 5 + Math.random() * 15
            }
        }
    };
}