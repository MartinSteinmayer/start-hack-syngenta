"use client";

import React, { useState } from 'react';
import { Crop, CropType } from '@/types/farm';
import { Button } from '@/components/ui/Button';

interface CropSelectorProps {
    crops: Crop[];
    onChange: (crops: Crop[]) => void;
    totalFarmSize: number;
    className?: string;
}

// Crop type options with metadata
const cropOptions: Array<{
    value: CropType;
    label: string;
    description: string;
    icon: string;
}> = [
        {
            value: 'rice',
            label: 'Rice',
            description: 'Thrives in warm, wet conditions with high rainfall',
            icon: '🌾',
        },
        {
            value: 'wheat',
            label: 'Wheat',
            description: 'Adaptable to various climates, requires moderate rainfall',
            icon: '🌿',
        },
        {
            value: 'corn',
            label: 'Corn',
            description: 'Needs warm soil and plenty of sunshine',
            icon: '🌽',
        },
        {
            value: 'soybean',
            label: 'Soybean',
            description: 'Fixes nitrogen, grows well in warm climates',
            icon: '🌱',
        },
        {
            value: 'cotton',
            label: 'Cotton',
            description: 'Requires long, frost-free periods and plenty of sunshine',
            icon: '🧶',
        },
        {
            value: 'vegetable',
            label: 'Vegetables',
            description: 'Various vegetable crops with different requirements',
            icon: '🥦',
        },
        {
            value: 'fruit',
            label: 'Fruit',
            description: 'Tree and shrub fruits typically requiring good drainage',
            icon: '🍎',
        },
    ];

export default function CropSelector({
    crops,
    onChange,
    totalFarmSize,
    className = '',
}: CropSelectorProps) {
    const [validationError, setValidationError] = useState<string | null>(null);

    // Calculate total acreage currently allocated
    const allocatedAcreage = crops.reduce((sum, crop) => sum + crop.acreage, 0);
    const remainingAcreage = totalFarmSize - allocatedAcreage;

    // Function to add a new crop
    const handleAddCrop = () => {
        // Default to first available crop type not yet selected
        const usedCropTypes = crops.map(crop => crop.type);
        const availableCropType = cropOptions.find(
            option => !usedCropTypes.includes(option.value)
        )?.value || cropOptions[0].value;

        const newCrop: Crop = {
            id: `crop_${Date.now()}`,
            name: `New ${cropOptions.find(c => c.value === availableCropType)?.label || 'Crop'}`,
            type: availableCropType,
            acreage: Math.min(1, remainingAcreage) // Use remaining acreage or 1, whichever is smaller
        };

        if (remainingAcreage <= 0) {
            setValidationError('Cannot add more crops. Increase farm size or reduce other crop acreages.');
            return;
        }

        onChange([...crops, newCrop]);
        setValidationError(null);
    };

    // Function to remove a crop
    const handleRemoveCrop = (cropId: string) => {
        onChange(crops.filter(crop => crop.id !== cropId));
        setValidationError(null);
    };

    // Function to update a crop
    const handleCropChange = (index: number, updatedCrop: Partial<Crop>) => {
        const newCrops = [...crops];
        newCrops[index] = { ...newCrops[index], ...updatedCrop };

        // Validate acreage
        const totalAcreage = newCrops.reduce((sum, crop) => sum + crop.acreage, 0);
        if (totalAcreage > totalFarmSize) {
            setValidationError(`Total acreage (${totalAcreage}) exceeds farm size (${totalFarmSize})`);
            // Still update the state, but with the validation error
        } else {
            setValidationError(null);
        }

        onChange(newCrops);
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Crops ({crops.length})</h3>
                <div className="text-sm text-gray-500">
                    Acreage: {allocatedAcreage} / {totalFarmSize}
                    ({remainingAcreage >= 0 ? `${remainingAcreage} available` : `${Math.abs(remainingAcreage)} over limit`})
                </div>
            </div>

            {validationError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                    {validationError}
                </div>
            )}

            <div className="space-y-3">
                {crops.map((crop, index) => (
                    <div
                        key={crop.id}
                        className="p-4 border rounded-lg bg-white shadow-sm flex flex-col sm:flex-row gap-4"
                    >
                        <div className="flex-1 space-y-4">
                            <div>
                                <label htmlFor={`crop-type-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                    Crop Type
                                </label>
                                <select
                                    id={`crop-type-${index}`}
                                    value={crop.type}
                                    onChange={(e) => handleCropChange(index, { type: e.target.value as CropType })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                >
                                    {cropOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.icon} {option.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    {cropOptions.find(c => c.value === crop.type)?.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-row sm:flex-col justify-between items-center sm:items-end space-y-0 sm:space-y-4">
                            <div className="w-full max-w-[120px]">
                                <label htmlFor={`crop-acreage-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                                    Acreage
                                </label>
                                <input
                                    id={`crop-acreage-${index}`}
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    value={crop.acreage}
                                    onChange={(e) => handleCropChange(index, { acreage: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                />
                            </div>

                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveCrop(crop.id)}
                                className="mt-4 sm:mt-0"
                                aria-label={`Remove ${crop.name}`}
                            >
                                Remove
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <Button
                variant="outline"
                onClick={handleAddCrop}
                disabled={remainingAcreage <= 0}
                className="w-full"
            >
                + Add Crop
            </Button>

            {crops.length === 0 && (
                <div className="text-center p-8 border border-dashed rounded-lg">
                    <p className="text-gray-500">No crops added yet. Click the button above to add your first crop.</p>
                </div>
            )}
        </div>
    );
}
