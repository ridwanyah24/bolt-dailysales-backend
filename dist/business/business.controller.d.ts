import { BusinessService } from './business.service';
import { UpdateBusinessDto } from './dto';
export declare class BusinessController {
    private businessService;
    constructor(businessService: BusinessService);
    getBusiness(businessId: string): Promise<import("../common/domain.types").Business>;
    updateBusiness(businessId: string, dto: UpdateBusinessDto): Promise<import("../common/domain.types").Business>;
    completeSetup(businessId: string): Promise<import("../common/domain.types").Business>;
}
