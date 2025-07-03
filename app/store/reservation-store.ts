import { create } from 'zustand';

interface ReservationStore {
  lastReservationId: string | null;
  setLastReservationId: (id: string | null) => void;
}

export const useReservationStore = create<ReservationStore>((set) => ({
  lastReservationId: null,
  setLastReservationId: (id) => set({ lastReservationId: id }),
}));