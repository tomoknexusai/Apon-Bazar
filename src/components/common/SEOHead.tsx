/**
 * SEO Head Component
 * Project: APON BAZAR (আপন বাজার)
 */

import React, { useEffect } from 'react';
import { SEOProps } from '../../types';
import { updateMetaTags } from '../../lib/seo';
import { useAuth } from '../../context/AuthContext';

export const SEOHead: React.FC<SEOProps> = (props) => {
  const { systemSettings } = useAuth();

  useEffect(() => {
    updateMetaTags(props, systemSettings);
  }, [props.title, props.description, props.canonicalUrl, systemSettings]);

  return null;
};
