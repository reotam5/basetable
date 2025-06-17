import { PreLoginLoadingSplash } from '@/components/splash-variants';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: PreLoginLoadingSplash,
})