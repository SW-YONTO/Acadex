import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kjuhvssnixpamzgaotwp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdWh2c3NuaXhwYW16Z2FvdHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDg3NDIsImV4cCI6MjA4Mzk4NDc0Mn0.xHTBit6kuhx6ayMMkK_J9i6Q36CNhP2UX7M5ZkQ7MV8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
