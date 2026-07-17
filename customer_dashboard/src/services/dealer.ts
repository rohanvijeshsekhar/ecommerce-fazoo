/**
 * FAAZO – Dealer Service
 *
 * Handles all dealer-portal-facing API calls.
 * Admin-facing dealer calls live in adminService.ts.
 *
 * Endpoints:
 *   GET /api/v1/dealer/status/ — dealer's own application status + can_purchase
 */

import { api } from './api';
import type { ApiResponse } from './auth';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DealerApplicationStatus {
  id: string;
  company_name: string;
  status: 'pending' | 'approved' | 'rejected';
  status_display: string;
  can_purchase: boolean;
  rejection_reason: string;
  created_at: string;
  reviewed_at: string | null;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const dealerService = {
  /**
   * GET /api/v1/dealer/status/
   * Returns the authenticated dealer's full application status and can_purchase flag.
   * Only accessible to users with role='dealer'.
   */
  async getStatus(): Promise<ApiResponse<DealerApplicationStatus>> {
    const response = await api.get('dealer/status/');
    return response.data;
  },
};
