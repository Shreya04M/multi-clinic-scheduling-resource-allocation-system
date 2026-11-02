"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DemoBanner, EmptyState, ErrorState, Field, LoadingState, Modal, PageHeader, Toast } from "../components/ui";
import EquipmentForm from "../components/resources/EquipmentForm";
import EquipmentTable from "../components/resources/EquipmentTable";
import RoomForm from "../components/resources/RoomForm";
import RoomTable from "../components/resources/RoomTable";
import { MOCK_CLINICS } from "../lib/mock-reference";
import { loadMockEquipment, loadMockRooms } from "../lib/mock-resources";
import { EQUIPMENT_STATUSES, ROOM_STATUSES, type Equipment, type EquipmentInput, type Room, type RoomInput } from "../lib/types";

const simulateError = () => new URLSearchParams(window.location.search).get("simulate") === "error";

export default function ResourcesPage() {
  const [toast, setToast] = useState("");

  // ---- Rooms ----
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState("");
  const [roomSearch, setRoomSearch] = useState("");
  const [roomClinic, setRoomClinic] = useState("");
  const [roomStatus, setRoomStatus] = useState("");
  const [editingRoom, setEditingRoom] = useState<Room | "new" | null>(null);

  const loadRooms = useCallback(() => {
    setRoomsLoading(true);
    setRoomsError("");
    loadMockRooms(simulateError())
      .then(setRooms)
      .catch((e: Error) => setRoomsError(e.message))
      .finally(() => setRoomsLoading(false));
  }, []);

  useEffect(loadRooms, [loadRooms]);

  const roomStatusOptions = useMemo(() => Array.from(new Set<string>([...ROOM_STATUSES, ...rooms.map(r => r.status)])), [rooms]);

  const filteredRooms = useMemo(() => {
    const term = roomSearch.trim().toLowerCase();
    return rooms.filter(r =>
      (!term || String(r.room_id).includes(term) || r.room_number.toLowerCase().includes(term)) &&
      (!roomClinic || String(r.clinic_id) === roomClinic) &&
      (!roomStatus || r.status === roomStatus),
    );
  }, [rooms, roomSearch, roomClinic, roomStatus]);

  const roomFiltersActive = Boolean(roomSearch.trim() || roomClinic || roomStatus);
  const clearRoomFilters = () => {
    setRoomSearch("");
    setRoomClinic("");
    setRoomStatus("");
  };

  const saveRoom = (input: RoomInput) => {
    if (editingRoom === "new") {
      const nextId = rooms.reduce((max, r) => Math.max(max, r.room_id), 600) + 1;
      setRooms(list => [...list, { room_id: nextId, ...input }]);
      setToast(`Demo only: room ${input.room_number} was added on this page (ID ${nextId}) and not saved to MySQL.`);
    } else if (editingRoom) {
      const updated = { ...editingRoom, ...input };
      setRooms(list => list.map(r => (r.room_id === updated.room_id ? updated : r)));
      setToast(`Demo only: changes to room ${updated.room_number} were applied on this page, not saved to MySQL.`);
    }
    setEditingRoom(null);
  };

  // ---- Equipment ----
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [equipLoading, setEquipLoading] = useState(true);
  const [equipError, setEquipError] = useState("");
  const [equipSearch, setEquipSearch] = useState("");
  const [equipClinic, setEquipClinic] = useState("");
  const [equipStatus, setEquipStatus] = useState("");
  const [editingEquip, setEditingEquip] = useState<Equipment | "new" | null>(null);

  const loadEquipment = useCallback(() => {
    setEquipLoading(true);
    setEquipError("");
    loadMockEquipment(simulateError())
      .then(setEquipment)
      .catch((e: Error) => setEquipError(e.message))
      .finally(() => setEquipLoading(false));
  }, []);

  useEffect(loadEquipment, [loadEquipment]);

  const equipStatusOptions = useMemo(() => Array.from(new Set<string>([...EQUIPMENT_STATUSES, ...equipment.map(e => e.status)])), [equipment]);

  const filteredEquipment = useMemo(() => {
    const term = equipSearch.trim().toLowerCase();
    return equipment.filter(e =>
      (!term || String(e.equipment_id).includes(term) || e.equipment_name.toLowerCase().includes(term)) &&
      (!equipClinic || String(e.clinic_id) === equipClinic) &&
      (!equipStatus || e.status === equipStatus),
    );
  }, [equipment, equipSearch, equipClinic, equipStatus]);

  const equipFiltersActive = Boolean(equipSearch.trim() || equipClinic || equipStatus);
  const clearEquipFilters = () => {
    setEquipSearch("");
    setEquipClinic("");
    setEquipStatus("");
  };

  const saveEquipment = (input: EquipmentInput) => {
    if (editingEquip === "new") {
      const nextId = equipment.reduce((max, e) => Math.max(max, e.equipment_id), 700) + 1;
      setEquipment(list => [...list, { equipment_id: nextId, ...input }]);
      setToast(`Demo only: ${input.equipment_name} was added on this page (ID ${nextId}) and not saved to MySQL.`);
    } else if (editingEquip) {
      const updated = { ...editingEquip, ...input };
      setEquipment(list => list.map(e => (e.equipment_id === updated.equipment_id ? updated : e)));
      setToast(`Demo only: changes to ${updated.equipment_name} were applied on this page, not saved to MySQL.`);
    }
    setEditingEquip(null);
  };

  return (
    <main className="module">
      <PageHeader eyebrow="CLINIC RESOURCE MANAGEMENT" title="Rooms & equipment" description="View and maintain clinic rooms and equipment records. Bookings are allocated by the scheduling service." />
      <DemoBanner>Room and equipment API endpoints do not exist yet. Records are local sample data based on database/seed.sql, and edits last only until the page is reloaded.</DemoBanner>

      <section className="card" aria-labelledby="rooms-title">
        <div className="card-head">
          <h2 id="rooms-title">Rooms</h2>
          <button className="btn" onClick={() => setEditingRoom("new")} disabled={roomsLoading || Boolean(roomsError)}>+ Add room</button>
        </div>
        <div className="toolbar" role="search" aria-label="Filter rooms">
          <div className="field grow">
            <label htmlFor="room-search">Search by room number or room ID</label>
            <input id="room-search" type="search" placeholder="e.g. 101 or 604" value={roomSearch} onChange={e => setRoomSearch(e.target.value)} />
          </div>
          <Field id="room-clinic" label="Clinic">
            <select id="room-clinic" value={roomClinic} onChange={e => setRoomClinic(e.target.value)}>
              <option value="">All clinics</option>
              {MOCK_CLINICS.map(c => <option key={c.clinic_id} value={c.clinic_id}>{c.clinic_name}</option>)}
            </select>
          </Field>
          <Field id="room-status" label="Status">
            <select id="room-status" value={roomStatus} onChange={e => setRoomStatus(e.target.value)}>
              <option value="">All statuses</option>
              {roomStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <button className="btn secondary" onClick={clearRoomFilters} disabled={!roomFiltersActive}>Clear filters</button>
        </div>
        {roomsLoading ? (
          <LoadingState label="Loading rooms…" />
        ) : roomsError ? (
          <ErrorState message={roomsError} onRetry={loadRooms} />
        ) : rooms.length === 0 ? (
          <EmptyState title="No rooms yet" message="No room records exist yet." />
        ) : filteredRooms.length === 0 ? (
          <EmptyState title="No matching rooms" message="No rooms match the current search or filters." action={<button className="btn secondary" onClick={clearRoomFilters}>Clear filters</button>} />
        ) : (
          <>
            <RoomTable rooms={filteredRooms} onEdit={setEditingRoom} />
            <p className="result-count">Showing {filteredRooms.length} of {rooms.length} rooms</p>
          </>
        )}
      </section>

      <section className="card" aria-labelledby="equipment-title">
        <div className="card-head">
          <h2 id="equipment-title">Equipment</h2>
          <button className="btn" onClick={() => setEditingEquip("new")} disabled={equipLoading || Boolean(equipError)}>+ Add equipment</button>
        </div>
        <div className="toolbar" role="search" aria-label="Filter equipment">
          <div className="field grow">
            <label htmlFor="equip-search">Search by equipment name or ID</label>
            <input id="equip-search" type="search" placeholder="e.g. ECG or 701" value={equipSearch} onChange={e => setEquipSearch(e.target.value)} />
          </div>
          <Field id="equip-clinic" label="Clinic">
            <select id="equip-clinic" value={equipClinic} onChange={e => setEquipClinic(e.target.value)}>
              <option value="">All clinics</option>
              {MOCK_CLINICS.map(c => <option key={c.clinic_id} value={c.clinic_id}>{c.clinic_name}</option>)}
            </select>
          </Field>
          <Field id="equip-status" label="Operational status">
            <select id="equip-status" value={equipStatus} onChange={e => setEquipStatus(e.target.value)}>
              <option value="">All statuses</option>
              {equipStatusOptions.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </Field>
          <button className="btn secondary" onClick={clearEquipFilters} disabled={!equipFiltersActive}>Clear filters</button>
        </div>
        {equipLoading ? (
          <LoadingState label="Loading equipment…" />
        ) : equipError ? (
          <ErrorState message={equipError} onRetry={loadEquipment} />
        ) : equipment.length === 0 ? (
          <EmptyState title="No equipment yet" message="No equipment records exist yet." />
        ) : filteredEquipment.length === 0 ? (
          <EmptyState title="No matching equipment" message="No equipment matches the current search or filters." action={<button className="btn secondary" onClick={clearEquipFilters}>Clear filters</button>} />
        ) : (
          <>
            <EquipmentTable equipment={filteredEquipment} onEdit={setEditingEquip} />
            <p className="result-count">Showing {filteredEquipment.length} of {equipment.length} equipment items</p>
          </>
        )}
      </section>

      {editingEquip && (
        <Modal title={editingEquip === "new" ? "Add equipment" : `Edit equipment #${editingEquip.equipment_id}`} onClose={() => setEditingEquip(null)} wide>
          <EquipmentForm initial={editingEquip === "new" ? undefined : editingEquip} onSubmit={saveEquipment} onCancel={() => setEditingEquip(null)} />
        </Modal>
      )}
      {editingRoom && (
        <Modal title={editingRoom === "new" ? "Add room" : `Edit room #${editingRoom.room_id}`} onClose={() => setEditingRoom(null)} wide>
          <RoomForm initial={editingRoom === "new" ? undefined : editingRoom} existing={rooms} onSubmit={saveRoom} onCancel={() => setEditingRoom(null)} />
        </Modal>
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast("")} />}
    </main>
  );
}
