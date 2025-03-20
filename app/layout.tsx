import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/ui/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Farm Bio-Boost Simulator',
    description: 'Simulate the effects of biological products on crop performance',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${inter.className} bg-gray-50 min-h-screen`}>
                <main className="max-w-full mx-auto">{children}</main>
            </body>
        </html>
    );
}
