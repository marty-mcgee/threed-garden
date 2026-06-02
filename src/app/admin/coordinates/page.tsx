// app/admin/coordinates/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function CoordinatesAdmin() {
  const [closures, setClosures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/caltrans/closures/update-coordinates?action=missing')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setClosures(data.closures);
        }
        setLoading(false);
      });
  }, []);

  const addCoordinates = async (closureId: number, lat: number, lng: number) => {
    const response = await fetch('/api/caltrans/closures/update-coordinates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ closure_id: closureId, latitude: lat, longitude: lng })
    });
    
    if (response.ok) {
      setClosures(closures.filter(c => c.closure_id !== closureId));
      alert('Coordinates added!');
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Add Coordinates to Closures</h1>
      
      {closures.length === 0 ? (
        <p>No closures missing coordinates!</p>
      ) : (
        <div className="space-y-4">
          {closures.map(closure => (
            <div key={closure.closure_id} className="border p-4 rounded">
              <p><strong>Route:</strong> {closure.route}</p>
              <p><strong>District:</strong> {closure.district}</p>
              <p><strong>Description:</strong> {closure.description}</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => addCoordinates(
                    closure.closure_id,
                    34.052235, // LA coordinates as example
                    -118.243683
                  )}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  Add LA Coordinates
                </button>
                <button
                  onClick={() => addCoordinates(
                    closure.closure_id,
                    37.774929, // SF coordinates
                    -122.419418
                  )}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                >
                  Add SF Coordinates
                </button>
                <button
                  onClick={() => addCoordinates(
                    closure.closure_id,
                    38.581572, // Sacramento coordinates
                    -121.494400
                  )}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-sm"
                >
                  Add Sacramento Coordinates
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
