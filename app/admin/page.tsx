"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";


const suits = [
  { name: "♠ MAÇA", prefix: "S", color: "white" },
  { name: "♥ KUPA", prefix: "H", color: "#ff3333" },
  { name: "♦ KARO", prefix: "D", color: "#ff3333" },
  { name: "♣ SİNEK", prefix: "C", color: "white" },
];

const ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

function formatCard(card: string) {
  if (!card) return "";

  const suit = card.slice(-1);
  const rank = card.slice(0, -1);

  const suitNames: Record<string, string> = {
    S: "Maça",
    H: "Kupa",
    D: "Karo",
    C: "Sinek",
  };

  const rankNames: Record<string, string> = {
    A: "As",
    J: "Vale",
    Q: "Kız",
    K: "Papaz",
  };

  return `${suitNames[suit]} ${rankNames[rank] || rank}`;
}

function getCardColor(card: string) {
  const suit = card.slice(-1);

  return suit === "H" || suit === "D"
    ? "#ff3333"
    : "white";
}

export default function AdminPage() {
  const [selectedCard, setSelectedCard] = useState("");
  const [selectedCode, setSelectedCode] = useState("");
  const [history, setHistory] = useState<string[]>([]);
const [remainingCards, setRemainingCards] = useState(52);


  const allCards = suits.flatMap((suit) =>
    
    ranks.map((rank) => rank + suit.prefix)
  );
useEffect(() => {
  loadHistory();
}, []);
const [authenticated, setAuthenticated] = useState(false);

const ADMIN_PASSWORD = "Kart2026";

useEffect(() => {
  const saved = localStorage.getItem("admin-auth");

  if (saved === "ok") {
    setAuthenticated(true);
  }
}, []);

function login() {
  const password = prompt("Admin Şifresi");

  if (password === ADMIN_PASSWORD) {
    localStorage.setItem("admin-auth", "ok");
    setAuthenticated(true);
  } else {
    alert("Hatalı şifre");
  }
}

function logout() {
  localStorage.removeItem("admin-auth");
  setAuthenticated(false);
}

async function loadHistory() {
  const { data } = await supabase
    .from("card_history")
    .select("card")
    .order("created_at", { ascending: false })
    .limit(10);

  if (data) {
    setHistory(data.map((x) => x.card));
  }

  const { count } = await supabase
    .from("used_cards")
    .select("*", {
      count: "exact",
      head: true,
    });

  setRemainingCards(52 - (count || 0));
}
  async function chooseCard(card: string) {
  const { error } = await supabase
    .from("current_card")
    .update({
      card,
      hidden: false,
    })
    .eq("id", 1);

  if (error) {
    alert(error.message);
    return;
  }

  await supabase
    .from("card_history")
    .insert({
      card,
    });

  await supabase
    .from("used_cards")
    .upsert({
      card,
    });

  setSelectedCode(card);
  setSelectedCard(formatCard(card));

  loadHistory();
}
 async function randomCard() {
  const { data } = await supabase
    .from("used_cards")
    .select("card");

  const used = new Set(
    data?.map((x) => x.card) || []
  );

  const available = allCards.filter(
    (c) => !used.has(c)
  );

  if (available.length === 0) {
    alert("Destedeki tüm kartlar kullanıldı");
    return;
  }

  const random =
    available[
      Math.floor(
        Math.random() * available.length
      )
    ];

  await chooseCard(random);
}

 async function hideCard() {
  await supabase
    .from("current_card")
    .update({ hidden: true })
    .eq("id", 1);

  setSelectedCard("🎭 Kart Gizlendi");
}

 async function showCard() {
  await supabase
    .from("current_card")
    .update({ hidden: false })
    .eq("id", 1);

  setSelectedCard("👁 Kart Gösterildi");
}
async function resetDeck() {
  await supabase
    .from("used_cards")
    .delete()
    .neq("card", "");

  await supabase
    .from("card_history")
    .delete()
    .neq("id", 0);

  setHistory([]);
  setRemainingCards(52);

  alert("Deste sıfırlandı");
}
if (!authenticated) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#050505",
      }}
    >
     <button
  onClick={login}
  style={{
    padding: "20px 40px",
    fontSize: "24px",
    borderRadius: "12px",
    border: "1px solid #444",
    cursor: "pointer",
    background: "#111",
    color: "white",
    fontWeight: "bold",
  }}
>
  🔒 Admin Girişi
</button>
    </main>
  );
}
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "white",
        padding: "16px",
        overflowX: "hidden",
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          textAlign: "center",
          marginBottom: "20px",
        }}
      >
        Kart Kontrol Paneli
      </h1>
      <button
  onClick={logout}
  style={{
    padding: "10px 20px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    marginBottom: "20px",
  }}
>
  Çıkış Yap
</button>

      <div
        style={{
          width: "100%",
          textAlign: "center",
          border: "1px solid #333",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            fontSize: "22px",
          }}
        >
          Seçili Kart
        </div>

        <div
          style={{
            marginTop: "10px",
            fontSize: "32px",
            color: getCardColor(selectedCode),
            fontWeight: "bold",
          }}
        >
          {selectedCard || "Kart Seçilmedi"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <button
          onClick={showCard}
          style={{
            width: "100%",
            padding: "16px",
            fontSize: "18px",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            background: "#1f8f3a",
            color: "white",
            fontWeight: "bold",
          }}
        >
          👁 Göster
        </button>

        <button
          onClick={hideCard}
          style={{
            width: "100%",
            padding: "16px",
            fontSize: "18px",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            background: "#b3261e",
            color: "white",
            fontWeight: "bold",
          }}
        >
          🎭 Gizle
        </button>
      </div>

      <button
        onClick={randomCard}
        style={{
          width: "100%",
          padding: "16px",
          fontSize: "20px",
          borderRadius: "12px",
          border: "none",
          cursor: "pointer",
          background: "#2962ff",
          color: "white",
          fontWeight: "bold",
          marginBottom: "30px",
        }}
      >
        🃏 Rastgele Kart Çek
      </button>

      {suits.map((suit) => (
        <div
          key={suit.prefix}
          style={{
            marginBottom: "30px",
          }}
        >
          <h2
            style={{
              fontSize: "26px",
              color: suit.color,
              marginBottom: "12px",
            }}
          >
            {suit.name}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(70px,1fr))",
              gap: "10px",
            }}
          >
            {ranks.map((rank) => {
              const card = rank + suit.prefix;
              const active = selectedCode === card;

              return (
                <button
                  key={card}
                  onClick={() => chooseCard(card)}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: "12px",
                    border: active
                      ? "2px solid #ff3333"
                      : "1px solid #444",
                    background: active ? "#ff3333" : "#111",
                    color: active ? "white" : suit.color,
                    fontSize: "28px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {rank}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </main>
  );
}