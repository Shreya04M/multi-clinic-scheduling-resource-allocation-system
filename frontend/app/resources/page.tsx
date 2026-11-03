"use client";

import { useEffect, useState } from "react";
import { ErrorState, LoadingState, PageHeader } from "../components/ui";
import { apiFetch } from "../lib/api";
import { useRequireAuth } from "../lib/auth";
import type { Equipment, Room } from "../lib/types";

export default function ResourcesPage() {
  const { loading: authLoading, user } = useRequireAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    apiFetch<{ rooms: Room[]; equipment: Equipment[] }>("/resources")
      .then(data => { setRooms(data.rooms); setEquipment(data.equipment); })
      .catch(error => setError(error instanceof Error ? error.message : "Could not load resources."));
  }, [user]);

  if (authLoading || !user) return <main className="module"><LoadingState label="Checking your session…" /></main>;
  return (
    <main className="module">
      <PageHeader eyebrow="RESOURCE MANAGEMENT" title="Rooms & equipment" description="Review the rooms and equipment available to your authorized clinics." />
      {error && <ErrorState message={error} />}
      <section className="card"><h2>Rooms</h2>{rooms.map(room => <p key={room.room_id}><strong>{room.room_number}</strong> · {room.room_type ?? "General"} · {room.status}</p>)}{rooms.length === 0 && <p>No rooms available.</p>}</section>
      <section className="card"><h2>Equipment</h2>{equipment.map(item => <p key={item.equipment_id}><strong>{item.equipment_name}</strong> · {item.equipment_type ?? "General"} · {item.status}</p>)}{equipment.length === 0 && <p>No equipment available.</p>}</section>
    </main>
  );
}
