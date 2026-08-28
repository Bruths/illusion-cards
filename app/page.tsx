"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [card, setCard] = useState("");
  const [hidden, setHidden] = useState(true);
  const [showFront, setShowFront] = useState(false);

  const flipSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    async function loadCard() {
      const { data, error } = await supabase
        .from("current_card")
        .select("card, hidden")
        .eq("id", 1)
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setCard(data.card ?? "");
      setHidden(data.hidden ?? true);
    }

    loadCard();

    const channel = supabase
      .channel("cards")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "current_card",
        },
        (payload) => {
          const row = payload.new as {
            card: string;
            hidden: boolean;
          };

          if (row.hidden) {
            setHidden(true);
            setShowFront(false);
            return;
          }

          // Kartı önce kapat
          setShowFront(false);

          setTimeout(() => {
            setCard(row.card ?? "");
            setHidden(false);

            // Flip sesi
            if (flipSound.current) {
              flipSound.current.currentTime = 0;

              flipSound.current.play().catch((err) => {
                console.error("Ses hatası:", err);
              });
            }

            // Kartı aç
            setTimeout(() => {
              setShowFront(true);
            }, 50);
          }, 800);
        }
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);

        if (status === "SUBSCRIBED") {
          console.log("Realtime bağlantısı kuruldu");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main
      style={{
        background: "#111",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
        overflow: "hidden",
      }}
    >
      <audio
        ref={flipSound}
        src="/sounds/card-flip.mp3"
        preload="auto"
      />

      <h1
        style={{
          fontSize: "clamp(24px, 5vw, 42px)",
          marginBottom: "30px",
          letterSpacing: "2px",
          textAlign: "center",
        }}
      >
        SEÇTİĞİN KART
      </h1>

      <div
        style={{
          width: "min(85vw, 380px)",
          aspectRatio: "320 / 446",
          perspective: "1200px",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transition: "transform 0.8s ease-in-out",
            transform:
              !hidden && showFront
                ? "rotateY(180deg)"
                : "rotateY(0deg)",
          }}
        >
          {/* Kart Arkası */}
          <img
            src="/cards/back.jpg"
            alt="Kart Arkası"
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              backfaceVisibility: "hidden",
              borderRadius: "12px",
              filter: "drop-shadow(0 0 30px rgba(0,0,0,0.5))",
            }}
          />

          {/* Kart Önü */}
          <img
            src={card ? `/cards/${card}.png` : "/cards/back.jpg"}
            alt={card}
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              borderRadius: "12px",
              filter: "drop-shadow(0 0 30px rgba(0,0,0,0.5))",
            }}
          />
        </div>
      </div>
    </main>
  );
}