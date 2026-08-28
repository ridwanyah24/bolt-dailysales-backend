import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { InviteSalespersonDto, AcceptInviteDto, UpdateSalespersonStatusDto } from './dto';
import { PrismaService } from '../common/prisma.service';
export declare class UsersController {
    private usersService;
    private jwtService;
    private prisma;
    constructor(usersService: UsersService, jwtService: JwtService, prisma: PrismaService);
    getSalespeople(businessId: string): Promise<import("../common/domain.types").Salesperson[]>;
    inviteSalesperson(businessId: string, dto: InviteSalespersonDto): Promise<import("../common/domain.types").Salesperson>;
    acceptInvite(dto: AcceptInviteDto, res: any): Promise<void>;
    updateStatus(businessId: string, id: string, dto: UpdateSalespersonStatusDto): Promise<import("../common/domain.types").Salesperson>;
    getPerformance(businessId: string, id: string, start?: string, end?: string): Promise<import("../common/domain.types").SalespersonPerformance>;
}
