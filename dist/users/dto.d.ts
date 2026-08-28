export declare class InviteSalespersonDto {
    name: string;
    email: string;
}
export declare class AcceptInviteDto {
    token: string;
    password: string;
}
export declare class UpdateSalespersonStatusDto {
    status: 'active' | 'invited' | 'disabled';
}
