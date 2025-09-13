// Mock Supabase Client
export const supabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      data: null,
      error: null,
      eq: () => ({ data: null, error: null }),
      single: () => ({ data: null, error: null }),
      order: () => ({ data: null, error: null }),
      limit: () => ({ data: null, error: null }),
      range: () => ({ data: null, error: null }),
      then: (cb: any) => cb({ data: [], error: null })
    }),
    insert: (data: any) => ({
      data: null,
      error: null,
      select: () => ({ data: null, error: null }),
      single: () => ({ data: null, error: null }),
      then: (cb: any) => cb({ data: null, error: null })
    }),
    update: (data: any) => ({
      eq: () => ({ data: null, error: null }),
      match: () => ({ data: null, error: null }),
      then: (cb: any) => cb({ data: null, error: null })
    }),
    delete: () => ({
      eq: () => ({ data: null, error: null }),
      match: () => ({ data: null, error: null }),
      then: (cb: any) => cb({ data: null, error: null })
    }),
    upsert: (data: any) => ({
      data: null,
      error: null,
      select: () => ({ data: null, error: null }),
      then: (cb: any) => cb({ data: null, error: null })
    })
  }),
  auth: {
    signIn: async () => ({ data: null, error: null }),
    signOut: async () => ({ data: null, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: (cb: any) => {
      cb('SIGNED_OUT', null);
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  storage: {
    from: (bucket: string) => ({
      upload: async () => ({ data: null, error: null }),
      download: async () => ({ data: null, error: null }),
      remove: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  },
  realtime: {
    channel: (name: string) => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {}
    })
  }
};


export default supabase;
