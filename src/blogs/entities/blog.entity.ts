import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('blogs')
export class Blog {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'My Blog Post' })
  @Column({ length: 200 })
  title: string;

  @ApiProperty({ example: 'This is the content of my blog post.' })
  @Column({ length: 1000 })
  content: string;
}
