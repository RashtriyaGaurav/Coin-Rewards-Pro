// auth.js — Authentication helpers using supabaseClient from supabase.js

const Auth = (() => {
  async function getUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
  }

  async function getUserProfile(userId) {
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    return { data, error };
  }

  async function signUp(email, password) {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (!error && data.user) {
      // Create profile row
      await supabaseClient.from('users').insert({
        id: data.user.id,
        email: email,
        coins: 0,
        last_claim: null
      });
    }
    return { data, error };
  }

  async function signOut() {
    await supabaseClient.auth.signOut();
    window.location.href = 'login.html';
  }

  async function requireAuth() {
    const user = await getUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    return user;
  }

  async function redirectIfLoggedIn() {
    const user = await getUser();
    if (user) {
      window.location.href = 'dashboard.html';
    }
  }

  return { getUser, getUserProfile, signIn, signUp, signOut, requireAuth, redirectIfLoggedIn };
})();
