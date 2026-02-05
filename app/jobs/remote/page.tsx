import { redirect } from 'next/navigation';

export default function RemoteJobsPage() {
  redirect('/jobs?remote=true');
}
