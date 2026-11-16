import { useEffect, useState } from "react";
import { AppState } from "react-native";

// Refresh at local midnight and when the app returns from the background.
export function useStudyDate() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      const current = new Date();
      setNow(current);
      clearTimeout(timer);
      const nextDay = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 1);
      timer = setTimeout(refresh, nextDay.getTime() - current.getTime());
    };
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return now;
}
