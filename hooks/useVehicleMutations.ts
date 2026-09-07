import { useCallback, useRef } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import type { TFunction } from 'i18next';
import type { AuditLogEntry, Toast, User, Vehicle } from '../types';
import { logAction } from '../services/auditLogService';
import { resolveVehicleFromApi } from '../services/vehicleIdentityService';
import { filterVehiclesBySellerEmail } from '../utils/sellerVehicleFilter';
import {
  findVehicleByIdentity,
  normalizeVehicleIdentity,
  VehicleMutationIdentityError,
} from '../utils/vehicleIdentity';
import { logInfo, logError } from '../utils/logger';
import { getUserFriendlyErrorMessage } from '../components/AppProvider/helpers';
import type { VehicleUpdateOptions } from '../types/appContext';

export type UseVehicleMutationsArgs = {
  vehicles: Vehicle[];
  sellerInventoryRef: MutableRefObject<Vehicle[]>;
  currentUser: User | null;
  setVehicles: Dispatch<SetStateAction<Vehicle[]>>;
  setSellerInventory: Dispatch<SetStateAction<Vehicle[]>>;
  setAuditLog: Dispatch<SetStateAction<AuditLogEntry[]>>;
  syncVehicleCachesById: (id: number, updater: (vehicle: Vehicle) => Vehicle | null) => void;
  addToast: (message: string, type: Toast['type']) => void;
  t: TFunction;
};

/**
 * Vehicle update + server sync helpers (extracted from AppProvider).
 */
export function useVehicleMutations(args: UseVehicleMutationsArgs) {
  const {
    vehicles,
    sellerInventoryRef,
    currentUser,
    setVehicles,
    setSellerInventory,
    setAuditLog,
    syncVehicleCachesById,
    addToast,
    t,
  } = args;

  const updatingVehiclesRef = useRef<Set<number>>(new Set());

  const updateVehicleHandler = useCallback(async (id: number, updates: Partial<Vehicle>, options: VehicleUpdateOptions = {}) => {
    // Prevent duplicate updates for the same vehicle
    if (updatingVehiclesRef.current.has(id)) {
      return;
    }

    const viewCountOnly =
      Object.keys(updates).length === 1 &&
      Object.prototype.hasOwnProperty.call(updates, 'views') &&
      typeof updates.views === 'number';

    if (viewCountOnly) {
      const applyViewCount = (vehicle: Vehicle | undefined) =>
        vehicle && vehicle.id === id ? { ...vehicle, views: updates.views as number } : vehicle;

      setVehicles((prev) =>
        Array.isArray(prev) ? prev.map((vehicle) => applyViewCount(vehicle) ?? vehicle) : [],
      );
      setSellerInventory((prev) =>
        filterVehiclesBySellerEmail(
          Array.isArray(prev) ? prev.map((vehicle) => applyViewCount(vehicle) ?? vehicle) : [],
          currentUser?.email,
        ),
      );
      syncVehicleCachesById(id, (existing) =>
        existing ? { ...existing, views: updates.views as number } : existing,
      );
      return;
    }

    try {
      // Mark vehicle as being updated
      updatingVehiclesRef.current.add(id);

      let vehicleToUpdate =
        findVehicleByIdentity(vehicles, id, options.databaseId) ||
        findVehicleByIdentity(sellerInventoryRef.current, id, options.databaseId);
      if (!vehicleToUpdate) {
        updatingVehiclesRef.current.delete(id);
        const notFoundError = new Error(t('toast.vehicleNotFound'));
        addToast(t('toast.vehicleNotFound'), 'error');
        throw notFoundError;
      }

      vehicleToUpdate = normalizeVehicleIdentity(vehicleToUpdate);
      const hintDatabaseId = options.databaseId?.trim() || vehicleToUpdate.databaseId?.trim();
      if (!vehicleToUpdate.databaseId?.trim()) {
        const recovered = await resolveVehicleFromApi(id, hintDatabaseId);
        if (recovered) {
          vehicleToUpdate = recovered;
          setVehicles((prev) =>
            Array.isArray(prev)
              ? prev.map((v) =>
                  findVehicleByIdentity([v], id, recovered.databaseId) ? { ...v, ...recovered } : v,
                )
              : [recovered],
          );
          setSellerInventory((prev) =>
            filterVehiclesBySellerEmail(
              Array.isArray(prev)
                ? prev.map((v) =>
                    findVehicleByIdentity([v], id, recovered.databaseId) ? { ...v, ...recovered } : v,
                  )
                : [],
              currentUser?.email,
            ),
          );
        }
      }

      const mergedForApi = normalizeVehicleIdentity({ ...vehicleToUpdate, ...updates });
      if (!mergedForApi.databaseId?.trim()) {
        throw new VehicleMutationIdentityError();
      }

      const { successMessage, skipToast } = options;
      const wasFeatured = Boolean(vehicleToUpdate.isFeatured);
      const statusChanged = updates.status !== undefined && updates.status !== vehicleToUpdate.status;
      let fallbackMessage = t('toast.vehicleUpdatedSuccess');
      if (statusChanged) {
        fallbackMessage = t('toast.vehicleStatusUpdated', { status: String(updates.status) });
      } else if (updates.isFeatured === true && !wasFeatured) {
        fallbackMessage = t('toast.vehicleFeaturedSuccess');
      } else if (updates.isFeatured === false && wasFeatured) {
        fallbackMessage = t('toast.vehicleUnfeaturedSuccess');
      }

      // Optimistic UI + instant toast (before API round-trip)
      setVehicles((prev) =>
        Array.isArray(prev)
          ? prev.map((vehicle) =>
              vehicle && findVehicleByIdentity([vehicle], id, mergedForApi.databaseId)
                ? mergedForApi
                : vehicle,
            )
          : [],
      );
      setSellerInventory((prev) =>
        filterVehiclesBySellerEmail(
          Array.isArray(prev)
            ? prev.map((vehicle) =>
                vehicle && findVehicleByIdentity([vehicle], id, mergedForApi.databaseId)
                  ? mergedForApi
                  : vehicle,
              )
            : [],
          currentUser?.email,
        ),
      );
      syncVehicleCachesById(id, () => mergedForApi);

      if (!skipToast) {
        addToast(successMessage ?? fallbackMessage, 'success');
      }

      const { updateVehicle: updateVehicleApi } = await import('../services/vehicleService');
      const result = normalizeVehicleIdentity(await updateVehicleApi(mergedForApi));

      setVehicles(prev =>
        Array.isArray(prev) ? prev.map(vehicle =>
          vehicle && findVehicleByIdentity([vehicle], id, result.databaseId) ? result : vehicle,
        ) : []
      );
      setSellerInventory((prev) =>
        filterVehiclesBySellerEmail(
          Array.isArray(prev)
            ? prev.map((vehicle) =>
                vehicle && findVehicleByIdentity([vehicle], id, result.databaseId) ? result : vehicle,
              )
            : [],
          currentUser?.email,
        ),
      );
      syncVehicleCachesById(id, () => result);

      // Log audit entry for vehicle update
      const actor = currentUser?.name || currentUser?.email || 'System';
      const updateFields = Object.keys(updates).join(', ');
      const vehicleInfo = `${vehicleToUpdate.make} ${vehicleToUpdate.model} (ID: ${id})`;
      const entry = logAction(actor, 'Update Vehicle', vehicleInfo, `Updated fields: ${updateFields}`);
      setAuditLog(prev => [entry, ...prev]);

      if (process.env.NODE_ENV === 'development') {
        logInfo('✅ Vehicle updated via API:', result);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        logError('❌ Failed to update vehicle:', error);
      }
      const message = getUserFriendlyErrorMessage(error, t('toast.vehicleUpdateFailed'));
      addToast(message, 'error');
      throw error;
    } finally {
      // Always remove from updating set, even if there was an error
      updatingVehiclesRef.current.delete(id);
    }
    // PERFORMANCE: Setters (setVehicles, setAuditLog) are stable and don't need to be in deps
    // But including them is harmless and makes the intent clear
  }, [vehicles, addToast, currentUser, t, syncVehicleCachesById, setVehicles, setSellerInventory, setAuditLog, sellerInventoryRef]);

  const syncVehicleFromServer = useCallback((vehicle: Vehicle) => {
    const result = normalizeVehicleIdentity(vehicle);
    setVehicles((prev) => {
      const list = Array.isArray(prev) ? [...prev] : [];
      const idx = list.findIndex(
        (v) => v && findVehicleByIdentity([v], result.id, result.databaseId),
      );
      if (result.status === 'published') {
        if (idx >= 0) {
          list[idx] = result;
        } else {
          list.push(result);
        }
        return list;
      }
      if (result.status === 'sold' || result.status === 'archived') {
        if (idx >= 0) list.splice(idx, 1);
        return list;
      }
      if (idx >= 0) {
        list[idx] = result;
        return list;
      }
      return list;
    });
    setSellerInventory((prev) => {
      const list = Array.isArray(prev) ? [...prev] : [];
      const idx = list.findIndex(
        (v) => v && findVehicleByIdentity([v], result.id, result.databaseId),
      );
      if (idx >= 0) {
        list[idx] = result;
      } else if (result.status === 'sold' || result.status === 'archived') {
        list.push(result);
      }
      return filterVehiclesBySellerEmail(list, currentUser?.email);
    });
    syncVehicleCachesById(result.id, () => result);
  }, [currentUser?.email, syncVehicleCachesById, setVehicles, setSellerInventory]);

  return { updateVehicleHandler, syncVehicleFromServer };
}
