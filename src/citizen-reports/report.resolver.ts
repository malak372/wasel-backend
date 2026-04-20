import { Resolver, Query, ObjectType, Field, ID, Float, Args } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';

@ObjectType()
class CitizenReportType {
  @Field(() => ID) id: string;
  @Field() description: string;
  @Field() status: string;
  @Field(() => ID, { nullable: true }) userId: string;
  @Field(() => Float, { nullable: true }) confidenceScore: number;
  @Field() reportTime: Date;
}

@Resolver(() => CitizenReportType)
export class ReportsResolver {
  constructor(private prisma: PrismaService) {}

  @Query(() => [CitizenReportType])
  async reports(
    @Args('status', { nullable: true }) status?: string,
    @Args('userId', { nullable: true }) userId?: string,
  ) {
    return await this.prisma.citizenReport.findMany({
      where: {
        AND: [
          status ? { status: status as any } : {},
          userId ? { userId: userId } : {},
        ],
      },
    });
  }

  @Query(() => CitizenReportType, { nullable: true })
  async report(@Args('id', { type: () => ID }) id: string) {
    return await this.prisma.citizenReport.findUnique({ where: { id: id } });
  }
}