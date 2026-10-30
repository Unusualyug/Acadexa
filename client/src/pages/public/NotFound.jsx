import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function NotFound() {
  return (
    <section className="container-page grid min-h-[65vh] place-items-center py-16 text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-mint text-forest"><Compass className="size-6" aria-hidden /></span>
        <p className="mt-5 font-display text-6xl font-extrabold text-forest">404</p>
        <h1 className="mt-2 text-xl font-bold">This page took a different path</h1>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-muted">
          The page you're looking for doesn't exist or has moved. Try the service catalogue or head back home.
        </p>
        <div className="mt-6 flex justify-center gap-2.5">
          <Button to="/" icon={ArrowLeft}>Back home</Button>
          <Button to="/services" variant="secondary">Browse services</Button>
        </div>
      </div>
    </section>
  );
}
