import React, { useState } from 'react';
import productsData from '@/lib/data/products.json';

interface ProductsPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectProduct: (product: any) => void;
}

interface ProductTabProps {
    product: any;
    activeTab: string;
}

const ProductsPopup: React.FC<ProductsPopupProps> = ({ isOpen, onClose, onSelectProduct }) => {
    const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<string>('overview');

    if (!isOpen) return null;

    // Get products from the imported data
    const { products } = productsData;

    // Function to get appropriate icon for each product category
    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'biostimulant':
                return '🌱';
            case 'biofertilizer':
                return '💧';
            case 'biocontrol':
                return '🛡️';
            default:
                return '🌿';
        }
    };

    // Function to format crop-specific application rates
    const formatApplicationRates = (directions: any) => {
        if (!directions) return null;

        return (
            <div className="mt-2 space-y-1">
                {Object.entries(directions).map(([crop, info]: [string, any]) => (
                    <div key={crop} className="text-sm">
                        <span className="font-medium capitalize">{crop}:</span>{' '}
                        {info.dose && <span>{info.dose}</span>}
                        {info.period && <span> - {info.period}</span>}
                    </div>
                ))}
            </div>
        );
    };

    const renderProductDetailTabs = ({ product, activeTab }: ProductTabProps) => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-4">
                        <p className="text-gray-700">{product.description}</p>

                        {product.application_method && (
                            <div className="bg-green-50 p-3 rounded-md">
                                <h4 className="font-medium text-green-800 mb-1">Application Method</h4>
                                <p className="text-sm">{product.application_method}</p>

                                {product.timing && (
                                    <div className="mt-2">
                                        <h4 className="font-medium text-green-800 mb-1">Timing</h4>
                                        <p className="text-sm">{product.timing}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {product.key_benefits && product.key_benefits.length > 0 && (
                            <div>
                                <h4 className="font-medium text-green-800 mb-2">Key Benefits</h4>
                                <ul className="list-disc pl-5 text-sm space-y-1">
                                    {product.key_benefits.map((benefit: string, idx: number) => (
                                        <li key={idx}>{benefit}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                );

            case 'application':
                return (
                    <div className="space-y-4">
                        {product.directions_for_use && (
                            <div>
                                <h4 className="font-medium text-green-800 mb-2">Application Instructions</h4>
                                {formatApplicationRates(product.directions_for_use)}
                            </div>
                        )}

                        {product.application_rates && (
                            <div>
                                <h4 className="font-medium text-green-800 mb-2">Application Rates</h4>

                                {product.application_rates.foliar_application && (
                                    <div className="mb-3">
                                        <h5 className="text-sm font-medium text-green-700 mb-1">Foliar Application</h5>
                                        {formatApplicationRates(product.application_rates.foliar_application)}
                                    </div>
                                )}

                                {product.application_rates.seed_treatment && (
                                    <div>
                                        <h5 className="text-sm font-medium text-green-700 mb-1">Seed Treatment</h5>
                                        {formatApplicationRates(product.application_rates.seed_treatment)}
                                    </div>
                                )}
                            </div>
                        )}

                        {product.composition && (
                            <div>
                                <h4 className="font-medium text-green-800 mb-1">Composition</h4>
                                <p className="text-sm">{product.composition}</p>
                            </div>
                        )}

                        {product.notes && (
                            <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800">
                                <p className="italic">{product.notes}</p>
                            </div>
                        )}
                    </div>
                );

            case 'evidence':
                return (
                    <div className="space-y-4">
                        <h4 className="font-medium text-green-800 mb-2">Scientific Evidence</h4>

                        {product.scientific_evidence && (
                            <div className="space-y-3">
                                {/* Transcriptomics */}
                                {product.scientific_evidence.transcriptomics && (
                                    <div className="bg-blue-50 p-3 rounded-md">
                                        <h5 className="text-sm font-medium text-blue-800 mb-1">Transcriptomics</h5>
                                        {typeof product.scientific_evidence.transcriptomics === 'string' ? (
                                            <p className="text-sm">{product.scientific_evidence.transcriptomics}</p>
                                        ) : (
                                            <div>
                                                {product.scientific_evidence.transcriptomics.description && (
                                                    <p className="text-sm mb-2">{product.scientific_evidence.transcriptomics.description}</p>
                                                )}

                                                {product.scientific_evidence.transcriptomics.activities && (
                                                    <ul className="list-disc pl-5 text-xs space-y-1">
                                                        {product.scientific_evidence.transcriptomics.activities.map((item: string, idx: number) => (
                                                            <li key={idx}>{item}</li>
                                                        ))}
                                                    </ul>
                                                )}

                                                {product.scientific_evidence.transcriptomics.non_stressed_plants && (
                                                    <div className="mt-2">
                                                        <p className="text-xs font-medium">Non-stressed plants:</p>
                                                        <p className="text-xs">{product.scientific_evidence.transcriptomics.non_stressed_plants}</p>
                                                    </div>
                                                )}

                                                {product.scientific_evidence.transcriptomics.drought_stressed_plants && (
                                                    <div className="mt-2">
                                                        <p className="text-xs font-medium">Drought-stressed plants:</p>
                                                        <p className="text-xs">{product.scientific_evidence.transcriptomics.drought_stressed_plants}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Phenomics */}
                                {product.scientific_evidence.phenomics && (
                                    <div className="bg-purple-50 p-3 rounded-md">
                                        <h5 className="text-sm font-medium text-purple-800 mb-1">Phenomics</h5>
                                        {typeof product.scientific_evidence.phenomics === 'string' ? (
                                            <p className="text-sm">{product.scientific_evidence.phenomics}</p>
                                        ) : (
                                            <div>
                                                {product.scientific_evidence.phenomics.description && (
                                                    <p className="text-sm mb-2">{product.scientific_evidence.phenomics.description}</p>
                                                )}

                                                {product.scientific_evidence.phenomics.improvements && (
                                                    <ul className="list-disc pl-5 text-xs space-y-1">
                                                        {product.scientific_evidence.phenomics.improvements.map((item: string, idx: number) => (
                                                            <li key={idx}>{item}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Metabolomics */}
                                {product.scientific_evidence.metabolomics && (
                                    <div className="bg-green-50 p-3 rounded-md">
                                        <h5 className="text-sm font-medium text-green-800 mb-1">Metabolomics</h5>
                                        <p className="text-sm">{product.scientific_evidence.metabolomics}</p>
                                    </div>
                                )}

                                {/* Trial Results */}
                                {product.scientific_evidence.trials && (
                                    <div className="bg-amber-50 p-3 rounded-md">
                                        <h5 className="text-sm font-medium text-amber-800 mb-1">Trials</h5>
                                        <p className="text-sm">{product.scientific_evidence.trials}</p>

                                        {product.scientific_evidence.results && (
                                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                                {product.scientific_evidence.results.win_rate && (
                                                    <div className="bg-white p-2 rounded-md">
                                                        <span className="font-medium">Win Rate:</span> {product.scientific_evidence.results.win_rate}
                                                    </div>
                                                )}
                                                {product.scientific_evidence.results.yield_increase_percentage && (
                                                    <div className="bg-white p-2 rounded-md">
                                                        <span className="font-medium">Yield Increase:</span> {product.scientific_evidence.results.yield_increase_percentage}
                                                    </div>
                                                )}
                                                {product.scientific_evidence.results.yield_increase_kg_ha && (
                                                    <div className="bg-white p-2 rounded-md">
                                                        <span className="font-medium">Yield Gain:</span> {product.scientific_evidence.results.yield_increase_kg_ha}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );

            case 'results':
                return (
                    <div className="space-y-4">
                        <h4 className="font-medium text-green-800 mb-2">Field Trial Results</h4>

                        {product.field_trial_results && (
                            <div className="space-y-4">
                                {/* Crop Performance */}
                                {product.field_trial_results.crop_performance && (
                                    <div>
                                        <h5 className="text-sm font-medium text-green-700 mb-2">Crop Performance</h5>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {Object.entries(product.field_trial_results.crop_performance).map(([crop, data]: [string, any]) => (
                                                <div key={crop} className="bg-green-50 p-3 rounded-md">
                                                    <h6 className="text-sm font-medium capitalize mb-1">{crop.replace('_', ' ')}</h6>

                                                    <div className="grid grid-cols-2 gap-1 text-xs">
                                                        {data.yield_increase && (
                                                            <div className="bg-white p-2 rounded-md">
                                                                <span className="font-medium">Yield Increase:</span> {data.yield_increase}
                                                            </div>
                                                        )}
                                                        {data.yield_increase_percentage && (
                                                            <div className="bg-white p-2 rounded-md">
                                                                <span className="font-medium">Yield %:</span> +{data.yield_increase_percentage}%
                                                            </div>
                                                        )}
                                                        {data.roi && (
                                                            <div className="bg-white p-2 rounded-md">
                                                                <span className="font-medium">ROI:</span> {data.roi}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Stress Conditions */}
                                {product.field_trial_results.stress_conditions && (
                                    <div>
                                        <h5 className="text-sm font-medium text-amber-700 mb-2">Stress Conditions</h5>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {Object.entries(product.field_trial_results.stress_conditions).map(([condition, data]: [string, any]) => (
                                                <div key={condition} className="bg-amber-50 p-3 rounded-md">
                                                    <h6 className="text-sm font-medium capitalize mb-1">{condition}</h6>

                                                    <div className="space-y-1 text-xs">
                                                        {data.evidences && (
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Trials:</span>
                                                                <span>{data.evidences}</span>
                                                            </div>
                                                        )}
                                                        {data.win_rate && (
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Win Rate:</span>
                                                                <span>{data.win_rate}</span>
                                                            </div>
                                                        )}
                                                        {data.yield_increase && (
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Yield Effect:</span>
                                                                <span>{data.yield_increase}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Trial Notes */}
                                {product.field_trial_results.notes && (
                                    <div className="bg-blue-50 p-3 rounded-md text-sm">
                                        <p className="italic text-blue-800">{product.field_trial_results.notes}</p>
                                    </div>
                                )}

                                {/* Additional Trials Info */}
                                {product.field_trial_results.trials && (
                                    <div className="space-y-2">
                                        {Object.entries(product.field_trial_results.trials).map(([trial, info]: [string, any]) => (
                                            <div key={trial} className="bg-gray-50 p-3 rounded-md">
                                                <p className="text-sm">{info}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with blur effect */}
            <div
                className="absolute inset-0 backdrop-blur-sm bg-white/30"
                onClick={onClose}
            ></div>

            {/* Popup content */}
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-green-700">Select Biological Product</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <p className="text-gray-600 mb-6">
                    Select a biological product to apply to your simulation. Each product has different effects
                    on crop growth, stress tolerance, and yield potential. Expand a product to see detailed information.
                </p>

                <div className="grid grid-cols-1 gap-6">
                    {products.map((product, index) => (
                        <div
                            key={index}
                            className={`border rounded-lg overflow-hidden transition-all duration-300 ${expandedProductId === index
                                    ? 'border-green-500 shadow-md'
                                    : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                                }`}
                        >
                            {/* Product Header - Always visible */}
                            <div
                                className={`p-5 cursor-pointer ${expandedProductId === index ? 'bg-green-50' : ''}`}
                                onClick={() => setExpandedProductId(expandedProductId === index ? null : index)}
                            >
                                <div className="flex items-start">
                                    <div className="text-3xl mr-4">
                                        {getCategoryIcon(product.category)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xl font-semibold text-green-600">{product.name}</h3>
                                            <svg
                                                className={`w-5 h-5 text-green-600 transform transition-transform ${expandedProductId === index ? 'rotate-180' : ''
                                                    }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                        <p className="text-sm text-gray-500 mb-1">
                                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium mr-2">
                                                {product.category}
                                            </span>
                                            {product.type && (
                                                <span className="text-gray-500">{product.type}</span>
                                            )}
                                        </p>

                                        {/* Short description visible when collapsed */}
                                        {expandedProductId !== index && (
                                            <p className="text-gray-700 line-clamp-2 mt-2">{product.description}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedProductId === index && (
                                <div className="border-t border-gray-200">
                                    {/* Tabs */}
                                    <div className="border-b border-gray-200 px-5">
                                        <div className="flex space-x-4 overflow-x-auto">
                                            <button
                                                className={`py-3 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'overview'
                                                        ? 'border-green-500 text-green-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                    }`}
                                                onClick={() => setActiveTab('overview')}
                                            >
                                                Overview
                                            </button>
                                            <button
                                                className={`py-3 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'application'
                                                        ? 'border-green-500 text-green-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                    }`}
                                                onClick={() => setActiveTab('application')}
                                            >
                                                Application
                                            </button>
                                            <button
                                                className={`py-3 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'evidence'
                                                        ? 'border-green-500 text-green-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                    }`}
                                                onClick={() => setActiveTab('evidence')}
                                            >
                                                Scientific Evidence
                                            </button>
                                            <button
                                                className={`py-3 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'results'
                                                        ? 'border-green-500 text-green-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                    }`}
                                                onClick={() => setActiveTab('results')}
                                            >
                                                Field Results
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tab Content */}
                                    <div className="p-5">
                                        {renderProductDetailTabs({ product, activeTab })}
                                    </div>

                                    {/* Action Button */}
                                    <div className="p-5 bg-gray-50 flex justify-end">
                                        <button
                                            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectProduct(product);
                                            }}
                                        >
                                            Apply Product
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProductsPopup;
