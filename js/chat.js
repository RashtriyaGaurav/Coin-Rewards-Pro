// chat.js — Realtime global chat using Supabase

const Chat = (() => {
  let subscription = null;

  async function loadMessages(limit = 50) {
    const { data, error } = await supabaseClient
      .from('world_chat')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) return [];
    return data;
  }

  async function sendMessage(username, message) {
    if (!message.trim()) return { success: false, message: 'Empty message.' };
    if (message.length > 100) return { success: false, message: 'Too long.' };

    const { data, error } = await supabaseClient
      .from('world_chat')
      .insert({ username, message: message.trim() })
      .select()
      .single();

    if (error) return { success: false, message: 'Failed to send.' };
    // Return inserted row so UI can render it immediately without waiting for realtime
    return { success: true, data };
  }

  function subscribe(onNewMessage) {
    if (subscription) {
      supabaseClient.removeChannel(subscription);
      subscription = null;
    }

    subscription = supabaseClient
      .channel('world_chat_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'world_chat' },
        (payload) => {
          if (payload.new) onNewMessage(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('[CoinRewards] Chat realtime:', status);
      });

    return subscription;
  }

  function unsubscribe() {
    if (subscription) {
      supabaseClient.removeChannel(subscription);
      subscription = null;
    }
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return { loadMessages, sendMessage, subscribe, unsubscribe, formatTime };
})();
