import { NextRequest, NextResponse } from 'next/server';

// Import mock products data
import mockProductsData from '@/public/data/mock-products.json';

export async function GET(request: NextRequest) {
    try {
        // In a real implementation, we would fetch from a database or external API
        // For this hackathon, we're using our mock data

        // Let's add a small delay to simulate API latency
        await new Promise(resolve => setTimeout(resolve, 300));

        return NextResponse.json(mockProductsData);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { error: 'Failed to fetch products' },
            { status: 500 }
        );
    }
}
