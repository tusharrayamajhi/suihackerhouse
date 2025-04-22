import { Column, Entity, ManyToOne, OneToMany } from "typeorm";
import { BaseEntities } from "./BaseEntities.entities";
import { Category } from "./category.entities";
import { ProductVariant } from "./productVeriant.entities";

export enum Size {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
}

@Entity()
export class Product extends BaseEntities {

  @Column({ nullable: false,unique:false })
  productName: string;

  @Column({ type: "text", nullable: false })
  description: string;

  @Column({ type: "varchar", unsigned: false, nullable: false,default:'0' })
  price: string;

  @Column({ type: "int", unsigned: true, nullable: false })
  stock: number;

  @Column({ type: "varchar", length: 255, nullable: false })  
  imageUrl: string;

  @Column({ type: "varchar", length: 255, nullable: true })  
  videoLink: string;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];

  @ManyToOne(() => Category, (category) => category.products) // Defining the relation
  category: Category;
}
