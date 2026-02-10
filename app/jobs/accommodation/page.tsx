import { redirect } from 'next/navigation';

export default function AccommodationJobsPage() {
  redirect('/jobs?accommodation=yes');
}