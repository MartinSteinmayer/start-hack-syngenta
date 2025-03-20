"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import HeroSection from '@/components/ui/HeroSection';
import FarmSetupWizard from '@/components/farm/FarmSetupWizard';
import Image from 'next/image';

export default function HomePage() {
    const [showWizard, setShowWizard] = useState(false);

    const handleGetStarted = () => {
        setShowWizard(true);
        // Smooth scroll to the wizard section
        setTimeout(() => {
            document.getElementById('setup-wizard')?.scrollIntoView({
                behavior: 'smooth'
            });
        }, 100);
    };

    return (
        <div className="relative min-h-screen">
            {/* Persistent Background Container */}
            <div className="fixed inset-0 z-0">
                <Image
                    src="/images/farm-hero.png"
                    alt="Sustainable farming landscape"
                    fill
                    priority
                    className="object-cover"
                />
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-black/40"></div>
            </div>

            {/* Header Bar */}
            <div className="fixed top-0 left-0 right-0 z-10 bg-green-500 py-3 px-4">
                <div className="container mx-auto max-w-5xl flex justify-between items-center">
                    <div className="flex items-center">
                        <span className="text-white font-bold text-xl">Farm Bio-Boost</span>
                        <span className="text-white ml-2">Simulator</span>
                    </div>
                    {/* Powered by Syngenta */}
                    <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">Powered by</span>
                        <Image
                            src="/images/syngenta-logo.png"
                            alt="Syngenta"
                            width={100}
                            height={30}
                            className="w-auto"
                        />
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="relative z-5 pt-16 min-h-screen">
                <div className="container mx-auto max-w-5xl">
                    {/* Show the hero section if we're not in wizard mode */}
                    {!showWizard && (
                        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
                            <HeroSection onGetStarted={handleGetStarted} />
                        </div>
                    )}

                    {/* Show the wizard when the user clicks "Get Started" */}
                    {showWizard && (
                        <div id="setup-wizard" className="pt-4 pb-12">
                            <FarmSetupWizard />

                            <div className="text-center mt-8">
                                <button
                                    onClick={() => setShowWizard(false)}
                                    className="text-white hover:text-gray-200 text-sm underline"
                                >
                                    Return to home page
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
