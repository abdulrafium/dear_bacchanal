import Image from "next/image";
import { kalufira } from "./Font";
const EigthPage = () => {
  return (
    <section className="bg-[#9f2e2b] w-full relative overflow-hidden" style={{ height: '100%', minHeight: '100%' }}>
      <Image
        src="/assets/layer-12.png"
        alt="Overlay"
        fill
        className="object-cover pointer-events-none"
        priority
      />
      <div className="flex flex-col w-full h-full justify-center items-center z-10 relative px-6">
        <p className="text-2xl font-black text-center font-handwritten mb-6 text-white/90">
          We tried to behave. <br /> We failed.
        </p>
        <h1
          className={`${kalufira.className} text-center leading-[0.85] text-white`}
          style={{ fontSize: 'min(15vw, 120px)' }}
        >
          DEAR
          <br />
          BACCHANAL
        </h1>
      </div>
    </section>
  );
};

export default EigthPage;
