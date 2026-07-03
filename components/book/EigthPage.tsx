import Image from "next/image";
import { kalufira } from "./Font";

const EigthPage = () => {
  return (
    <section
      className="w-full relative overflow-hidden"
      style={{ height: '100%', minHeight: '100%', background: '#9e2d2a' }}
    >
      {/* RIGHT HALF of layer-12.png — exact color #d94434 via mask */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: "#d94434",
          maskImage: `url('/assets/layer-12.png')`,
          maskSize: "200% 100%",
          maskPosition: "100% 50%",
          WebkitMaskImage: `url('/assets/layer-12.png')`,
          WebkitMaskSize: "200% 100%",
          WebkitMaskPosition: "100% 50%",
        }}
      />
      <div className="flex flex-col w-full h-full justify-center items-center z-10 relative px-6">
        <h1
          className={`${kalufira.className} text-center leading-[0.80] text-white`}
          style={{ fontSize: 'min(16.5vw, 132px)' }}
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
