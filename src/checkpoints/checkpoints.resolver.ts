import { Resolver, Query, ObjectType, Field, ID, Float, Args } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';

@ObjectType()
class CheckpointType {
  @Field(() => ID) id: string;
  @Field() name: string;
  @Field() currentStatus: string;
  @Field(() => Float) latitude: number;
  @Field(() => Float) longitude: number;
}

@Resolver(() => CheckpointType)
export class CheckpointsResolver {
  constructor(private prisma: PrismaService) {}

  @Query(() => [CheckpointType])
  async checkpoints(
    @Args('status', { nullable: true }) status?: string,
    @Args('name', { nullable: true }) name?: string,
  ) {
    return await this.prisma.checkpoint.findMany({
      where: {
        AND: [
          status ? { currentStatus: status as any } : {},
          name ? { name: { contains: name, mode: 'insensitive' } } : {},
        ],
      },
    });
  }

  @Query(() => CheckpointType, { nullable: true })
  async checkpoint(@Args('id', { type: () => ID }) id: string) {
    return await this.prisma.checkpoint.findUnique({ where: { id: id } });
  }
}