import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
                <header className="bg-green-600 text-white py-4 shadow-md">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold">Farm Bio-Boost Simulator</h1>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm">Powered by</span>
                                <img
                                    src="/images/syngenta-logo.png"
                                    alt="Syngenta"
                                    className="h-8"
                                    width={120}
                                    height={32}
                                />
                            </div>
                        </div>
                    </div>
                </header>
                <main className="container mx-auto px-4 py-8">{children}</main>
                <footer className="bg-gray-100 border-t py-6 mt-12">
                    <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
                        <p>Farm Bio-Boost Simulator - START Hack 2025</p>
                    </div>
                </footer>
            </body>
        </html>
    );
}
