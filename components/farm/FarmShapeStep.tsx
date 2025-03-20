// components/farm/FarmShapeStep.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface FarmShapeStepProps {
    farmLocation: { latitude: number; longitude: number; name: string };
    farmSize: number;
    onComplete: (polygonPoints: Array<{ latitude: number; longitude: number }>) => void;
    onBack: () => void;
}

const FarmShapeStep: React.FC<FarmShapeStepProps> = ({
    farmLocation,
    farmSize,
    onComplete,
    onBack
}) => {
    const [satelliteImage, setSatelliteImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [polygonPoints, setPolygonPoints] = useState<Array<{ x: number; y: number }>>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [farmPolygon, setFarmPolygon] = useState<Array<{ latitude: number; longitude: number }> | null>(null);
    const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // Fetch satellite image when component mounts or when location/size changes
    useEffect(() => {
        fetchSatelliteImage();
    }, [farmLocation, farmSize]);

    // Initialize canvas when image is loaded
    useEffect(() => {
        if (satelliteImage && imageRef.current) {
            // We'll set up the canvas after the image is fully loaded
            const img = imageRef.current;

            const handleImageLoad = () => {
                if (canvasRef.current && imageRef.current) {
                    // Store the natural dimensions of the image
                    const width = imageRef.current.naturalWidth;
                    const height = imageRef.current.naturalHeight;

                    // Set canvas dimensions based on the natural image size
                    setCanvasDimensions({ width, height });

                    // Set the canvas size to match the image exactly
                    // This is important for preventing scaling/zooming issues
                    canvasRef.current.width = width;
                    canvasRef.current.height = height;

                    // Clear canvas
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                    }
                }
            };

            // Check if image is already loaded
            if (img.complete) {
                handleImageLoad();
            } else {
                // Add load event listener
                img.addEventListener('load', handleImageLoad);
                // Cleanup
                return () => {
                    img.removeEventListener('load', handleImageLoad);
                };
            }
        }
    }, [satelliteImage]);

    // Update canvas when dimensions change or when redrawing polygon
    useEffect(() => {
        if (canvasRef.current && canvasDimensions.width > 0 && canvasDimensions.height > 0) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (ctx) {
                // Set canvas internal dimensions to match image's natural size
                canvas.width = canvasDimensions.width;
                canvas.height = canvasDimensions.height;

                // Clear the canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw the polygon points and lines
                if (polygonPoints.length > 0) {
                    // Draw the polygon points
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 2;

                    // Draw lines between points
                    if (polygonPoints.length > 1) {
                        ctx.beginPath();
                        ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);

                        for (let i = 1; i < polygonPoints.length; i++) {
                            ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
                        }

                        // Close the polygon if we have more than 2 points
                        if (polygonPoints.length > 2) {
                            ctx.lineTo(polygonPoints[0].x, polygonPoints[0].y);
                        }

                        ctx.stroke();

                        // Fill the polygon with a semi-transparent color
                        if (polygonPoints.length > 2) {
                            ctx.fillStyle = 'rgba(255, 165, 0, 0.3)';
                            ctx.fill();
                        }
                    }

                    // Draw points
                    polygonPoints.forEach((point, index) => {
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                        ctx.fill();

                        // Label the points
                        ctx.fillStyle = 'white';
                        ctx.strokeStyle = 'black';
                        ctx.lineWidth = 1;
                        ctx.font = '12px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.strokeText(String(index + 1), point.x, point.y);
                        ctx.fillText(String(index + 1), point.x, point.y);
                    });
                }
            }
        }
    }, [polygonPoints, canvasDimensions]);

    // Fetch satellite image from API
    const fetchSatelliteImage = async () => {
        if (!farmLocation || !farmSize) {
            setError("Location or farm size not specified");
            return;
        }

        setIsLoading(true);
        setError(null);

        // First, check if we're in development mode and should use a workaround
        const isDevelopment = process.env.NODE_ENV === 'development';

        try {
            // API endpoint based on your Python API
            const apiUrl = 'https://start-hack-syngenta-api.vercel.app/satellite';
            const params = new URLSearchParams({
                latitude: farmLocation.latitude.toString(),
                longitude: farmLocation.longitude.toString(),
                hectares: farmSize.toString(),
                start_date: '2023-01-01',
                end_date: '2025-03-20'
            });

            let imageUrl: string;

            try {
                // Try the direct fetch first
                const response = await fetch(`${apiUrl}?${params}`);

                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }

                // Convert response to blob and create URL
                const imageBlob = await response.blob();
                imageUrl = URL.createObjectURL(imageBlob);
            } catch (corsError: any) {
                // If we detect a CORS error, try the workaround
                if (corsError.message.includes('CORS') || corsError.name === 'TypeError') {
                    console.warn('CORS error detected, using fallback method');

                    if (isDevelopment) {
                        // In development, use a Next.js API route proxy
                        const proxyUrl = '/api/satellite-proxy';
                        const proxyResponse = await fetch(proxyUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                latitude: farmLocation.latitude,
                                longitude: farmLocation.longitude,
                                hectares: farmSize,
                                start_date: '2023-01-01',
                                end_date: '2025-03-20'
                            })
                        });

                        if (!proxyResponse.ok) {
                            throw new Error(`Proxy request failed with status ${proxyResponse.status}`);
                        }

                        const imageBlob = await proxyResponse.blob();
                        imageUrl = URL.createObjectURL(imageBlob);
                    } else {
                        // If proxy isn't available, fall back to a placeholder or demo image
                        console.warn('Fallback to demo satellite image');
                        // Using a placeholder image for demo purposes
                        imageUrl = "/images/demo-satellite-image.jpg";
                    }
                } else {
                    // If it's not a CORS error, rethrow
                    throw corsError;
                }
            }

            // Set the image URL
            setSatelliteImage(imageUrl);

            // Reset polygon data when loading a new image
            setPolygonPoints([]);
            setFarmPolygon(null);
            setIsLoading(false);
        } catch (err: any) {
            console.error('Error fetching satellite image:', err);

            // Provide more specific error messaging for common issues
            if (err.message?.includes('CORS')) {
                setError("CORS error: The satellite API server needs to allow requests from your frontend. Please add CORS headers to your Python API or use a proxy.");
            } else if (err.name === 'TypeError' && err.message?.includes('Failed to fetch')) {
                setError("Connection error: Cannot connect to the satellite API. Make sure the API server is running at http://localhost:5032");
            } else {
                setError(`Error fetching satellite image: ${err.message}`);
            }

            // Fall back to a demo image in development mode
            if (isDevelopment) {
                console.warn('Falling back to demo satellite image');
                setSatelliteImage("/images/demo-satellite-image.jpg");
            }

            setIsLoading(false);
        }
    };

    // Handle canvas click for adding polygon points
    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Calculate the scale ratio between the canvas element size and its internal dimensions
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        // Get the click position in canvas coordinates
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        setPolygonPoints([...polygonPoints, { x, y }]);
    };

    // Start drawing mode
    const startDrawing = () => {
        setIsDrawing(true);
        setPolygonPoints([]);
        setFarmPolygon(null);
    };

    // Complete the polygon
    const completePolygon = () => {
        if (polygonPoints.length < 3) {
            setError('You need at least 3 points to form a polygon.');
            return;
        }

        if (!imageRef.current) {
            setError('Image reference not available');
            return;
        }

        // Convert canvas coordinates to geo coordinates
        const imageWidth = canvasDimensions.width;
        const imageHeight = canvasDimensions.height;

        // This is a simplified conversion - in a real app you'd use proper geo-transformation
        const geoPolygon = polygonPoints.map(point => {
            // Convert canvas x,y to normalized 0-1 coordinates
            const normalizedX = point.x / imageWidth;
            const normalizedY = point.y / imageHeight;

            // Simple linear transformation from image space to geo space
            // This assumes the image covers a rectangular area centered on farmLocation
            // with a certain km per pixel resolution (derived from hectares)
            const bufferKm = Math.sqrt(farmSize * 0.01 / Math.PI) * 1.1; // Same calculation as in the API

            // Approximate degrees per km at the equator
            const degreesPerKm = 1 / 111;

            // Calculate lat/lon offset from center (very simplified)
            const lonOffset = (normalizedX - 0.5) * bufferKm * 2 * degreesPerKm;
            const latOffset = (0.5 - normalizedY) * bufferKm * 2 * degreesPerKm;

            return {
                latitude: farmLocation.latitude + latOffset,
                longitude: farmLocation.longitude + lonOffset
            };
        });

        setFarmPolygon(geoPolygon);
        setIsDrawing(false);
    };

    // Undo last point
    const undoLastPoint = () => {
        if (polygonPoints.length > 0) {
            setPolygonPoints(polygonPoints.slice(0, -1));
        }
    };

    // Reset polygon
    const resetPolygon = () => {
        setPolygonPoints([]);
        setFarmPolygon(null);
    };

    // Continue to next step
    const handleContinue = () => {
        if (farmPolygon) {
            onComplete(farmPolygon);
        } else {
            setError('Please complete the farm boundary before continuing.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-green-800">Define Your Farm Boundary</h2>
            <p className="text-gray-600 mb-6">
                Draw the boundary of your farm on the satellite image to create a precise polygon of your fields.
            </p>

            {isLoading ? (
                <div className="flex justify-center items-center h-64 bg-gray-100 rounded-lg">
                    <div className="text-center">
                        <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-2 text-green-700">Loading satellite image...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
                    <p className="font-medium">Error:</p>
                    <p>{error}</p>
                    <button
                        onClick={fetchSatelliteImage}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Try Again
                    </button>
                </div>
            ) : (
                <div>
                    {/* Image and drawing canvas */}
                    {satelliteImage && (
                        <div className="mb-6">
                            <div className="flex justify-between mb-3">
                                <div className="text-sm text-gray-600">
                                    <strong>Location:</strong> {farmLocation.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                    <strong>Farm Size:</strong> {farmSize} hectares
                                </div>
                            </div>

                            <div className="flex space-x-2 mb-4">
                                <button
                                    onClick={startDrawing}
                                    disabled={isDrawing}
                                    className={`px-4 py-2 rounded-md font-medium ${isDrawing
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                >
                                    Start Drawing Farm Boundary
                                </button>

                                {isDrawing && (
                                    <>
                                        <button
                                            onClick={completePolygon}
                                            disabled={polygonPoints.length < 3}
                                            className={`px-4 py-2 rounded-md font-medium ${polygonPoints.length < 3
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                                }`}
                                        >
                                            Complete Polygon
                                        </button>
                                        <button
                                            onClick={undoLastPoint}
                                            disabled={polygonPoints.length === 0}
                                            className={`px-4 py-2 rounded-md font-medium ${polygonPoints.length === 0
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-yellow-600 text-white hover:bg-yellow-700'
                                                }`}
                                        >
                                            Undo Last Point
                                        </button>
                                        <button
                                            onClick={resetPolygon}
                                            className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700"
                                        >
                                            Reset
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="relative w-[400px] mx-auto border rounded-lg overflow-hidden bg-gray-100" ref={imageContainerRef}>
                                {/* Hidden Image (used only for loading the source) */}
                                <img
                                    ref={imageRef}
                                    src={satelliteImage}
                                    alt="Satellite view of farm location"
                                    className="w-full h-auto"
                                    style={{ display: 'none' }} // Hide the original image
                                />

                                {/* Visible image container with fixed dimensions */}
                                <div
                                    className="relative"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        backgroundImage: `url(${satelliteImage})`,
                                        backgroundPosition: 'center',
                                        backgroundSize: 'contain',
                                        backgroundRepeat: 'no-repeat',
                                        aspectRatio: canvasDimensions.width && canvasDimensions.height
                                            ? `${canvasDimensions.width} / ${canvasDimensions.height}`
                                            : 'auto'
                                    }}
                                >
                                    {/* Canvas overlay - positioned absolutely within the container */}
                                    <canvas
                                        ref={canvasRef}
                                        onClick={handleCanvasClick}
                                        className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                                        style={{
                                            pointerEvents: isDrawing ? 'auto' : 'none'
                                        }}
                                    ></canvas>
                                </div>

                            </div>
                            {isDrawing && (
                                <div className="bg-white mx-auto max-w-fit mt-2 text-center p-2 text-sm">
                                    <p>Click to add points. Add at least 3 points and click "Complete Polygon".</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Farm polygon data and navigation buttons */}
                    {farmPolygon && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
                            <h3 className="font-medium text-green-800 mb-2">Farm Boundary Defined!</h3>
                            <p className="text-sm text-green-700 mb-2">
                                You've successfully defined your farm boundary with {farmPolygon.length} points.
                                This shape will be used for your simulation.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6">
                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                    Back
                </button>

                <button
                    onClick={handleContinue}
                    disabled={!farmPolygon}
                    className={`px-6 py-2 rounded-md ${!farmPolygon
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default FarmShapeStep;
