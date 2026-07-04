"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Visit = {
  id: string;
  merchandiserId: string;
  outletId: string;
  enteredAt: Timestamp;
  exitedAt?: Timestamp;
  durationMinutes?: number;
  accumulatedMs?: number;
  lastStatusChange?: Timestamp;
  status: "active" | "paused" | "completed" | "auto-closed";
  lastLocation?: { lat: number; lng: number };
};

export default function AdminDashboard() {
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "visits"), (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Visit[];

      setVisits(data);
    });

    return () => unsub();
  }, []);

  const formatTime = (timestamp?: Timestamp) => {
    if (!timestamp) return "—";
    return timestamp.toDate().toLocaleTimeString();
  };

  const calculateLiveMinutes = (visit: Visit) => {
    if (visit.status === "completed" || visit.status === "auto-closed") {
      return visit.durationMinutes ?? 0;
    }

    let accumulated = visit.accumulatedMs || 0;

    if (visit.status === "active" && visit.lastStatusChange) {
      const now = Date.now();
      const delta =
        now - visit.lastStatusChange.toDate().getTime();
      accumulated += delta;
    }

    return (accumulated / 60000).toFixed(1);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "active":
        return "green";
      case "paused":
        return "orange";
      case "completed":
        return "blue";
      case "auto-closed":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Merchandiser Visits</h1>

      <table style={styles.table}>
        <thead>
          <tr>
            <th>Merchandiser</th>
            <th>Outlet</th>
            <th>Status</th>
            <th>Entered</th>
            <th>Exited</th>
            <th>Duration (min)</th>
            <th>Last Location</th>
          </tr>
        </thead>

        <tbody>
          {visits.map((v) => (
            <tr key={v.id}>
              <td>{v.merchandiserId}</td>
              <td>{v.outletId}</td>

              <td style={{ color: statusColor(v.status), fontWeight: 600 }}>
                {v.status}
              </td>

              <td>{formatTime(v.enteredAt)}</td>
              <td>{formatTime(v.exitedAt)}</td>

              <td>{calculateLiveMinutes(v)}</td>

              <td>
                {v.lastLocation
                  ? `Lat: ${v.lastLocation.lat.toFixed(5)}, Lng: ${v.lastLocation.lng.toFixed(5)}`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = { container: 
  { padding: 30, fontFamily: "Arial, sans-serif", } as const, title: { marginBottom: 20, fontSize: 24, color: "#333", } as const, table: { width: "100%", borderCollapse: "collapse" as "collapse", textAlign: "left" as const, }, th: { borderBottom: "2px solid #ccc", padding: "10px 5px", } as const, td: { borderBottom: "1px solid #eee", padding: "8px 5px", } as const, };