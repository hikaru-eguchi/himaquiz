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
  const [enemyHP, setEnemyHP] = useState<number>(0);
  const [maxHP, setMaxHP] = useState<number>(0);
  const [stageCount, setStageCount] = useState<number>(1);
  const [roomPlayers, setRoomPlayers] = useState<{ socketId: string; name: string }[]>([]);
  const [playerCount, setPlayerCount] = useState("0/4");
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
      setStageCount(1);
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
      setStageCount(1);
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

  useEffect(() => {
    if (!socket) return;

    const handleRoomPlayersUpdate = ({
      gameType,
      players,
      current,
      max
    }: {
      gameType: "quiz" | "dungeon";
      players: { socketId: string; playerName: string }[];
      current: number;
      max: number;
    }) => {
      setRoomPlayers(players.map(p => ({ socketId: p.socketId, name: p.playerName })));
      setPlayerCount(`${current}/${max}`);
      console.log(`[update_room_count] ${current}/${max}`, players);

      if (gameType === "dungeon") {
        setPlayers(players.map(p => ({
          socketId: p.socketId,
          name: p.playerName,
          score: 0, // 初期スコア
        })));
      }
    };

    socket.on("update_room_count", handleRoomPlayersUpdate);

    return () => {
      socket.off("update_room_count", handleRoomPlayersUpdate);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const onEnemyState = ({ enemyHP, maxHP }: {
      enemyHP: number;
      maxHP: number;
    }) => {
      setEnemyHP(enemyHP);
      setMaxHP(maxHP);
    };

    socket.on("enemy_state", onEnemyState);
    socket.on("answer_result", onEnemyState); // ★ 共通処理

    return () => {
      socket.off("enemy_state", onEnemyState);
      socket.off("answer_result", onEnemyState);
    };
  }, [socket]);
  /* =========================
     ステージクリア
  ========================= */
  useEffect(() => {
    if (!socket) return;

    const onStageClear = ({
      stage,
      enemyHP,
      maxHP,
    }: {
      stage: number;
      enemyHP: number;
      maxHP: number;
    }) => {
      setStageCount(stage);
      setEnemyHP(enemyHP);
      setMaxHP(maxHP);
    };

    socket.on("stage_clear", onStageClear);

    return () => {
      socket.off("stage_clear", onStageClear);
    };
  }, [socket]);


  /* =========================
     参加処理
  ========================= */
  const joinRandom = (options?: { maxPlayers?: number; gameType?: "quiz" | "dungeon" }, onJoined?: (code: string) => void) => {
    if (!socket) return;
    const maxPlayers = options?.maxPlayers ?? 2;
    const gameType = options?.gameType ?? "quiz";
    socket.emit("join_random", { playerName, maxPlayers, gameType });
    socket.on("start_game", ({ roomCode: code }) => {
      setRoomCode(code);
      if (onJoined) onJoined(code);
    });
  };

  const joinWithCode = (code: string, count: string, gameType: string) => {
    if (!socket) {
      console.warn("[useBattle] joinWithCode: socket 未接続");
      return;
    }
    const roomKey = `${gameType}_${code}`;
    socket.emit("join_with_code", {
      playerName,
      code: roomKey,
      count,
      gameType,
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
    setRoomPlayers,
    setPlayerCount,
    players,
    roomCode,
    questionIds,
    matched,
    bothReady,
    startAt,
    mySocketId,
    socket,
    handicap,
    enemyHP,
    maxHP,
    stageCount,
  };
};
