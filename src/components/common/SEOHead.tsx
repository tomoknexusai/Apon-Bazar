/**
 * SEO Head Component
 * Project: APON BAZAR (আপন বাজার)
 */

import React, { useEffect } from 'react';
import { SEOProps } from '../../types';
import { updateMetaTags } from '../../lib/seo';

export const SEOHead: React.FC<SEOProps> = (props) => {
  useEffect(() => {
    updateMetaTags(props);
  }, [props.title, props.description, props.canonicalUrl]);

  return null;
};
