"use client";
import Image from 'next/image';
import { kalufira } from './Font';
import { useBookData } from './BookDataContext';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSession } from "next-auth/react";
import { useAuthModal } from "@/hooks/useAuthModal";


const triniItems = [
  'Maracas Bake & Shark',
  'Went ah pan yard',
  'Doubles with everything and slight peppah for the win',
  'Saw d Magnificent Seven while chippin round the Savannah',
  'Coconut water straight from d nut by the truck on the Savannah',
  'Limed on the Avenue',
  'Rum must drink – Angostura, Forres Park, or Fernandez',
  'Beastly cold Stag or Carib in the hot sun',
  'Roti & a soft drink was lashinnn',
  'Legs sore from all the winin',
  'Took a lil escape – beach, DDI, waterfalls',
  'Snow cone',
  'Unwind in Nylon Pool',
];

const ForthPage = () => {
  const { data, isReadOnly } = useBookData();
  const { data: session } = useSession();
  const { openModal } = useAuthModal();
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load checked items from context or fetch from API
  useEffect(() => {
    if (data.textData && data.textData['trini-checklist']) {
      try {
        const savedItems = JSON.parse(data.textData['trini-checklist']);
        setCheckedItems(savedItems);
      } catch (error) {
        console.error('Error parsing trini checklist data:', error);
      }
    } else if (!isReadOnly) {
      // Fetch from API if not in read-only mode
      const fetchChecklist = async () => {
        try {
          const response = await fetch('/api/book-data');
          if (response.ok) {
            const result = await response.json();
            if (result.data && result.data['trini-checklist']) {
              const savedItems = JSON.parse(result.data['trini-checklist']);
              setCheckedItems(savedItems);
            }
          }
        } catch (error) {
          console.error('Error fetching checklist:', error);
        }
      };
      fetchChecklist();
    }
  }, [data.textData, isReadOnly]);

  const handleCheckboxChange = async (item: string) => {
    if (isReadOnly) return;

    if (!session) {
      openModal("signin");
      return;
    }

    const newCheckedItems = {
      ...checkedItems,
      [item]: !checkedItems[item],
    };

    setCheckedItems(newCheckedItems);

    // Save to database
    setIsLoading(true);
    try {
      const response = await fetch('/api/book-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fieldId: 'trini-checklist',
          value: JSON.stringify(newCheckedItems),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save checklist');
      }
    } catch (error) {
      console.error('Error saving checklist:', error);
      toast.error('Failed to save. Please try again.');
      // Revert the change on error
      setCheckedItems(checkedItems);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Fourth page */}
      <section className="relative min-h-screen bg-[#f60602] w-full overflow-hidden flex flex-col xl:flex-row">

        <div className="w-full lg:w-1/2 pt-8 sm:pt-12 lg:pt-16 px-6 sm:px-8 lg:pl-10">
          <h1 className={`${kalufira.className} text-5xl sm:text-7xl lg:text-[30vh] leading-tight sm:leading-tight lg:leading-[25vh]`}>
            <span className="">TELL</span>
            <span className="text-black ">MEH</span>
            <span className="text-white block ">
              <span className="text-3xl sm:text-5xl lg:text-[19vh]">You're</span> AH
            </span>
            <span className="text-black block text-6xl sm:text-8xl lg:text-[40vh]">TRINI</span>
          </h1>
        </div>
        <div className="w-full xl:w-1/2 relative flex justify-start items-center px-6 sm:px-8 ">
          <Image
            src="/assets/layer-4.png"
            alt="Layer background"
            width={250}
            height={250}
            className="absolute object-contain lg:top-[-50px]  left-0 w-20 sm:w-40 lg:min-w-[25%] h-20 sm:h-40 lg:min-h-[25%]"
            priority
          />
          <Image
            src="/assets/layer-5.png"
            alt="Layer background"
            width={250}
            height={250}
            className="absolute object-contain top-10 right-4 sm:right-6 lg:right-10 w-20 sm:w-40 lg:min-w-[25%] h-20 sm:h-40 lg:min-h-[25%]"
            priority
          />
          <Image
            src="/assets/layer-6.png"
            alt="Layer background"
            width={200}
            height={200}
            className="absolute object-contain bottom-0 right-0 w-16 sm:w-32 lg:min-w-[25%] h-16 sm:h-32 lg:min-h-[25%]"
            priority
          />
          <div className="mt-10 sm:mt-28 lg:mt-36 relative z-10">
            {triniItems.map((item, index) => (
              <div
                key={index}
                className={`text-lg sm:text-base lg:text-[3vh] mb-2 sm:mb-2.5 lg:mb-4 flex items-start gap-2 ${!isReadOnly ? 'cursor-pointer hover:opacity-80' : ''}`}
                onClick={() => handleCheckboxChange(item)}
              >
                <span className="flex-shrink-0 select-none">
                  {checkedItems[item] ? '✓' : '○'}
                </span>
                <span className={checkedItems[item] ? 'line-through opacity-70' : ''}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

      </section>
    </>
  );
};

export default ForthPage;