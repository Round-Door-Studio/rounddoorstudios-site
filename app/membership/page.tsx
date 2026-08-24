import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import MembershipClient from './MembershipClient';

export const metadata: Metadata = {
  title: 'Round Door Studio · Join the Circle',
  description: 'Unlock every Story Pack with a Round Door Circle membership.',
};

export default async function MembershipPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <MembershipClient isLoggedIn={!!user} />;
}
