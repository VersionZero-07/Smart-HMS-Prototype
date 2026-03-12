/**
 * useQueuePolling — Polls queue position for a given token.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { getQueuePosition } from "../api/client";

export default function useQueuePolling(tokenId, intervalMs = 10000) {
  const [position, setPosition] = useState(null);
  const [total, setTotal] = useState(null);
  const [estimatedWait, setEstimatedWait] = useState(null);
  const [department, setDepartment] = useState("");
  const timerRef = useRef(null);

  const fetchPosition = useCallback(async () => {
    if (!tokenId) return;
    try {
      const data = await getQueuePosition(tokenId);
      setPosition(data.position);
      setTotal(data.total);
      setEstimatedWait(data.estimated_wait_mins);
      setDepartment(data.department);
    } catch {
      // Silently handle errors during polling
    }
  }, [tokenId]);

  useEffect(() => {
    if (!tokenId) return;
    fetchPosition();
    timerRef.current = setInterval(fetchPosition, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tokenId, intervalMs, fetchPosition]);

  return { position, total, estimatedWait, department };
}
