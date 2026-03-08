"use client";

import React, { createContext, useContext } from "react";

interface BookData {
  textData: Record<string, string>;
  images: Record<string, string>;
  boxData: Record<string, { width?: number; height?: number; isVisible?: boolean; rotation?: number; x?: number; y?: number }>;
  dynamicBoxes: Record<string, string[]>; // pageId -> list of box IDs
}

interface BookDataContextType {
  data: BookData;
  isReadOnly: boolean;
  isLoading: boolean;
  updateBoxData: (id: string, settings: { width?: number; height?: number; isVisible?: boolean; rotation?: number; x?: number; y?: number }) => void;
  updateTextData: (id: string, value: string) => void;
  updateImage: (id: string, url: string | null) => void;
  addDynamicBox: (pageId: string) => void;
  removeDynamicBox: (pageId: string, boxId: string) => void;
  saveAll: () => Promise<void>;
  isPDF?: boolean;
}

const BookDataContext = createContext<BookDataContextType>({
  data: { textData: {}, images: {}, boxData: {}, dynamicBoxes: {} },
  isReadOnly: false,
  isLoading: false,
  isPDF: false,
  updateBoxData: () => { },
  updateTextData: () => { },
  updateImage: () => { },
  addDynamicBox: () => { },
  removeDynamicBox: () => { },
  saveAll: async () => { },
});

export const useBookData = () => useContext(BookDataContext);

interface BookDataProviderProps {
  children: React.ReactNode;
  textData?: Record<string, string>;
  images?: Record<string, string>;
  boxData?: Record<string, { width?: number; height?: number; isVisible?: boolean; rotation?: number; x?: number; y?: number }>;
  dynamicBoxes?: Record<string, string[]>;
  isReadOnly?: boolean;
  isLoading?: boolean;
  isPDF?: boolean;
}

export const BookDataProvider: React.FC<BookDataProviderProps> = ({
  children,
  textData: initialTextData = {},
  images: initialImages = {},
  boxData: initialBoxData = {},
  dynamicBoxes: initialDynamicBoxes = {},
  isReadOnly = false,
  isLoading = false,
  isPDF = false,
}) => {
  const [textData, setTextData] = React.useState(initialTextData);
  const [images, setImages] = React.useState(initialImages);
  const [boxData, setBoxData] = React.useState(initialBoxData);
  const [dynamicBoxes, setDynamicBoxes] = React.useState(initialDynamicBoxes);

  // Sync with initial props if they change
  React.useEffect(() => {
    setTextData(initialTextData);
  }, [initialTextData]);

  React.useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  React.useEffect(() => {
    setBoxData(initialBoxData);
  }, [initialBoxData]);

  React.useEffect(() => {
    setDynamicBoxes(initialDynamicBoxes);
  }, [initialDynamicBoxes]);

  const updateBoxData = (id: string, settings: { width?: number; height?: number; isVisible?: boolean; rotation?: number; x?: number; y?: number }) => {
    setBoxData(prev => ({
      ...prev,
      [id]: { ...prev[id], ...settings }
    }));
  };

  const updateTextData = (id: string, value: string) => {
    setTextData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const updateImage = (id: string, url: string | null) => {
    setImages(prev => {
      if (url === null) {
        const newImages = { ...prev };
        delete newImages[id];
        return newImages;
      }
      return { ...prev, [id]: url };
    });
  };

  const addDynamicBox = async (pageId: string) => {
    const newBoxId = `dynamic-box-${Date.now()}`;
    const initialSettings = { x: 35, y: 35, rotation: 0, isVisible: true };

    let updatedPageBoxes: string[] = [];

    setDynamicBoxes(prev => {
      updatedPageBoxes = [...(prev[pageId] || []), newBoxId];
      return {
        ...prev,
        [pageId]: updatedPageBoxes
      };
    });

    setBoxData(prev => ({
      ...prev,
      [newBoxId]: initialSettings
    }));

    // Save to DB
    try {
      await fetch("/api/book-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: `dynamic-boxes-${pageId}`,
          value: JSON.stringify(updatedPageBoxes),
        }),
      });

      await fetch("/api/book-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: `box-settings-${newBoxId}`,
          value: JSON.stringify(initialSettings),
        }),
      });
    } catch (error) {
      console.error("Error saving dynamic box:", error);
    }
  };

  const removeDynamicBox = async (pageId: string, boxId: string) => {
    let updatedPageBoxes: string[] = [];

    setDynamicBoxes(prev => {
      updatedPageBoxes = (prev[pageId] || []).filter(id => id !== boxId);
      return {
        ...prev,
        [pageId]: updatedPageBoxes
      };
    });

    try {
      await fetch("/api/book-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: `dynamic-boxes-${pageId}`,
          value: JSON.stringify(updatedPageBoxes),
        }),
      });
    } catch (error) {
      console.error("Error removing dynamic box:", error);
    }
  };

  const saveAll = async () => {
    try {
      // 1. Prepare data to save
      // Combine boxData and dynamicBoxes into textData format for the current storage model
      const dataToSave: Record<string, string> = { ...textData };

      Object.entries(boxData).forEach(([id, settings]) => {
        dataToSave[`box-settings-${id}`] = JSON.stringify(settings);
      });

      Object.entries(dynamicBoxes).forEach(([pageId, boxIds]) => {
        dataToSave[`dynamic-boxes-${pageId}`] = JSON.stringify(boxIds);
      });

      // 2. Save all items sequentially or via a new bulk API (for now sequentially to match existing logic)
      const savePromises = Object.entries(dataToSave).map(([fieldId, value]) =>
        fetch("/api/book-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldId, value }),
        })
      );

      // Also save images
      const imagePromises = Object.entries(images).map(([imageId, imageUrl]) =>
        fetch("/api/book-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageId, imageUrl }),
        })
      );

      await Promise.all([...savePromises, ...imagePromises]);
    } catch (error) {
      console.error("Error in saveAll:", error);
      throw error;
    }
  };

  return (
    <BookDataContext.Provider
      value={{
        data: { textData, images, boxData, dynamicBoxes },
        isReadOnly,
        isLoading,
        updateBoxData,
        updateTextData,
        updateImage,
        addDynamicBox,
        removeDynamicBox,
        saveAll,
        isPDF: isPDF || false,
      }}
    >
      {children}
    </BookDataContext.Provider>
  );
};
