import AdsterraBanner from './AdsterraBanner';

export default function ResponsiveAd({ index }: { index: number }) {
  return (
    <div className="my-6 flex justify-center">
      <div className="block md:hidden">
        <AdsterraBanner type="mobile" slotId={`mobile-${index}`} />
      </div>
      <div className="hidden md:block">
        <AdsterraBanner type="desktop" slotId={`desktop-${index}`} />
      </div>
    </div>
  );
}
