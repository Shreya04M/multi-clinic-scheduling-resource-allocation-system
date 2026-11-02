"use client";
import type { Equipment, Room } from "../../lib/types";

interface Props {
  rooms: Room[] | null; // null while loading or after a load error
  equipment: Equipment[] | null;
  roomsFiltered: boolean;
  equipmentFiltered: boolean;
}

/**
 * Counts are derived from the records currently shown in each table, so they
 * follow the active filters. "Available"/"operational" are record statuses only,
 * not a live check of whether a room or item is free at a given time.
 */
export default function ResourceSummary({ rooms, equipment, roomsFiltered, equipmentFiltered }: Props) {
  const count = (list: { status: string }[] | null, status?: string) =>
    list === null ? "—" : String(status ? list.filter(i => i.status === status).length : list.length);

  const tiles = [
    { label: "Total rooms", value: count(rooms), scope: roomsFiltered },
    { label: "Rooms with status 'available'", value: count(rooms, "available"), scope: roomsFiltered },
    { label: "Total equipment", value: count(equipment), scope: equipmentFiltered },
    { label: "Equipment with status 'operational'", value: count(equipment, "operational"), scope: equipmentFiltered },
  ];

  return (
    <section className="card" aria-labelledby="summary-title">
      <div className="card-head">
        <h2 id="summary-title">Resource summary</h2>
        <span className="muted">Counted from the records shown below (demo data)</span>
      </div>
      <div className="summary-grid">
        {tiles.map(t => (
          <div className="summary-tile" key={t.label}>
            <span>{t.label}</span>
            <strong>{t.value}</strong>
            <small>{t.scope ? "Filtered view" : "All records"}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
