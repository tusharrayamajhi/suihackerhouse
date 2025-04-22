import { Entity, Column } from "typeorm";
import { BaseEntities } from "./BaseEntities.entities";

@Entity()
export class BusinessDetails extends BaseEntities {

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string; 

  @Column({ type: 'text', nullable: false })
  description: string; 
  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string; 

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string; 

  @Column({ type: 'varchar', length: 100, nullable: true })
  contactEmail: string; 

  @Column({ type: 'varchar', length: 15, nullable: true })
  contactPhone: string; 
  
  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string; 
}
