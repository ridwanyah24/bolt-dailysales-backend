import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto, VerifyEmailDto } from './dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, res: any): Promise<void>;
    login(dto: LoginDto, res: any): Promise<void>;
    refresh(req: any, res: any): Promise<void>;
    logout(req: any, res: any): Promise<void>;
    me(user: any): Promise<{
        user: import("../common/domain.types").User;
        business: import("../common/domain.types").Business;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{}>;
    resetPassword(dto: ResetPasswordDto): Promise<{}>;
    verifyEmail(dto: VerifyEmailDto, user: any): Promise<{
        user: import("../common/domain.types").User;
    }>;
}
