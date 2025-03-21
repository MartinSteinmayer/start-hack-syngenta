import { NextRequest, NextResponse } from 'next/server';

interface DroughtRiskRequest {
    rainfall: number;
    evaporation: number;
    soilMoisture: number;
    temperature: number;
}

interface DroughtRiskResponse {
    success: boolean;
    data: {
        droughtIndex: number;
        riskLevel: string;
        recommendation: string;
        warning: string | null;
        inputs: {
            rainfall: number;
            evaporation: number;
            soilMoisture: number;
            temperature: number;
        };
    };
    error?: string;
}

export async function POST(request: NextRequest) {
    try {
        const requestData: DroughtRiskRequest = await request.json();
        
        const { rainfall, evaporation, soilMoisture, temperature } = requestData;
        
        if (rainfall === undefined || evaporation === undefined || 
            soilMoisture === undefined || temperature === undefined) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'Missing required parameters: rainfall, evaporation, soilMoisture, and temperature are required' 
                },
                { status: 400 }
            );
        }
        
        if (isNaN(rainfall) || isNaN(evaporation) || isNaN(soilMoisture) || isNaN(temperature)) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'All parameters must be valid numbers' 
                },
                { status: 400 }
            );
        }
        
        if (temperature === 0) {
            return NextResponse.json(
                { 
                    success: false,
                    error: 'Temperature cannot be zero (division by zero error)' 
                },
                { status: 400 }
            );
        }
        
        const droughtIndex = ((rainfall - evaporation) + soilMoisture) / temperature;
        const roundedDI = parseFloat(droughtIndex.toFixed(2));
        
        let riskLevel = '';
        let recommendation = '';
        let warning: string | null = null;
        
        if (roundedDI > 1) {
            riskLevel = 'No risk';
            recommendation = 'Current conditions suggest adequate moisture for crops. Continue with standard crop management practices.';
        } else {
            riskLevel = 'Medium risk';
            recommendation = 'Monitor moisture levels closely. Consider implementing water conservation measures, drought-resistant crop varieties, and adjusted irrigation schedules if available.';
            
            // Calculate the estimated days until drought conditions based on droughtIndex
            // Lower index means drought will occur sooner
            const daysUntilDrought = Math.max(Math.round(Math.abs(roundedDI) * 4), 1); // Min 1 week
            
            warning = `Medium drought risk predicted in your crop area in ${daysUntilDrought} week(s). We recommend using Stress Buster to protect against stress conditions.`;
        }
        
        const response: DroughtRiskResponse = {
            success: true,
            data: {
                droughtIndex: roundedDI,
                riskLevel,
                recommendation,
                warning,
                inputs: {
                    rainfall,
                    evaporation,
                    soilMoisture,
                    temperature
                }
            }
        };
        
        return NextResponse.json(response);
        
    } catch (error) {
        console.error('Error calculating drought risk:', error);
        
        return NextResponse.json(
            { 
                success: false,
                error: 'Failed to calculate drought risk. Please check your input data and try again.' 
            },
            { status: 500 }
        );
    }
}