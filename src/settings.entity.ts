import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Settings {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({
    length: 20,
    unique: true,
  })
  name: string;
  @Column({
    default: false,
  })
  value: boolean;
}
