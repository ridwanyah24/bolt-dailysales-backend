import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import type { User, Business } from '../common/domain.types';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    private mapUser;
    private mapBusiness;
    private signAccessToken;
    private issueRefreshToken;
    private setRefreshCookie;
    private clearRefreshCookie;
    register(dto: {
        businessName: string;
        ownerName: string;
        email: string;
        password: string;
    }, res: any): Promise<{
        user: User;
        business: Business;
        accessToken: string;
    }>;
    login(dto: {
        email: string;
        password: string;
    }, res: any): Promise<{
        user: User;
        accessToken: string;
    }>;
    refresh(req: any, res: any): Promise<{
        accessToken: string;
    }>;
    logout(req: any, res: any): Promise<void>;
    me(authUser: any): Promise<{
        user: User;
        business: Business;
    }>;
    forgotPassword(dto: {
        email: string;
    }): Promise<{}>;
    resetPassword(dto: {
        token: string;
        newPassword: string;
    }): Promise<{}>;
    verifyEmail(dto: {
        code: string;
    }, authUser: any): Promise<{
        user: User;
    }>;
}
