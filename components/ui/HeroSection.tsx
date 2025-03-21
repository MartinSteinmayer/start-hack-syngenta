"use client";

import React from 'react';
import Image from 'next/image';
import Navbar from './Navbar';

interface HeroSectionProps {
    onGetStarted: () => void;
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
    return (
        <>
            {/* Full viewport background container */}
            <div className="fixed inset-0 z-0">
                <Image
                    src="/images/farm-hero.png"
                    alt="Sustainable farming landscape"
                    fill
                    priority
                    className="object-cover"
                />
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-black/20"></div>
            </div>

            {/* Header bar - positioned absolutely to maintain its position */}
            <Navbar />

            {/* Main content container - positioned absolutely to maintain layout */}
            <div className="fixed inset-0 z-5 flex items-center justify-center pt-16">
                <div className="text-center px-4 py-8 max-w-3xl mx-auto">
                        <Image 
                            src="/logo_white.png" 
                            alt="Crop & Paste" 
                            width={900} 
                            height={450} 
                            className="m-4"
                        />
                    <h2 className="text-2xl md:text-3xl text-white mb-8">
                        A digital copy of your farm.
                    </h2>

                    <div className="backdrop-blur-sm bg-white/10 rounded-xl p-6 mb-10 border border-white/20">
                        <h4 className="text-xl text-white mb-8">
                            Our AI-powered digital twin helps you visualize environmental risks,
                            recommend biological products for your specific crops, and track outcomes to
                            improve yields sustainably.
                        </h4>

                        {/* Get Started button */}
                        <button
                            onClick={onGetStarted}
                            className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg"
                        >
                            Get Started
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
