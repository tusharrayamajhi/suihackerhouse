import { Entity, Column, ManyToOne } from 'typeorm';
import { Product } from './Product.entities';
import { BaseEntities } from './BaseEntities.entities';

@Entity('product_variants')
export class ProductVariant extends BaseEntities {
  

  @ManyToOne(() => Product, (product) => product.variants)
  product: Product;

  @Column({ type: 'varchar', length: 255, nullable: true })
  size: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  color: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  weight: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock_quantity: number;
}
