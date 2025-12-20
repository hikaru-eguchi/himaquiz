"use client";

import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";

export const useEnemyState = (socket: Socket | null) => {
  const [enemyHP, setEnemyHP] = useState(0);
  const [maxHP, setMaxHP] = useState(0);

  useEffect(() => {
    if (!socket) return;

    const onEnemyUpdate = ({ enemyHP, maxHP }: { enemyHP: number; maxHP: number }) => {
      setEnemyHP(enemyHP);
      setMaxHP(maxHP);
    };

    socket.on("enemy_update", onEnemyUpdate);

    return () => {
      socket.off("enemy_update", onEnemyUpdate);
    };
  }, [socket]);

  return { enemyHP, maxHP };
};
