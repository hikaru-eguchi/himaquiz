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
  const [isCritical, setIsCritical] = useState<boolean>(false);
  const [stageCount, setStageCount] = useState<number>(1);
  const [roomPlayers, setRoomPlayers] = useState<{ socketId: string; name: string }[]>([]);
  const [playerCount, setPlayerCount] = useState("0/4");
  const [gameType, setGameType] = useState<"quiz" | "dungeon" | "dobon" | "majority" | "mind">("quiz");
  const sendMessage = (message: string) => {
    if (!socket || !roomCode) return;
    socket.emit("send_message", { roomCode, fromId: mySocketId, message });
  };
  const [playerLives, setPlayerLives] = useState<Record<string, number>>({});
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameClear, setIsGameClear] = useState(false);
  const [gameSetScheduled, setGameSetScheduled] = useState(false);

  const [scoreChanges, setScoreChanges] = useState<Record<string, number | null>>(
    {}
  );

  const [lastPlayerElimination, setLastPlayerElimination] = useState<{
    eliminationGroups: string[][];
    reason: string;
  } | null>(null);

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
      setLastPlayerElimination(null);
      setGameSetScheduled(false);
      setIsGameOver(false);
      setIsGameClear(false);
      setPlayers(players);
      setQuestionIds(questionIds);
      setStartAt(startAt);
      setBothReady(true);
      setScoreChanges({});
      setStageCount(1);
      setPlayerLives({});
    });

    /* =========================
       ゲーム開始
    ========================= */
    s.on("start_game", ({ roomCode, players, questionIds }) => {
      console.log("[start_game]");
      console.log("roomCode:", roomCode);
      console.log("players:", players);
      console.log("mySocketId:", s.id);

      setIsGameOver(false);
      setIsGameClear(false);
      setRoomCode(roomCode);
      setPlayers(players);
      setQuestionIds(questionIds);
      setMatched(true);
      setStageCount(1);
      setPlayerLives({});
    });

    s.on("start_game_with_handicap", ({ startAt, players, questionIds }) => {
      setIsGameOver(false);
      setIsGameClear(false);
      setPlayers(players);
      setQuestionIds(questionIds);
      setStartAt(startAt);
      setBothReady(true);
      setPlayerLives({});
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
      gameType: "quiz" | "dungeon" | "dobon" | "majority" | "mind";
      players: { socketId: string; playerName: string }[];
      current: number;
      max: number;
    }) => {
      setRoomPlayers(players.map(p => ({ socketId: p.socketId, name: p.playerName })));
      setPlayerCount(`${current}/${max}`);
      console.log(`[update_room_count] ${current}/${max}`, players);

      if (gameType === "dungeon" || gameType === "dobon" || gameType === "majority" || gameType === "mind") {
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

    const onEnemyState = ({ enemyHP, maxHP, isCritical}: {
      enemyHP: number;
      maxHP: number;
      isCritical: boolean;
    }) => {
      setEnemyHP(enemyHP);
      setMaxHP(maxHP);
      setIsCritical(isCritical);
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
     プレイヤーライフ関連
  ========================= */

  useEffect(() => {
    if (!socket) return;

    const onUpdateLife = ({
      socketId,
      life,
    }: {
      socketId: string;
      life: number;
    }) => {
      setPlayerLives(prev => ({
        ...prev,
        [socketId]: life,
      }));
    };

    socket.on("update_life", onUpdateLife);

    return () => {
      socket.off("update_life", onUpdateLife);
    };
  }, [socket]);
  

  useEffect(() => {
    if (!socket) return;

    const onGameOver = ({ reason }: { reason: string }) => {
      console.log("[game_over]", reason);
      setIsGameOver(true);
    };

    socket.on("game_over", onGameOver);

    return () => {
      socket.off("game_over", onGameOver);
    };
  }, [socket]);


  useEffect(() => {
    if (!socket) return;

    const onGameClear = ({ reason }: { reason: string }) => {
      console.log("[game_clear]", reason);
      setIsGameClear(true);
    };

    socket.on("game_clear", onGameClear);

    return () => {
      socket.off("game_clear", onGameClear);
    };
  }, [socket]);


  useEffect(() => {
    if (!socket) return;

    const onLastPlayerEliminated = ({ eliminationGroups, reason }: { eliminationGroups: string[][], reason: string }) => {
      console.log("[last_player_eliminated]", eliminationGroups, reason);

      // elimination 情報を state に保存
      setLastPlayerElimination({ eliminationGroups, reason });

      setIsGameOver(true);
      setGameSetScheduled(true);
    };

    socket.on("last_player_eliminated", onLastPlayerEliminated);

    return () => {
      socket.off("last_player_eliminated", onLastPlayerEliminated);
    };
  }, [socket]);


  /* =========================
     参加処理
  ========================= */
  const joinRandom = (options?: { maxPlayers?: number; gameType?: "quiz" | "dungeon" | "dobon" | "majority" | "mind" }, onJoined?: (code: string) => void) => {
    if (!socket) return;
    const maxPlayers = options?.maxPlayers ?? 2;
    const type = options?.gameType ?? "quiz";
    setGameType(type)
    socket.emit("join_random", { playerName, maxPlayers, gameType: type });
    socket.once("start_game", ({ roomCode: code }: { roomCode: string }) => {
      setRoomCode(code);
      onJoined?.(code);
    });
  };

  const joinWithCode = (code: string, count: string, type: "quiz" | "dungeon" | "dobon" | "majority" | "mind") => {
    if (!socket) {
      console.warn("[useBattle] joinWithCode: socket 未接続");
      return;
    }
    setGameType(type);
    const roomKey = `${type}_${code}`;
    socket.emit("join_with_code", {
      playerName,
      code: roomKey,
      count,
      gameType: type,
    });
  };

  const leaveRoom = (code?: string) => {
    if (!socket) return;
    const target = code ?? roomCode;
    if (!target) return;

    socket.emit("leave_room", { roomCode: target });

    // クライアント側の部屋情報も一旦クリア（任意だけどおすすめ）
    setRoomCode(null);
    setMatched(false);
    setBothReady(false);
    setStartAt(null);
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
      gameType,
    });
  };

  const requestRematch = (roomCode: string) => {
    if (!socket) return;
    socket.emit("request_rematch", { roomCode , handicap, gameType,});
  };

  /* =========================
    マッチ状態リセット
  ========================= */
  const resetMatch = () => {
    setIsGameOver(false);
    setIsGameClear(false);
    setRoomCode(null);
    setPlayers([]);
    setQuestionIds([]);
    setMatched(false);
    setBothReady(false);
    setStartAt(null);
    setScoreChanges({});
    setLastPlayerElimination(null);
    // socket は残しておく場合もあるし、切断して再接続も可能
  };

  return {
    joinRandom,
    leaveRoom,
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
    isCritical,
    stageCount,
    playerLives,
    isGameOver,
    isGameClear,
    lastPlayerElimination,
    gameSetScheduled,
  };
};
