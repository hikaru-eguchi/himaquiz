import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface Player {
  socketId: string;
  name: string;
  score: number;
}

export const useBattle = (playerName: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [questionIds, setQuestionIds] = useState<string[]>([]);
  const [matched, setMatched] = useState(false);
  const [bothReady, setBothReady] = useState(false);
  const [mySocketId, setMySocketId] = useState<string>("");
  const [startAt, setStartAt] = useState<number | null>(null);
  const [handicap, setHandicap] = useState<number>(0);
  const sendMessage = (message: string) => {
    if (!socket || !roomCode) return;
    socket.emit("send_message", { roomCode, fromId: mySocketId, message });
  };

  const [scoreChanges, setScoreChanges] = useState<Record<string, number | null>>(
    {}
  );

  const updateStartAt = (newStartAt: number) => {
    setStartAt(newStartAt);
  };

  /* =========================
     Socket 接続
  ========================= */
  useEffect(() => {
    const SERVER_URL =
      process.env.NEXT_PUBLIC_BATTLE_SERVER_URL || "http://localhost:3001";

    const s = io(SERVER_URL, {
      transports: ["websocket", "polling"],
    });

    setSocket(s);

    s.on("connect", () => {
      console.log("[useBattle] connected:", s.id);
      setMySocketId(s.id!);
    });

    s.on("connect_error", (err) => {
      console.error("[useBattle] Socket 接続エラー:", err);
    });

    s.on("game_start_time", ({ startAt }: { startAt: number }) => {
      console.log("[game_start_time]", startAt);
      setStartAt(startAt);
      setBothReady(true);
    });

    s.on("rematch_start", ({ startAt, questionIds, players }: { startAt: number; questionIds: string[]; players: Player[] }) => {
      console.log("[rematch_start]", startAt);
      setPlayers(players);
      setQuestionIds(questionIds);
      setStartAt(startAt);
      setBothReady(true);
      setScoreChanges({});
    });

    /* =========================
       ゲーム開始
    ========================= */
    s.on("start_game", ({ roomCode, players, questionIds }) => {
      console.log("[start_game]");
      console.log("roomCode:", roomCode);
      console.log("players:", players);
      console.log("mySocketId:", s.id);

      setRoomCode(roomCode);
      setPlayers(players);
      setQuestionIds(questionIds);
      setMatched(true);
    });

    s.on("start_game_with_handicap", ({ startAt, players, questionIds }) => {
      setPlayers(players);
      setQuestionIds(questionIds);
      setStartAt(startAt);
      setBothReady(true);
    });

    /* =========================
       スコア更新
    ========================= */
    s.on(
      "score_update",
      ({ socketId, score }: { socketId: string; score: number }) => {
        console.log("[score_update]", socketId, score);
        setPlayers(prev => {
          const before = prev.find(p => p.socketId === socketId)?.score ?? 0;
          const diff = score - before;

          // ★ 加点・減点アニメーション用
          setScoreChanges(prevChanges => ({
            ...prevChanges,
            [socketId]: diff,
          }));

          setTimeout(() => {
            setScoreChanges(prevChanges => ({
              ...prevChanges,
              [socketId]: null,
            }));
          }, 800);

          return prev.map(p =>
            p.socketId === socketId
              ? { ...p, score }
              : p
          );
        });
      }
    );

    return () => {
      console.log("[useBattle] disconnect");
      s.off("rematch_start");
      s.disconnect();
    };
  }, []);

  /* =========================
     参加処理
  ========================= */
  const joinRandom = (onJoined?: (code: string) => void) => {
    if (!socket) return;
    socket.emit("join_random", playerName);
    socket.on("start_game", ({ roomCode: code }) => {
      setRoomCode(code);
      if (onJoined) onJoined(code);
    });
  };

  const joinWithCode = (code: string) => {
    if (!socket) {
      console.warn("[useBattle] joinWithCode: socket 未接続");
      return;
    }
    socket.emit("join_with_code", {
      playerName,
      code,
    });
  };

  /* =========================
     スコア更新
  ========================= */
  const updateScore = (score: number) => {
    if (!socket || !roomCode) {
      console.warn("[useBattle] updateScore: socket または roomCode 未設定");
      return;
    }

    console.log("[emit] update_score:", socket.id, score);
    socket.emit("update_score", {
      roomCode,
      socketId: socket.id,
      score,
    });
  };

  /* =========================
     Ready 通知
  ========================= */
  const sendReady = (value?: number) => {
    if (!socket || !roomCode) return;

    const h = value ?? handicap; // ★ state を使う

    socket.emit("player_ready", {
      roomCode,
      socketId: socket.id,
      handicap: h,
    });
  };

  const requestRematch = (roomCode: string) => {
    if (!socket) return;
    socket.emit("request_rematch", { roomCode , handicap});
  };

  /* =========================
    マッチ状態リセット
  ========================= */
  const resetMatch = () => {
    setRoomCode(null);
    setPlayers([]);
    setQuestionIds([]);
    setMatched(false);
    setBothReady(false);
    setStartAt(null);
    setScoreChanges({});
    // socket は残しておく場合もあるし、切断して再接続も可能
  };

  return {
    joinRandom,
    joinWithCode,
    updateScore,
    sendReady,
    sendMessage,
    requestRematch,
    resetMatch,
    updateStartAt,
    setHandicap,
    players,
    roomCode,
    questionIds,
    matched,
    bothReady,
    startAt,
    mySocketId,
    socket,
    handicap,
  };
};
