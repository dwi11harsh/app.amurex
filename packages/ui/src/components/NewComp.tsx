"use client";

import Image from "next/image";
import {
  useConnectionsStore,
  useMemorySearchEnabled,
  useSearchStore,
  useSessionStore,
  useShowOnboarding,
} from "@repo/ui/store";
import { useShallow } from "zustand/shallow";
import { ChangeEvent, KeyboardEvent } from "react";

interface InputAreaProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  sendMessage: () => void;
  className?: string;
}

export const NewComp = () => {
  const session = useSessionStore((state) => state.session);
  const {
    inputValue,
    setInputValue,
    setIsSearching,
    setIsSearchInitiated,
    setSearchStartTime,
    setSourcesTime,
    setCompletionTime,
    setSearchResults,
  } = useSearchStore(
    useShallow((state) => ({
      inputValue: state.inputValue,
      setInputValue: state.setInputValue,
      setIsSearching: state.setIsSearching,
      setIsSearchInitiated: state.setIsSearchInitiated,
      setSearchStartTime: state.setSearchStartTime,
      setSourcesTime: state.setSourceTime,
      setCompletionTime: state.setCompletionTime,
      setSearchResults: state.setSearchResult,
    })),
  );

  const {
    googleDocsEnabled,
    notionEnabled,
    memorySearchEnabled,
    obsidianEnabled,
    gmailEnabled,
  } = useConnectionsStore(
    useShallow((state) => ({
      googleDocsEnabled: state.googleDocsEnabled,
      notionEnabled: state.hasNotionEnabled,
      memorySearchEnabled: state.memorySearchEnabled,
      obsidianEnabled: state.hasObsidianEnabled,
      gmailEnabled: state.gmailEnabled,
    })),
  );

  // Update sendMessage to include Gmail
  const sendMessage = (messageToSend?: string): void => {
    if (!session?.user?.id) return;

    const message: string = messageToSend || inputValue;
    setInputValue("");
    setIsSearching(true);
    setIsSearchInitiated(true);

    // Reset all timing metrics
    const startTime: number = performance.now();
    setSearchStartTime(startTime);
    setSourcesTime(null);
    setCompletionTime(null);

    setSearchResults({
      query: message,
      sources: [],
      vectorResults: [],
      answer: "",
    });

    fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        googleDocsEnabled,
        notionEnabled,
        memorySearchEnabled,
        obsidianEnabled,
        gmailEnabled,
        user_id: session.user.id,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response: Response) => {
        if (!response.ok || !response.body)
          throw new Error("Network response was not ok");

        const reader: ReadableStreamDefaultReader<Uint8Array> =
          response.body.getReader();
        const decoder: TextDecoder = new TextDecoder();
        let buffer: string = "";
        let sourcesReceived: boolean = false;
        let firstChunkReceived: boolean = false;

        const readStream = (): void => {
          reader
            .read()
            .then(({ done, value }: ReadableStreamReadResult<Uint8Array>) => {
              if (done) {
                // Record final completion time when stream ends
                const endTime: number = performance.now();
                setCompletionTime(((endTime - startTime) / 1000).toFixed(1));
                setIsSearching(false);
                return;
              }

              buffer += decoder.decode(value, { stream: true });

              try {
                // Split by newlines and filter out empty lines
                const lines: string[] = buffer
                  .split("\n")
                  .filter((line: string) => line.trim());

                // Process each complete line
                for (let i: number = 0; i < lines.length; i++) {
                  try {
                    const data: {
                      success: boolean;
                      sources?: any[];
                      chunk?: string;
                      done?: boolean;
                    } = JSON.parse(lines[i]);

                    // Update search results
                    if (data.success) {
                      // Track when sources first arrive
                      if (
                        data.sources &&
                        data.sources.length > 0 &&
                        !sourcesReceived
                      ) {
                        sourcesReceived = true;
                        const currentTime: number = performance.now();
                        setSourcesTime(
                          ((currentTime - startTime) / 1000).toFixed(1),
                        );
                      }

                      // Track when first text chunk arrives
                      if (data.chunk && !firstChunkReceived) {
                        firstChunkReceived = true;
                      }

                      setSearchResults(
                        (prev: {
                          query: string;
                          sources: any[];
                          vectorResults: any[];
                          answer: string;
                          done?: boolean;
                        }) => ({
                          ...prev,
                          sources: data.sources || prev.sources,
                          answer: prev.answer + (data.chunk || ""),
                          done: data.done || false,
                        }),
                      );
                    }
                  } catch (e: unknown) {
                    console.error("Error parsing JSON:", e, "Line:", lines[i]);
                  }
                }

                // Keep only the incomplete line in the buffer
                const lastNewlineIndex: number = buffer.lastIndexOf("\n");
                if (lastNewlineIndex !== -1) {
                  buffer = buffer.substring(lastNewlineIndex + 1);
                }
              } catch (e: unknown) {
                console.error("Error processing buffer:", e);
              }

              readStream();
            })
            .catch((err: unknown) => {
              console.error("Stream reading error:", err);
              setIsSearching(false);
            });
        };

        readStream();
      })
      .catch((err: unknown) => {
        console.error("Error:", err);
        setIsSearching(false);
      });
  };

  return (
    <div className="bg-[#09090A] rounded-lg border border-zinc-800 relative">
      <div className="p-4 md:p-6 border-b border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-[#9334E9]">
              <Image
                width={20}
                height={20}
                src="/chat-centered-dots.svg"
                alt="Chat Icon"
                className="h-5 w-5"
              />
            </div>
            <h1 className="text-xl md:text-2xl font-medium text-white">
              Hi! I&apos;m Amurex - your AI assistant for work and life.
            </h1>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 items-center gap-2">
              {/* First row with Google Docs, Meetings, and Notion */}
              <CheckHasGoogleDocsEnabled />
              <CheckHasMeetingsEnabled />
              {/* Notion button */}
              <CheckHasNotionEnabled />
            </div>

            {/* Second row with Obsidian and Gmail */}
            <div className="grid grid-cols-2 md:grid-cols-3 items-center gap-2">
              {/* Obsidian button */}
              <CheckHasObsidianEnabled />
              {/* Gmail button */}
              <CheckHasGmailEnabled />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6">
        <div className="w-full">
          <InputArea
            inputValue={inputValue}
            setInputValue={setInputValue}
            sendMessage={sendMessage}
            className="w-full"
          />

          {!isSearchInitiated && (
            <div className="mt-4 space-y-2">
              <div className="text-zinc-500 text-sm">Suggested searches:</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {suggestedPrompts.length === 0 ? (
                  <>
                    {[1, 2, 3].map((_, index) => (
                      <div
                        key={index}
                        className="h-[52px] bg-black rounded-lg border border-zinc-800 animate-pulse"
                      >
                        <div className="h-4 bg-zinc-800 rounded w-3/4 m-4"></div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {/* Regular prompts */}
                    {suggestedPrompts
                      .filter((item) => item.type === "prompt")
                      .map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setInputValue(item.text);
                            sendMessage(item.text);
                          }}
                          className="px-4 py-2 rounded-lg bg-black border border-zinc-800 text-zinc-300 hover:bg-[#3c1671] transition-colors text-sm text-left"
                        >
                          {item.text}
                        </button>
                      ))}
                    {/* Email actions */}
                    {suggestedPrompts
                      .filter((item) => item.type === "email")
                      .map((item, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setInputValue(item.text);
                            sendMessage(item.text);
                          }}
                          className="px-4 py-2 rounded-lg bg-black border border-zinc-800 text-zinc-300 hover:bg-[#3c1671] transition-colors text-sm text-left flex items-center justify-between"
                        >
                          <span>{item.text}</span>
                        </button>
                      ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {(isSearching || searchResults?.query) && (
          <div className="space-y-6">
            <Query
              content={searchResults?.query || ""}
              sourcesTime={sourcesTime}
              completionTime={completionTime}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Heading content="Answer" />
                  {!isSearching && searchResults?.query && (
                    <button
                      onClick={() => sendMessage(searchResults.query)}
                      className="flex items-center gap-1 text-sm text-zinc-300 hover:text-white bg-black border border-zinc-800 hover:border-[#6D28D9] px-3 py-1.5 rounded-md transition-colors"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 489.645 489.645"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M460.656,132.911c-58.7-122.1-212.2-166.5-331.8-104.1c-9.4,5.2-13.5,16.6-8.3,27c5.2,9.4,16.6,13.5,27,8.3
                            c99.9-52,227.4-14.9,276.7,86.3c65.4,134.3-19,236.7-87.4,274.6c-93.1,51.7-211.2,17.4-267.6-70.7l69.3,14.5
                            c10.4,2.1,21.8-4.2,23.9-15.6c2.1-10.4-4.2-21.8-15.6-23.9l-122.8-25c-20.6-2-25,16.6-23.9,22.9l15.6,123.8
                            c1,10.4,9.4,17.7,19.8,17.7c12.8,0,20.8-12.5,19.8-23.9l-6-50.5c57.4,70.8,170.3,131.2,307.4,68.2
                            C414.856,432.511,548.256,314.811,460.656,132.911z"
                        />
                      </svg>
                      Regenerate
                    </button>
                  )}
                </div>
                <div className="bg-black rounded-lg p-4 border border-zinc-800 text-zinc-300">
                  <GPT content={searchResults?.answer || ""} />
                  {isSearching && (
                    <span className="inline-block animate-pulse">▋</span>
                  )}
                </div>
              </div>

              {searchResults?.sources?.length > 0 && (
                <div>
                  <Sources content={searchResults.sources} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CheckHasGoogleDocsEnabled = () => {
  const hasGoogleDocs = useShowOnboarding((state) => state.hasGoogleDocs);
  const { googleDocsEnabled, setGoogleDocsEnabled } = useConnectionsStore(
    (state) => ({
      googleDocsEnabled: state.googleDocsEnabled,
      setGoogleDocsEnabled: state.setGoogleDocsEnabled,
    }),
  );
  return (
    <>
      {!hasGoogleDocs ? (
        <a
          href="/settings?tab=personalization"
          target="_blank"
          className="px-2 md:px-4 py-2 inline-flex items-center justify-center gap-1 md:gap-2 rounded-[8px] text-xs md:text-md font-medium border border-white/10 cursor-pointer text-[#FAFAFA] opacity-80 hover:bg-[#3c1671] transition-all duration-200 whitespace-nowrap relative group"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
            alt="Google Docs"
            className="w-3 h-3 md:w-4 md:h-4"
          />
          Google Docs
          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Connect Google Docs
          </span>
        </a>
      ) : (
        <button
          onClick={() => setGoogleDocsEnabled(!googleDocsEnabled)}
          className={`px-2 md:px-4 py-2 inline-flex items-center justify-center gap-1 md:gap-2 rounded-[8px] text-xs md:text-md font-medium border border-white/10 ${
            googleDocsEnabled ? "bg-[#9334E9] text-[#FAFAFA]" : "text-[#FAFAFA]"
          } transition-all duration-200 whitespace-nowrap hover:border-[#6D28D9]`}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg"
            alt="Google Docs"
            className="w-3 h-3 md:w-4 md:h-4"
          />
          Google Docs
          {googleDocsEnabled && (
            <svg
              className="w-3 h-3 md:w-4 md:h-4 ml-1"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}
    </>
  );
};

const CheckHasMeetingsEnabled = () => {
  const hasMeetings = useConnectionsStore((state) => state.hasMeetings);
  const { memorySearchEnabled, setMemorySearchEnabled } =
    useMemorySearchEnabled(
      useShallow((state) => ({
        memorySearchEnabled: state.memorySearchEnabled,
        setMemorySearchEnabled: state.setMemorySearchEnabled,
      })),
    );
  return (
    <>
      {!hasMeetings ? (
        <a
          href="https://chromewebstore.google.com/detail/Amurex%20%28Early%20Preview%29/dckidmhhpnfhachdpobgfbjnhfnmddmc"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-[8px] text-md font-medium border border-white/10 cursor-pointer text-[#FAFAFA] opacity-80 hover:bg-[#3c1671] transition-all duration-200 whitespace-nowrap relative group"
        >
          <Image
            width={16}
            height={16}
            src="/chat-centered-dots.svg"
            alt="Chat Icon"
            className="h-4 w-4"
          />
          Meetings
          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Connect Meetings
          </span>
        </a>
      ) : (
        <button
          onClick={() => setMemorySearchEnabled(!memorySearchEnabled)}
          className={`px-2 md:px-4 py-2 inline-flex items-center justify-center gap-1 md:gap-2 rounded-[8px] text-xs md:text-md font-medium border border-white/10 ${
            memorySearchEnabled
              ? "bg-[#9334E9] text-[#FAFAFA]"
              : "text-[#FAFAFA]"
          } transition-all duration-200 whitespace-nowrap hover:border-[#6D28D9]`}
        >
          <Image
            width={12}
            height={12}
            src="/chat-centered-dots.svg"
            alt="Chat Icon"
            className="w-3 h-3 md:w-4 md:h-4"
          />
          Meetings
          {memorySearchEnabled && (
            <svg
              className="w-3 h-3 md:w-4 md:h-4 ml-1"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}
    </>
  );
};

const CheckHasNotionEnabled = () => {
  const { notionEnabled, setNotionEnabled, hasNotion } = useConnectionsStore(
    useShallow((state) => ({
      notionEnabled: state.hasNotionEnabled,
      setNotionEnabled: state.setHasNotionEnabled,
      hasNotion: state.hasNotion,
    })),
  );
  return (
    <>
      {!hasNotion ? (
        <a
          href="/settings?tab=personalization"
          target="_blank"
          className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-[8px] text-md font-medium border border-white/10 cursor-pointer text-[#FAFAFA] opacity-80 hover:bg-[#3c1671] transition-all duration-200 whitespace-nowrap relative group"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
            alt="Notion"
            className="w-4 h-4"
          />
          Notion
          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Connect Notion
          </span>
        </a>
      ) : (
        <button
          onClick={() => setNotionEnabled(!notionEnabled)}
          className={`px-2 md:px-4 py-2 inline-flex items-center justify-center gap-1 md:gap-2 rounded-[8px] text-xs md:text-md font-medium border border-white/10 ${
            notionEnabled ? "bg-[#9334E9] text-[#FAFAFA]" : "text-[#FAFAFA]"
          } transition-all duration-200 whitespace-nowrap hover:border-[#6D28D9]`}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
            alt="Notion"
            className="w-3 h-3 md:w-4 md:h-4"
          />
          Notion
          {notionEnabled && (
            <svg
              className="w-3 h-3 md:w-4 md:h-4 ml-1"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}
    </>
  );
};

const CheckHasObsidianEnabled = () => {
  const { hasObsidian, obsidianEnabled, setObsidianEnabled } =
    useConnectionsStore(
      useShallow((state) => ({
        hasObsidian: state.hasObsidian,
        obsidianEnabled: state.hasObsidianEnabled,
        setObsidianEnabled: state.setHasObsidianEnabled,
      })),
    );
  return (
    <>
      {!hasObsidian ? (
        <a
          href="/settings?tab=personalization"
          target="_blank"
          className="px-4 py-2 inline-flex items-center justify-center gap-2 rounded-[8px] text-md font-medium border border-white/10 cursor-pointer text-[#FAFAFA] opacity-80 hover:bg-[#3c1671] transition-all duration-200 whitespace-nowrap relative group"
        >
          <img
            src="https://obsidian.md/images/obsidian-logo-gradient.svg"
            alt="Obsidian"
            className="w-4 h-4"
          />
          Obsidian
          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Upload Obsidian Files
          </span>
        </a>
      ) : (
        <button
          onClick={() => setObsidianEnabled(!obsidianEnabled)}
          className={`px-2 md:px-4 py-2 inline-flex items-center justify-center gap-1 md:gap-2 rounded-[8px] text-xs md:text-md font-medium border border-white/10 ${
            obsidianEnabled ? "bg-[#9334E9] text-[#FAFAFA]" : "text-[#FAFAFA]"
          } transition-all duration-200 whitespace-nowrap hover:border-[#6D28D9]`}
        >
          <img
            src="https://obsidian.md/images/obsidian-logo-gradient.svg"
            alt="Obsidian"
            className="w-3 h-3 md:w-4 md:h-4"
          />
          Obsidian
          {obsidianEnabled && (
            <svg
              className="w-3 h-3 md:w-4 md:h-4 ml-1"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}
    </>
  );
};

const CheckHasGmailEnabled = () => {
  const { hasGmail, gmailEnabled, setGmailEnabled } = useConnectionsStore(
    useShallow((state) => ({
      hasGmail: state.hasGmail,
      gmailEnabled: state.gmailEnabled,
      setGmailEnabled: state.setGmailEnabled,
    })),
  );
  return (
    <>
      {!hasGmail ? (
        <a
          href="/settings?tab=personalization"
          target="_blank"
          className="px-2 md:px-4 py-2 inline-flex items-center justify-center gap-1 md:gap-2 rounded-[8px] text-xs md:text-md font-medium border border-white/10 cursor-pointer text-[#FAFAFA] opacity-80 hover:bg-[#3c1671] transition-all duration-200 whitespace-nowrap relative group"
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
            alt="Gmail"
            className="w-3 md:w-4"
          />
          Gmail
          <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-black px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Connect Gmail
          </span>
        </a>
      ) : (
        <button
          onClick={() => setGmailEnabled(!gmailEnabled)}
          className={`px-2 md:px-4 py-2 inline-flex items-center justify-center gap-1 md:gap-2 rounded-[8px] text-xs md:text-md font-medium border border-white/10 ${
            gmailEnabled ? "bg-[#9334E9] text-[#FAFAFA]" : "text-[#FAFAFA]"
          } transition-all duration-200 whitespace-nowrap hover:border-[#6D28D9]`}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png"
            alt="Gmail"
            className="w-3 md:w-4"
          />
          Gmail
          {gmailEnabled && (
            <svg
              className="w-3 h-3 md:w-4 md:h-4 ml-1"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      )}
    </>
  );
};

const InputArea = ({
  inputValue,
  setInputValue,
  sendMessage,
  className = "",
}: InputAreaProps) => {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="text"
        placeholder="Type your search..."
        className="flex-1 p-3 md:p-4 text-sm md:text-base rounded-l-lg focus:outline-none bg-black border border-zinc-800 text-zinc-300"
        value={inputValue}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setInputValue(e.target.value)
        }
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
          e.key === "Enter" && sendMessage()
        }
      />
      <button
        onClick={() => sendMessage()}
        className="p-3 md:p-4 rounded-r-lg bg-black border-t border-r border-b border-zinc-800 text-zinc-300 hover:bg-[#3c1671] transition-colors"
      >
        <Image sizes="20px" src="/arrow-circle-right.svg" alt="Send" />
      </button>
    </div>
  );
};
