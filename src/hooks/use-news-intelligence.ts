import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useNewsIntelligence() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["news-intelligence", user?.id],
    enabled: Boolean(user),
    staleTime: 60_000,
    refetchInterval: 300_000,
    queryFn: async () => {
      const client = getSupabaseBrowserClient();
      if (!client) return { events: [], items: [], brief: null };

      const from = new Date();
      from.setDate(from.getDate() - 7);
      const to = new Date();
      to.setDate(to.getDate() + 14);

      const [events, items, brief] = await Promise.all([
        client
          .from("economic_events")
          .select("*")
          .gte("scheduled_at", from.toISOString())
          .lte("scheduled_at", to.toISOString())
          .order("scheduled_at"),
        client.from("news_items").select("*").order("published_at", { ascending: false }).limit(20),
        client
          .from("weekly_market_briefs")
          .select("*")
          .order("week_start", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (events.error) throw events.error;
      if (items.error) throw items.error;
      if (brief.error) throw brief.error;
      return { events: events.data ?? [], items: items.data ?? [], brief: brief.data };
    },
  });
}
