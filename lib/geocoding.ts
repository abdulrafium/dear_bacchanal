export const PUREPRINT_HQ = {
    lat: 51.0457,
    lon: 0.1651
};

export async function geocodeAddress(address: string): Promise<{ lat: number; lon: number } | null> {
    try {
        const query = encodeURIComponent(address);
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

        const response = await fetch(url, {
            cache: 'no-store',
            headers: {
                "User-Agent": "DearBacchanalShippingApp/1.0",
                "Accept-Language": "en-US,en;q=0.9"
            }
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }

        return null;
    } catch (error) {
        console.error("Geocoding failed:", error);
        return null;
    }
}

// Haversine formula to calculate distance in kilometers
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}
