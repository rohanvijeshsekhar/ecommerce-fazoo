import { useAuth } from './useAuth';
import type { PendingAction } from '../types/pendingAction';

/**
 * useGuestGuard — intercepts protected actions for guest users
 * AND blocks purchase actions for dealers without backend `can_purchase` approval.
 *
 * Usage:
 *   const { guardAction } = useGuestGuard(onOpenLoginModal, showToast);
 *
 *   // In a button onClick:
 *   if (!guardAction({ type: 'add-to-cart', payload: { item } })) return;
 *
 * Logic:
 * 1. If the user is a GUEST: stores PendingAction in AuthContext and opens login modal.
 * 2. If the user is authenticated but `can_purchase === false` AND the action is
 *    purchase-related ('add-to-cart', 'buy-now'): blocks with a toast message.
 * 3. Otherwise: returns true (action allowed).
 *
 * The `can_purchase` flag comes from the backend response and is the
 * single source of truth for dealer purchasing permissions.
 */

const PURCHASE_ACTIONS = new Set(['add-to-cart', 'buy-now']);

export function useGuestGuard(
  onOpenLoginModal: () => void,
  showToast?: (message: string) => void,
) {
  const { isAuthenticated, user, setPendingAction } = useAuth();

  const guardAction = (action: PendingAction): boolean => {
    // Gate 1: Guest check
    if (!isAuthenticated) {
      setPendingAction(action);
      onOpenLoginModal();
      return false;
    }

    // Gate 2: Dealer purchase permission check (backend-authoritative)
    if (PURCHASE_ACTIONS.has(action.type) && user?.can_purchase === false) {
      const msg =
        user.dealer_status === 'rejected'
          ? 'Your dealer application was rejected. Purchasing is disabled. Please contact support.'
          : 'Your dealer account is pending approval. Purchasing is disabled until approved.';
      showToast?.(msg);
      return false;
    }

    // Authenticated + allowed
    return true;
  };

  return { guardAction };
}
