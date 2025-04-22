import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntities } from './BaseEntities.entities';
import { Product } from './Product.entities';

@Entity('categories')
export class Category extends BaseEntities{
  

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @OneToMany(() => Product, (product) => product.category) // Defining the reverse relationship
  products: Product[];
 
}
