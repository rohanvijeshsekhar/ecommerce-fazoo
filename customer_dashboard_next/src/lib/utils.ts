/**
 * Shared utility helper functions for FAAZO dashboard.
 */

/**
 * Resolves a URL slug back to its clean category display name.
 */
export function getCategoryDisplayName(slug: string): string {
  const mapping: Record<string, string> = {
    'dental-handpieces': 'Dental Handpieces',
    'intraoral-cameras': 'Intraoral Cameras',
    'led-light-cure-units': 'LED Light Cure Units',
    'dental-chairs': 'Dental Chairs',
    '3d-oral-scanners': '3D Oral Scanners',
    'dental-air-compressors': 'Dental Air Compressors',
    'advanced-dental-equipment-accessories': 'Advanced Dental Equipment & Accessories',
    'special-offers': 'Special Offers',
  };
  return mapping[slug.toLowerCase()] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Resolves a status string to a readable status label.
 */
export function getStatusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case 'pending_payment': return 'Pending Payment';
    case 'pending': return 'Pending';
    case 'processing': return 'Processing';
    case 'packed': return 'Packed';
    case 'shipped': return 'Shipped';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Cancelled';
    case 'returned': return 'Returned';
    default: return status || '';
  }
}
