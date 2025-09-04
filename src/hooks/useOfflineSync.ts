"use client";

import { useState, useEffect, useCallback } from "react";

// Tipe untuk item dalam antrian sinkronisasi
interface SyncQueueItem {
  id: string; // ID unik untuk setiap item antrian
  url: string;
  options: RequestInit;
  timestamp: number;
}

const SYNC_QUEUE_KEY = "attendanceSyncQueue";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);

  // Membaca antrian dari Local Storage saat komponen pertama kali dimuat
  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const savedQueue = localStorage.getItem(SYNC_QUEUE_KEY);
    if (savedQueue) {
      setQueue(JSON.parse(savedQueue));
    }
  }, []);

  // Menyimpan antrian ke Local Storage setiap kali berubah
  useEffect(() => {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  }, [queue]);

  // Memproses antrian saat kembali online
  const processQueue = useCallback(async () => {
    if (queue.length === 0) return;

    console.log(`🔄 Processing ${queue.length} items from offline queue...`);
    const remainingItems = [...queue];

    for (const item of queue) {
      try {
        const response = await fetch(item.url, item.options);
        if (response.ok) {
          // Hapus item dari antrian setelah berhasil dikirim
          remainingItems.shift();
          console.log(`✅ Successfully synced item: ${item.id}`);
        } else {
          // Jika gagal karena alasan selain jaringan, hentikan proses agar tidak kehilangan data
          console.error(
            `❌ Failed to sync item ${item.id}, server responded with ${response.status}. Stopping queue.`
          );
          break;
        }
      } catch (error) {
        // Jika gagal karena masalah jaringan, hentikan proses dan coba lagi nanti
        console.error(
          `❌ Network error while syncing item ${item.id}. Stopping queue.`,
          error
        );
        break;
      }
    }
    setQueue(remainingItems);
  }, [queue]);

  // Listener untuk status online/offline
  useEffect(() => {
    const handleOnline = () => {
      console.log("🌍 Back online!");
      setIsOnline(true);
      processQueue();
    };
    const handleOffline = () => {
      console.log("❌ Connection lost, you are offline.");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Proses antrian saat pertama kali load jika sedang online
    if (isOnline) {
      processQueue();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isOnline, processQueue]);

  // Fungsi untuk menambahkan request ke antrian
  const addToQueue = (url: string, options: RequestInit) => {
    const newItem: SyncQueueItem = {
      id: `sync_${Date.now()}`,
      url,
      options,
      timestamp: Date.now(),
    };
    setQueue((prevQueue) => [...prevQueue, newItem]);
    console.log(`📝 Item added to offline queue: ${newItem.id}`);
  };

  return { isOnline, addToQueue, queueLength: queue.length };
}
