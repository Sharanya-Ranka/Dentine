import type { Database } from '../types/database.types';

type InvitationType = Database['public']['Tables']['invitation']['Row']

export type InvitationItem = InvitationType & {
    clinic?: {
    id: string;
    name: string;
    };
    inviter?: {
        user_id: string;
        name: string;
    };
}