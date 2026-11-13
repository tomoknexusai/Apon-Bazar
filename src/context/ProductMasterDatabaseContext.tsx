/**
 * Master Product Database Context
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 * Strictly stores and enforces the hierarchical relationships:
 * CATEGORY → SUBCATEGORY → BRAND → PRODUCT
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProductCategory, Brand, BrandRequest } from '../types';
import { initialCategories, initialBrands, normalizeBrandName } from '../lib/ecommerce-data';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

interface ProductMasterDatabaseContextType {
  categories: ProductCategory[];
  brands: Brand[];
  brandRequests: BrandRequest[];

  // Hierarchical Data Lookups & Relationship Validation
  getSubCategoriesByCategory: (categoryId: string) => string[];
  getBrandsByCategoryAndSubCategory: (categoryId: string, subCategoryName?: string) => Brand[];
  validateHierarchy: (categoryId: string, subCategoryName: string, brandId: string) => { valid: boolean; reason?: string };

  // Master Management Mutations
  addCategory: (categoryData: Omit<ProductCategory, 'id' | 'slug'>) => { success: boolean; message: string; category?: ProductCategory };
  addSubCategoryToCategory: (categoryId: string, newSubCategoryName: string) => { success: boolean; message: string };
  addBrand: (brandData: Omit<Brand, 'id'>) => { success: boolean; message: string; brand?: Brand };
  editBrand: (brandId: string, updatedData: Partial<Brand>) => void;
  deleteBrand: (brandId: string) => void;

  // Brand Approval Requests
  requestNewBrand: (requestData: Omit<BrandRequest, 'id' | 'status' | 'createdAt'>) => { success: boolean; message: string };
  approveBrandRequest: (requestId: string) => void;
  rejectBrandRequest: (requestId: string, reason: string) => void;
}

const ProductMasterDatabaseContext = createContext<ProductMasterDatabaseContextType | undefined>(undefined);

export const ProductMasterDatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { addToast } = useNotifications();

  // Load persistent state or fall back to master initial data
  const [categories, setCategories] = useState<ProductCategory[]>(() => {
    const saved = localStorage.getItem('ghorerbazar_master_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [brands, setBrands] = useState<Brand[]>(() => {
    const saved = localStorage.getItem('ghorerbazar_master_brands');
    return saved ? JSON.parse(saved) : initialBrands;
  });

  const [brandRequests, setBrandRequests] = useState<BrandRequest[]>(() => {
    const saved = localStorage.getItem('ghorerbazar_master_brand_requests');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'breq-001',
        brandName: 'ACI Organic Foods',
        brandType: 'Local Brand',
        countryOfOrigin: 'Bangladesh',
        categoryId: 'cat-grocery',
        categoryName: 'গ্রোসারী ও খাদ্য উপাদান',
        subCategory: 'রান্নার তেল (Cooking Oil)',
        requestedByUserId: 'usr-dealer-001',
        requestedByUserName: 'মেসার্স ভাই ভাই এন্টারপ্রাইজ',
        requestedByUserRole: 'dealer',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ];
  });

  // Save changes to localStorage for persistent master catalog state
  useEffect(() => {
    localStorage.setItem('ghorerbazar_master_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('ghorerbazar_master_brands', JSON.stringify(brands));
  }, [brands]);

  useEffect(() => {
    localStorage.setItem('ghorerbazar_master_brand_requests', JSON.stringify(brandRequests));
  }, [brandRequests]);

  // ==========================================
  // HIERARCHY LOOKUP ENGINE
  // Category → Subcategory → Brand
  // ==========================================

  // 1. Get Subcategories strictly belonging to a specific Category
  const getSubCategoriesByCategory = (categoryId: string): string[] => {
    if (!categoryId || categoryId === 'all') return [];
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.subCategories : [];
  };

  // 2. Get Brands strictly belonging to Category + Subcategory
  const getBrandsByCategoryAndSubCategory = (categoryId: string, subCategoryName?: string): Brand[] => {
    if (!categoryId || categoryId === 'all') return brands.filter((b) => b.status === 'active');

    return brands.filter((b) => {
      if (b.status === 'inactive') return false;

      // Local & Other Brands act as universal fallbacks, but must be checked if explicitly mapped
      if (b.brandType === 'Local Brand' || b.brandType === 'Other Brand') {
        // If brand specifies categories, check categoryId match
        if (b.categoryIds && b.categoryIds.length > 0 && !b.categoryIds.includes(categoryId)) {
          return false;
        }
        return true;
      }

      // Check Category relationship
      const matchesCat = !b.categoryIds || b.categoryIds.length === 0 || b.categoryIds.includes(categoryId);
      if (!matchesCat) return false;

      // Check Subcategory relationship
      if (subCategoryName && subCategoryName.trim() !== '' && b.subCategories && b.subCategories.length > 0) {
        return b.subCategories.some(
          (sc) => sc.trim().toLowerCase() === subCategoryName.trim().toLowerCase()
        );
      }

      return true;
    });
  };

  // 3. Strict Backend & API Validation Engine
  const validateHierarchy = (
    categoryId: string,
    subCategoryName: string,
    brandId: string
  ): { valid: boolean; reason?: string } => {
    // Check Category
    const catObj = categories.find((c) => c.id === categoryId);
    if (!catObj) {
      return { valid: false, reason: `Invalid Category ID: "${categoryId}" does not exist.` };
    }

    // Check Subcategory belongs to Category
    if (!subCategoryName || !catObj.subCategories.includes(subCategoryName)) {
      return {
        valid: false,
        reason: `Subcategory "${subCategoryName}" does not belong to Category "${catObj.nameBn}".`
      };
    }

    // Check Brand belongs to Category + Subcategory
    const availableBrands = getBrandsByCategoryAndSubCategory(categoryId, subCategoryName);
    const brandMatches = availableBrands.some((b) => b.id === brandId);
    if (!brandMatches) {
      return {
        valid: false,
        reason: `Brand ID "${brandId}" is not allowed under Category "${catObj.nameBn}" ➔ Subcategory "${subCategoryName}".`
      };
    }

    return { valid: true };
  };

  // ==========================================
  // MASTER MUTATION HANDLERS
  // ==========================================

  const addCategory = (categoryData: Omit<ProductCategory, 'id' | 'slug'>) => {
    const slug = categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = categories.find((c) => c.slug === slug || c.nameBn === categoryData.nameBn);
    if (existing) {
      return { success: false, message: 'এই ক্যাটাগরিটি ইতিমধ্যে মাস্টার ডাটাবেজে সংরক্ষিত রয়েছে।' };
    }

    const newCat: ProductCategory = {
      ...categoryData,
      id: `cat-${Date.now()}`,
      slug,
      status: 'active',
      subCategories: categoryData.subCategories || ['সাধারণ সাব-ক্যাটাগরি']
    };

    setCategories((prev) => [...prev, newCat]);
    addToast({ title: 'ক্যাটাগরি যোগ হয়েছে', message: `"${newCat.nameBn}" মাস্টার ডিরেক্টরিতে যুক্ত হয়েছে।`, type: 'success' });
    return { success: true, message: 'ক্যাটাগরি সফলভাবে যোগ হয়েছে।', category: newCat };
  };

  const addSubCategoryToCategory = (categoryId: string, newSubCategoryName: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return { success: false, message: 'প্যারেন্ট ক্যাটাগরি পাওয়া যায়নি।' };

    const trimmed = newSubCategoryName.trim();
    if (!trimmed) return { success: false, message: 'সাব-ক্যাটাগরির নাম দিন।' };

    if (cat.subCategories.includes(trimmed)) {
      return { success: false, message: 'উক্ত সাব-ক্যাটাগরিটি এই ক্যাটাগরিতে ইতিমধ্যে রয়েছে।' };
    }

    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, subCategories: [...c.subCategories, trimmed] } : c))
    );

    addToast({ title: 'সাব-ক্যাটাগরি যোগ হয়েছে', message: `"${trimmed}" সাব-ক্যাটাগরিটি যুক্ত হয়েছে।`, type: 'success' });
    return { success: true, message: 'সাব-ক্যাটাগরি সফলভাবে যোগ হয়েছে।' };
  };

  const addBrand = (brandData: Omit<Brand, 'id'>) => {
    const normalizedNew = normalizeBrandName(brandData.name);
    const existing = brands.find((b) => normalizeBrandName(b.name) === normalizedNew);
    if (existing) {
      return { success: false, message: `"${brandData.name}" ব্র্যান্ডটি ইতিমধ্যে নিবন্ধিত রয়েছে।` };
    }

    const newBrand: Brand = {
      ...brandData,
      id: `brand-${Date.now()}`,
      status: 'active',
      isApproved: true
    };

    setBrands((prev) => [...prev, newBrand]);
    addToast({ title: 'ব্র্যান্ড নিবন্ধিত হয়েছে', message: `"${newBrand.name}" মাস্টার ডিরেক্টরিতে যুক্ত হয়েছে।`, type: 'success' });
    return { success: true, message: 'ব্র্যান্ড সফলভাবে সংযুক্ত হয়েছে।', brand: newBrand };
  };

  const editBrand = (brandId: string, updatedData: Partial<Brand>) => {
    setBrands((prev) => prev.map((b) => (b.id === brandId ? { ...b, ...updatedData } : b)));
    addToast({ title: 'ব্র্যান্ড তথ্য হালনাগাদ', message: 'ব্র্যান্ডের তথ্য সফলভাবে আপডেট করা হয়েছে।', type: 'info' });
  };

  const deleteBrand = (brandId: string) => {
    setBrands((prev) => prev.filter((b) => b.id !== brandId));
    addToast({ title: 'ব্র্যান্ড অপসারিত', message: 'ব্র্যান্ডটি মাস্টার তালিকা থেকে সরানো হয়েছে।', type: 'warning' });
  };

  // ==========================================
  // BRAND REQUEST HANDLERS
  // ==========================================

  const requestNewBrand = (requestData: Omit<BrandRequest, 'id' | 'status' | 'createdAt'>) => {
    const normalizedNew = normalizeBrandName(requestData.brandName);
    const existingBrand = brands.find((b) => normalizeBrandName(b.name) === normalizedNew);
    if (existingBrand) {
      return { success: false, message: `"${requestData.brandName}" ব্র্যান্ডটি ইতিমধ্যে সক্রিয় রয়েছে।` };
    }

    const pendingReq = brandRequests.find(
      (r) => r.status === 'pending' && normalizeBrandName(r.brandName) === normalizedNew
    );
    if (pendingReq) {
      return { success: false, message: `"${requestData.brandName}" অনুমোদনের জন্য পেন্ডিং অবস্থায় রয়েছে।` };
    }

    const newReq: BrandRequest = {
      ...requestData,
      id: `breq-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setBrandRequests((prev) => [newReq, ...prev]);
    addToast({
      title: 'ব্র্যান্ড আবেদনের নোটিফিকেশন',
      message: `"${requestData.brandName}" ব্র্যান্ডটি এডমিন অনুমোদনের জন্য জমা দেওয়া হয়েছে।`,
      type: 'info'
    });
    return { success: true, message: 'ব্র্যান্ড অনুমোদনের আবেদন সফলভাবে প্রেরিত হয়েছে।' };
  };

  const approveBrandRequest = (requestId: string) => {
    const req = brandRequests.find((r) => r.id === requestId);
    if (!req) return;

    addBrand({
      name: req.brandName,
      brandType: req.brandType,
      countryOfOrigin: req.countryOfOrigin || 'Bangladesh',
      logoUrl: req.logoUrl,
      status: 'active',
      categoryIds: req.categoryId ? [req.categoryId] : [],
      subCategories: req.subCategory ? [req.subCategory] : []
    });

    setBrandRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'approved' } : r))
    );

    addToast({ title: 'ব্র্যান্ড অনুমোদিত', message: `"${req.brandName}" অনুমোদন পেয়ে সক্রিয় হয়েছে।`, type: 'success' });
  };

  const rejectBrandRequest = (requestId: string, reason: string) => {
    setBrandRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: 'rejected', rejectionReason: reason } : r))
    );
    addToast({ title: 'আবেদন বাতিল', message: 'ব্র্যান্ড আবেদনটি বাতিল করা হয়েছে।', type: 'warning' });
  };

  return (
    <ProductMasterDatabaseContext.Provider
      value={{
        categories,
        brands,
        brandRequests,
        getSubCategoriesByCategory,
        getBrandsByCategoryAndSubCategory,
        validateHierarchy,
        addCategory,
        addSubCategoryToCategory,
        addBrand,
        editBrand,
        deleteBrand,
        requestNewBrand,
        approveBrandRequest,
        rejectBrandRequest
      }}
    >
      {children}
    </ProductMasterDatabaseContext.Provider>
  );
};

export const useProductMasterDatabase = () => {
  const context = useContext(ProductMasterDatabaseContext);
  if (!context) {
    throw new Error('useProductMasterDatabase must be used within a ProductMasterDatabaseProvider');
  }
  return context;
};
