"use client";

import { useState, useEffect } from 'react';
import { Product } from '@/types/products';

interface UseProductsReturn {
    products: Product[];
    isLoading: boolean;
    error: string | null;
    filterProductsByCategory: (category: string | null) => Product[];
    filterProductsByCrop: (cropType: string | null) => Product[];
    getProductById: (id: string) => Product | undefined;
}

export function useProducts(): UseProductsReturn {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/products');

                if (!response.ok) {
                    throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                setProducts(data.products || []);
                setError(null);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Failed to load products. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Filter products by category
    const filterProductsByCategory = (category: string | null): Product[] => {
        if (!category) return products;
        return products.filter(product => product.category.toLowerCase() === category.toLowerCase());
    };

    // Filter products by crop compatibility
    const filterProductsByCrop = (cropType: string | null): Product[] => {
        if (!cropType) return products;
        return products.filter(product =>
            product.compatibleCrops.includes(cropType.toLowerCase())
        );
    };

    // Get a specific product by ID
    const getProductById = (id: string): Product | undefined => {
        return products.find(product => product.id === id);
    };

    return {
        products,
        isLoading,
        error,
        filterProductsByCategory,
        filterProductsByCrop,
        getProductById
    };
}
