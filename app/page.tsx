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
        <div className="max-w-5xl mx-auto">
            {/* Show the hero section if we're not in wizard mode */}
            {!showWizard && (
                <HeroSection onGetStarted={handleGetStarted} />
            )}

            {/* Show the wizard when the user clicks "Get Started" */}
            {showWizard && (
                <div id="setup-wizard" className="pt-4 pb-12">
                    <FarmSetupWizard />
                    
                    <div className="text-center mt-8">
                        <button 
                            onClick={() => setShowWizard(false)}
                            className="text-gray-500 hover:text-gray-700 text-sm underline"
                        >
                            Return to home page
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}