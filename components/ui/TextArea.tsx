"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useBookData } from "@/components/book/BookDataContext";
import { useSession } from "next-auth/react";
import { useAuthModal } from "@/hooks/useAuthModal";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  fieldId: string;
  onValueChange?: (value: string) => void;
}

export const TextArea: React.FC<TextAreaProps> = ({
  fieldId,
  onValueChange,
  className,
  ...props
}) => {
  const { data, isReadOnly } = useBookData();
  const { data: session } = useSession();
  const { openModal } = useAuthModal();
  const [value, setValue] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const debouncedValue = useDebounce(value, 500);

  // Load initial value from Context or DB
  useEffect(() => {
    // Check context first
    if (data.textData && data.textData[fieldId] !== undefined) {
      setValue(data.textData[fieldId]);
      setIsLoaded(true);
      return;
    }

    // Only self-fetch if NOT in read-only mode (edit mode),
    // and we haven't already got the text from context.
    if (!isReadOnly) {
      const fetchValue = async () => {
        try {
          const response = await fetch("/api/book-data");
          if (response.ok) {
            const { data: fetchedData } = await response.json();
            if (fetchedData[fieldId]) {
              setValue(fetchedData[fieldId]);
            }
          }
        } catch (error) {
          console.error("Error fetching field value:", error);
        } finally {
          setIsLoaded(true);
        }
      };

      fetchValue();
    } else {
      setIsLoaded(true);
    }
  }, [fieldId, data.textData, isReadOnly]);

  // Save to DB when value changes (debounced)
  useEffect(() => {
    if (!isLoaded || isReadOnly) return;
    if (debouncedValue === "") return; // Avoid saving empty strings on initial load race conditions

    const saveValue = async () => {
      try {
        await fetch("/api/book-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fieldId,
            value: debouncedValue,
          }),
        });

        onValueChange?.(debouncedValue);
      } catch (error) {
        console.error("Error saving field value:", error);
      }
    };

    saveValue();
  }, [debouncedValue, fieldId, isLoaded, onValueChange, isReadOnly]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (isReadOnly) return;
    if (!session) {
      e.target.blur();
      openModal("signin");
    }
  };

  return (
    <textarea
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onFocus={handleFocus}
      className={className}
      readOnly={isReadOnly}
      disabled={isReadOnly}
    />
  );
};