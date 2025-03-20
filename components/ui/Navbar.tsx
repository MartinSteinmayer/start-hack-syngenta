import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
    return (
        <header className="bg-green-500 py-3">
            <div className="container max-w-screen-xl mx-auto px-4 lg:px-20 flex justify-between items-center">
                {/* Project Name */}
                <Link href="/" className="flex items-center">
                    <div className="text-xl font-bold text-white">Farm Bio-Boost</div>
                    <div className="text-sm text-white ml-2">Simulator</div>
                </Link>

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
        </header>
    );
}
