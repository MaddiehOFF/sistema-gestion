import { createClient } from '@supabase/supabase-js';
import { DatabaseConfig } from '../types';

let supabaseInstance: any = null;

export const getSupabase = () => {
    // Check if configured in localStorage
    const savedConfig = localStorage.getItem('sushiblack_db_config');
    if (savedConfig) {
        const config: DatabaseConfig = JSON.parse(savedConfig);
        if (config.isConfigured && config.url && config.key) {
            if (!supabaseInstance) {
                supabaseInstance = createClient(config.url, config.key);
            }
            return supabaseInstance;
        }
    }
    return null;
};

export const saveDbConfig = (url: string, key: string) => {
    const config: DatabaseConfig = { url, key, isConfigured: true };
    localStorage.setItem('sushiblack_db_config', JSON.stringify(config));
    // Force reload client
    supabaseInstance = createClient(url, key);
};

export const clearDbConfig = () => {
    localStorage.removeItem('sushiblack_db_config');
    supabaseInstance = null;
};
