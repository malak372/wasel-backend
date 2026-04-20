import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ReportType {
  @Field(() => Int)
  id: number;

  @Field()
  category: string;

  @Field()
  description: string;
}