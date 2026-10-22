import React from 'react';

export const DEFAULT_CORPORATE_QUOTATION_STAMP = '/corporate-quotation-stamp.png';

export const corporateQuotationStampUrl = (value) =>
  value === 'none' ? null : value || DEFAULT_CORPORATE_QUOTATION_STAMP;

export default function CorporateQuotationStamp({ url, className = '' }) {
  const src = corporateQuotationStampUrl(url);
  if (!src) return null;

  return (
    <div className={`relative h-32 w-40 overflow-hidden ${className}`}>
      <img
        src={src}
        alt="Corporate quotations stamp"
        className={src === DEFAULT_CORPORATE_QUOTATION_STAMP
          ? 'absolute left-1/2 top-1/2 h-[440px] w-[330px] max-w-none -translate-x-1/2 -translate-y-1/2'
          : 'h-full w-full object-contain'}
      />
    </div>
  );
}
