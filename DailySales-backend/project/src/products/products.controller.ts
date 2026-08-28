import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, CreateCategoryDto } from './dto';
import { Roles } from '../common/roles.decorator';
import { CurrentBusiness, CurrentUser } from '../common/current-user.decorator';
import { Errors } from '../common/errors';
import type { Role } from '../common/domain.types';

@ApiTags('products')
@Controller()
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get('products')
  @ApiOperation({ summary: 'List products (paginated, scoped)' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'query', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'includeInactive', required: false })
  async getProducts(
    @CurrentBusiness() businessId: string,
    @CurrentUser() user: any,
    @Query('categoryId') categoryId?: string,
    @Query('query') query?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.productsService.getProducts(businessId, {
      categoryId,
      query,
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      includeInactive: includeInactive === 'true',
      role: user.role as Role,
    });
  }

  @Get('products/search')
  @ApiOperation({ summary: 'Search products for POS' })
  async searchProducts(@CurrentBusiness() businessId: string, @Query('q') q: string) {
    if (!q || q.length < 1) throw Errors.BAD_REQUEST('Search query is required');
    return this.productsService.searchProducts(businessId, q);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get a single product' })
  async getProduct(@CurrentBusiness() businessId: string, @Param('id') id: string) {
    return this.productsService.getProduct(businessId, id);
  }

  @Post('products')
  @Roles('owner')
  @ApiOperation({ summary: 'Create a product (owner only)' })
  async createProduct(@CurrentBusiness() businessId: string, @Body() dto: CreateProductDto) {
    return this.productsService.createProduct(businessId, dto);
  }

  @Patch('products/:id')
  @Roles('owner')
  @ApiOperation({ summary: 'Update a product (owner only)' })
  async updateProduct(
    @CurrentBusiness() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(businessId, id, dto);
  }

  @Delete('products/:id')
  @Roles('owner')
  @ApiOperation({ summary: 'Soft-delete a product (owner only)' })
  async deleteProduct(@CurrentBusiness() businessId: string, @Param('id') id: string) {
    await this.productsService.deleteProduct(businessId, id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List categories' })
  async getCategories(@CurrentBusiness() businessId: string) {
    return this.productsService.getCategories(businessId);
  }

  @Post('categories')
  @Roles('owner')
  @ApiOperation({ summary: 'Create a category (owner only)' })
  async createCategory(@CurrentBusiness() businessId: string, @Body() dto: CreateCategoryDto) {
    return this.productsService.createCategory(businessId, dto.name);
  }
}
