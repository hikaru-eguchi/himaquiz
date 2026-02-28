"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";

type AnswerResult = {
  socketId: string;
  isCorrect: boolean;
};

type UseQuestionPhaseReturn = {
  phase: "question" | "result";
  questionTimeLeft: number;
  timeLeft: number;
  canAnswer: boolean;
  hasAnswered: boolean;
  results: AnswerResult[];
  damage: number;
  currentIndex: number;
  submitAnswer: (isCorrect: boolean) => void;
};

export function useQuestionPhase(
  socket: Socket | null,
  roomCode: string,
  resetKey?: number
): UseQuestionPhaseReturn {
  const [phase, setPhase] = useState<"question" | "result">("question");
  const [deadline, setDeadline] = useState<number | null>(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);

  const [results, setResults] = useState<AnswerResult[]>([]);
  const [damage, setDamage] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const ignoreAnswerResultRef = useRef(false);

  const canAnswer =
    phase === "question" &&
    deadline !== null &&
    Date.now() < deadline &&
    !hasAnswered;

  useEffect(() => {
    ignoreAnswerResultRef.current = true; // ★次のquestion_startまで answer_result を捨てる

    // ついでに内部状態もクリア（より安全）
    setPhase("question");
    setDeadline(null);
    setQuestionTimeLeft(0);
    setTimeLeft(0);
    setHasAnswered(false);
    setResults([]);
    setDamage(0);
    setCurrentIndex(0);
  }, [resetKey]);

  /* =========================
     question_start（サーバー主導）
  ========================= */
  useEffect(() => {
    if (!socket) return;

    const onQuestionStart = ({ deadline, index, }: { deadline: number; index: number; }) => {
      ignoreAnswerResultRef.current = false;
      setPhase("question");
      setDeadline(deadline);
      const initial = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000)
      );
      setQuestionTimeLeft(initial);
      setTimeLeft(initial);
      setHasAnswered(false);
      setResults([]);
      setDamage(0);
      setCurrentIndex(index);
    };

    socket.on("question_start", onQuestionStart);
    return () => {
      socket.off("question_start", onQuestionStart);
    };
  }, [socket]);

  useEffect(() => {
    if (!deadline || phase !== "question") return;

    const timer = setInterval(() => {
        const seconds = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000)
        );
        setQuestionTimeLeft(seconds);
    }, 200);

    return () => clearInterval(timer);
  }, [deadline, phase]);


  /* =========================
     answer_result（サーバー主導）
  ========================= */
  useEffect(() => {
    if (!socket) return;

    const onAnswerResult = ({
        results,
        damage,
    }: {
        results: AnswerResult[];
        damage: number;
    }) => {
        if (ignoreAnswerResultRef.current) return;
        setPhase("result");
        setResults(results);
        setDamage(damage);
    };

    socket.on("answer_result", onAnswerResult);
    return () => {
      socket.off("answer_result", onAnswerResult);
    };
  }, [socket]);

  /* =========================
     残り時間カウント
  ========================= */
  useEffect(() => {
    if (!deadline || phase !== "question") return;

    const timer = setInterval(() => {
      const diff = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000)
      );
      setTimeLeft(diff);
    }, 200);

    return () => clearInterval(timer);
  }, [deadline, phase]);

  /* =========================
     回答送信（表示用 state のみ）
  ========================= */
  const submitAnswer = useCallback(
    (isCorrect: boolean) => {
      if (!socket || !canAnswer) return;

      socket.emit("submit_answer", {
        roomCode,
        isCorrect,
      });

      // ★ クライアントは「送った」ことだけ覚える
      setHasAnswered(true);
    },
    [socket, roomCode, canAnswer]
  );

  return {
    phase,
    questionTimeLeft,
    timeLeft,
    canAnswer,
    hasAnswered,
    results,
    damage,
    currentIndex,
    submitAnswer,
  };
}
