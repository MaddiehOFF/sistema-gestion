
import { getSupabase } from './supabaseClient';

// Debounce timer for saving to avoid hammering the DB on every keystroke
const saveTimers: Record<string, any> = {};
let cloudSyncDisabled = false; // Flag to stop trying if critical config error exists

export const loadData = async <T>(key: string, defaultValue: T): Promise<T> => {
    // If we already know config is bad, skip cloud load
    if (cloudSyncDisabled) {
        const local = localStorage.getItem(`sushiblack_${key}`);
        return local ? JSON.parse(local) : defaultValue;
    }

    const supabase = getSupabase();
    
    // 1. Try Loading from Cloud
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('app_data')
                .select('value')
                .eq('key', key)
                .single();
            
            if (error) {
                // Check for Secret Key usage error
                if (error.message && error.message.includes("Forbidden use of secret API key")) {
                    console.error("CRITICAL CONFIG ERROR: You are using the 'service_role' (SECRET) key. Please open Configuration and use the 'anon' (PUBLIC) key.");
                    cloudSyncDisabled = true;
                }
                // Check for Missing Table error
                else if (error.message && (error.message.includes("Could not find the table") || error.code === '42P01')) {
                    console.error("CRITICAL DB ERROR: Table 'app_data' not found. Please run the SQL script provided in the Config menu.");
                    cloudSyncDisabled = true;
                }
                // Ignore "Row not found" error (PGRST116) as it's normal for new apps
                else if (error.code !== 'PGRST116') {
                    console.warn(`[Cloud] Load error for ${key}: ${error.message} (${error.code})`);
                }
            } else if (data) {
                console.log(`[Cloud] Loaded ${key}`);
                // Sync cloud data to local storage for offline backup
                localStorage.setItem(`sushiblack_${key}`, JSON.stringify(data.value));
                return data.value;
            }
        } catch (e: any) {
            if (e.message && e.message.includes("Forbidden use of secret API key")) {
                console.error("CRITICAL CONFIG ERROR: Invalid API Key type (Secret). Cloud sync disabled.");
                cloudSyncDisabled = true;
            } else {
                console.error("Supabase load exception:", e);
            }
        }
    }

    // 2. Fallback to LocalStorage
    const local = localStorage.getItem(`sushiblack_${key}`);
    return local ? JSON.parse(local) : defaultValue;
};

export const saveData = (key: string, value: any) => {
    if (value === undefined) return;

    // 1. Save Local Immediately (Optimistic)
    try {
        localStorage.setItem(`sushiblack_${key}`, JSON.stringify(value));
    } catch (e) {
        console.error("Local save error:", e);
    }

    // If cloud sync is disabled due to bad config, stop here
    if (cloudSyncDisabled) return;

    // 2. Save to Cloud (Debounced)
    const supabase = getSupabase();
    if (supabase) {
        if (saveTimers[key]) clearTimeout(saveTimers[key]);
        
        saveTimers[key] = setTimeout(async () => {
            try {
                // Sanitize: JSON.stringify removes 'undefined' fields which cause Supabase errors
                const cleanValue = JSON.parse(JSON.stringify(value));

                const { error } = await supabase
                    .from('app_data')
                    .upsert({ 
                        key, 
                        value: cleanValue, 
                        updated_at: new Date().toISOString() 
                    });
                
                if (error) {
                    // Check for Secret Key usage error
                    if (error.message && error.message.includes("Forbidden use of secret API key")) {
                        console.error(`[Cloud] CRITICAL: You are using the SECRET key. Please change to PUBLIC ANON key in configuration.`);
                        cloudSyncDisabled = true; 
                        return;
                    }

                    // Check for Missing Table error
                    if (error.message && (error.message.includes("Could not find the table") || error.code === '42P01')) {
                        console.error(`[Cloud] CRITICAL: Table 'app_data' missing. Sync disabled until fixed. Run the SQL script.`);
                        cloudSyncDisabled = true;
                        return;
                    }

                    console.error(`[Cloud] Error saving ${key}:`, error.message);
                } else {
                    // console.log(`[Cloud] Saved ${key}`); // Commented out to reduce noise
                }
            } catch (e: any) {
                if (e.message && e.message.includes("Forbidden use of secret API key")) {
                    console.error("CRITICAL CONFIG ERROR: Invalid API Key type. Cloud sync disabled.");
                    cloudSyncDisabled = true;
                } else {
                    console.error("Supabase save exception:", e);
                }
            }
        }, 1000); // 1 second debounce
    }
};
