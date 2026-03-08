"use client";

import { BookPDFGenerator } from "@/components/book/BookPDFGenerator";
import Image from "next/image";

interface FirstPageProps {
  pages?: React.ReactNode[];
}

const FirstPage = ({ pages }: FirstPageProps) => {
  return (
    <>
      {/* First Page */}
      <section className="relative min-h-screen bg-[#ff0400] w-full overflow-hidden">
        <Image
          src="/assets/layer-2.png"
          alt="Layer background"
          width={350}
          height={350} // adjust if needed
          className="absolute bottom-0 right-0 lg:min-h-[60%] min-w-[80%] "
          priority
        />
      <div className="relative z-10 flex flex-col items-start justify-center h-full p-8 md:p-16 mt-32 md:mt-48">
          <p className=" z-10 text-white pb-5">
          Dear Bacchanal
        </p>
        <p className=" z-10 text-white">
          First edition 2023
        </p>
        <p className=" z-10 text-white pb-5">
          Second edition 2026
        </p>
        <p className=" z-10 text-white">
          Copyright © SAFFA Trinidad Ltd.
        </p>
        <p className=" z-10 text-white">
          All rights reserved.
        </p>
        <p className=" z-10 text-white">
          No part of this book may be reproduced
        </p>
        <p className=" z-10 text-white">
          in any form or by any means without
        </p>
        <p className=" z-10 text-white pb-5">
          the written permission of the copyright owner.
        </p>
        <p className=" z-10 text-white">
          Ami Aqui Sirjoo, Creative Director
        </p>
        <p className=" z-10 text-white">
          Aarad Homer, Assistant Creative Director
        </p>
        <p className=" z-10 text-white">
          Aya Ataeva, Web Development and Design{" "}
        </p>
      </div>

        {/* Download Button at end of book */}
        {pages && pages.length > 0 && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20">
            <BookPDFGenerator pages={pages} />
          </div>
        )}
      </section>
    </>
  );
};

export default FirstPage;
