import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CheckpointType {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  status: string;

  // ضيفي أي حقول ثانية موجودة عندك في Prisma للحواجز
}