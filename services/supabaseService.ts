import { supabase } from './supabaseClient';
import { Member, User } from '../types';

export const supabaseService = {
    // --- Auth Methods ---

    async signUp(email: string, password: string): Promise<User> {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) throw error;
        if (!data.user) throw new Error('Registration failed');

        // Create a User object compatible with our app
        return {
            username: data.user.email || email,
            token: data.session?.access_token || 'temp-token',
        };
    },

    async login(email: string, password: string): Promise<User> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        if (!data.user) throw new Error('Login failed');

        return {
            username: data.user.email || email,
            token: data.session?.access_token || 'temp-token',
        };
    },

    async logout(): Promise<void> {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    async getUser(): Promise<User | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        return {
            username: user.email || 'User',
            token: 'session-active',
        };
    },

    // --- Data Persistence Methods ---

    async fetchUserData(user: User): Promise<{ members: Member[], storeName: string }> {
        // 1. Get current authenticated user ID
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error('Not authenticated');

        // 2. Fetch data from 'user_data' table
        const { data, error } = await supabase
            .from('user_data')
            .select('members, store_name')
            .eq('user_id', authUser.id)
            .single();

        if (error) {
            // If code is PGRST116, it means no rows returned (new user), which is fine.
            if (error.code === 'PGRST116') {
                return { members: [], storeName: '' };
            }
            console.error('Error fetching user data:', error);
            throw error;
        }

        return {
            members: (data?.members as unknown as Member[]) || [],
            storeName: data?.store_name || '',
        };
    },

    async saveUserData(user: User, data: { members: Member[], storeName: string }): Promise<void> {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error('Not authenticated');

        // Upsert data
        const { error } = await supabase
            .from('user_data')
            .upsert({
                user_id: authUser.id,
                members: data.members, // Supabase handles JSON arrays automatically if column is jsonb
                store_name: data.storeName,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

        if (error) {
            console.error('Error saving user data:', error);
            throw error;
        }
    }
};
