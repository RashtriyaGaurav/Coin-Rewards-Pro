// coins.js — Coin management logic

const Coins = (() => {
  async function getBalance(userId) {
    const { data, error } = await supabaseClient
      .from('users')
      .select('coins')
      .eq('id', userId)
      .single();
    if (error) return 0;
    return data.coins;
  }

  async function addCoins(userId, amount) {
    const current = await getBalance(userId);
    const { error } = await supabaseClient
      .from('users')
      .update({ coins: current + amount })
      .eq('id', userId);
    return !error;
  }

  async function deductCoins(userId, amount) {
    const current = await getBalance(userId);
    if (current < amount) return false;
    const { error } = await supabaseClient
      .from('users')
      .update({ coins: current - amount })
      .eq('id', userId);
    return !error;
  }

  async function claimDaily(userId) {
    const { data, error } = await supabaseClient
      .from('users')
      .select('coins, last_claim')
      .eq('id', userId)
      .single();
    if (error) return { success: false, message: 'Error fetching user data.' };

    const now = new Date();
    const lastClaim = data.last_claim ? new Date(data.last_claim) : null;

    if (lastClaim) {
      const diff = now - lastClaim;
      const hours24 = 24 * 60 * 60 * 1000;
      if (diff < hours24) {
        const remaining = hours24 - diff;
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        return { success: false, message: `Next claim in ${h}h ${m}m ${s}s`, remaining };
      }
    }

    const { error: updateError } = await supabaseClient
      .from('users')
      .update({ coins: data.coins + 100, last_claim: now.toISOString() })
      .eq('id', userId);

    if (updateError) return { success: false, message: 'Failed to claim coins.' };
    return { success: true, message: '+100 coins claimed!', newBalance: data.coins + 100 };
  }

  function getTimeUntilNextClaim(lastClaim) {
    if (!lastClaim) return null;
    const now = new Date();
    const last = new Date(lastClaim);
    const diff = (last.getTime() + 24 * 3600000) - now.getTime();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s, ms: diff };
  }

  return { getBalance, addCoins, deductCoins, claimDaily, getTimeUntilNextClaim };
})();
