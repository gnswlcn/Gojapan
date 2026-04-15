import { getAllLocations } from '@/lib/locations';
import LocationClient from './LocationClient';

// Required for static export — pre-render all known location routes
export function generateStaticParams() {
  return getAllLocations().map((loc) => ({ id: loc.id }));
}

export default function LocationPage() {
  return <LocationClient />;
}
