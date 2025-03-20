import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import FarmSetup from '@/components/farm/FarmSetup';

export default function HomePage() {
    return (
        <div className="max-w-5xl mx-auto">
            <section className="mb-12 text-center">
                <h2 className="text-3xl font-bold mb-4">
                    Welcome to the Farm Bio-Boost Simulator
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                    Test the effects of biological products on your farm before applying them in real life
                </p>
                <div className="flex justify-center gap-6">
                    <Card className="max-w-md p-6 bg-white rounded-lg shadow-lg">
                        <h3 className="text-xl font-semibold mb-4">
                            Benefits of biological products:
                        </h3>
                        <ul className="list-disc pl-5 space-y-2 text-left mb-6">
                            <li>Improve crop resilience to environmental stresses</li>
                            <li>Enhance nutrient uptake efficiency</li>
                            <li>Boost overall yield and quality</li>
                            <li>Support sustainable farming practices</li>
                        </ul>
                    </Card>
                </div>
            </section>

            <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6 text-center">Set Up Your Farm</h2>
                <FarmSetup />
            </section>

            <section className="text-center">
                <p className="text-gray-600 mb-4">
                    Already have a farm set up?
                </p>
                <Link href="/simulation">
                    <Button variant="outline" size="lg">
                        Go to Simulation
                    </Button>
                </Link>
            </section>
        </div>
    );
}
