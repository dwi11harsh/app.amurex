"use client";

import {
  Navbar,
  Input,
  Button,
  Loader,
  NoteEditorTile,
  PinTile,
} from "@repo/ui/components";
import localFont from "next/font/local";
import { useCallback, useState } from "react";

const louizeFont = localFont({
  src: "../fonts/Louize.ttf",
  variable: "--font-louize",
});

const Page = () => {
  const [session, setSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [pins, setPins] = useState([]);

  const handleSaveNote = useCallback(
    async (noteText: string) => {
      try {
        const filename = `note_${Date.now()}.txt`;

        // Split the note into title and content
        const lines = noteText.split("\n");
        const title = lines[0] || "Untitled Note";
        const content = lines.slice(1).join("\n").trim();

        console.log("Saving note:", noteText);

        // TODO: ADD UPLOAD LOGIC
        // const { data, error: uploadError } = await supabase.storage
        //     .from("notes")
        //     .upload(filename, noteText);

        // console.log("Uploaded note:", data);
        //   if (uploadError) throw uploadError;

        // const {
        //   data: { publicUrl },
        //   error: urlError,
        // } = supabase.storage.from("notes").getPublicUrl(filename);

        // if (urlError) throw urlError;

        // const response = await fetch("/api/upload", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({
        //     url: publicUrl,
        //     title: title,
        //     text: content || title,
        //     created_at: new Date().toISOString(),
        //     session,
        //   }),
        // });

        // const responseData = await response.json();
        // if (responseData.success) {
        //   const newNote = {
        //     id: responseData.documentId,
        //     title: title,
        //     image: "/placeholder.svg?height=300&width=200",
        //     type: "note",
        //     size: ["small", "medium", "large"][Math.floor(Math.random() * 3)],
        //     tags: [],
        //     url: publicUrl,
        //     created_at: new Date().toISOString(),
        //   };
        //   setPins((prevPins) => [newNote, ...prevPins]);
        //   console.log("Note saved successfully");
        // } else {
        //   console.error("Error saving note:", responseData.error);
        // }
      } catch (error) {
        console.error("Error saving note:", error);
      }
    },
    [session],
  );

  const handleOpenFocusMode = useCallback(() => {
    setIsFocusMode(true);
  }, []);

  return (
    <main>
      <Navbar />
      <div
        className={`${louizeFont.variable} flex flex-col h-screen ml-16`}
        style={{ backgroundColor: "var(--surface-color-2)" }}
      >
        <div
          className="sticky top-0 z-40 w-full bg-opacity-90 backdrop-blur-sm"
          style={{ backgroundColor: "var(--surface-color-2)" }}
        >
          <div className="w-full py-4 px-8 flex justify-between items-center">
            <div className="relative w-full flex items-center">
              <Input
                type="search"
                placeholder="Search..."
                className="w-full text-6xl py-4 px-2 font-serif bg-transparent border-0 border-b-2 rounded-none focus:ring-0 transition-colors"
                style={{
                  fontFamily: "var(--font-louize), serif",
                  borderColor: "var(--line-color)",
                  color: "var(--color)",
                }}
                // value={searchTerm}
                // onChange={(e) => setSearchTerm(e.target.value)}
                // onKeyDown={(e) => {
                //   if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                //     e.preventDefault();
                //     handleAiSearch();
                //   }
                // }}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                />
              )}
            </div>
          </div>

          <div className="flex-grow overflow-hidden">
            <div className="h-full overflow-y-auto p-8">
              {isLoading ? (
                <Loader />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 min-h-full">
                  <NoteEditorTile
                    onSave={handleSaveNote}
                    onOpenFocusMode={handleOpenFocusMode}
                  />
                  {/* {pins.map((pin) => (
                    <PinTile key={pin.id} pin={pin} />
                  ))} */}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;
