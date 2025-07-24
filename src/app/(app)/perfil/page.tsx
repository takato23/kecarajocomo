import { Metadata } from 'next';

import { ProfileView } from '@/components/profile/ProfileView';

export const metadata: Metadata = {
  title: 'Mi Perfil | KeCarajoComér',
  description: 'Personaliza tus preferencias alimentarias y dietéticas'
};

export default function PerfilPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileView />
    </div>
  );
}