import { Resolver, Query, ObjectType, Field, ID, Float, Args } from '@nestjs/graphql';
import { PrismaService } from '../prisma/prisma.service';

@ObjectType()
class IncidentType {
  @Field(() => ID) id: string;
  @Field() title: string;
  @Field({ nullable: true }) description: string;
  @Field() severity: string;
  @Field() status: string;
  @Field(() => Float, { nullable: true }) latitude: number;
  @Field(() => Float, { nullable: true }) longitude: number;
  @Field() occurredAt: Date;
}

@Resolver(() => IncidentType)
export class IncidentsResolver {
  constructor(private prisma: PrismaService) {}

  @Query(() => [IncidentType])
  async incidents(
    @Args('status', { nullable: true }) status?: string,
    @Args('regionId', { nullable: true }) regionId?: string,
    @Args('recent', { nullable: true, defaultValue: false }) recent?: boolean,
  ) {
    return await this.prisma.incident.findMany({
      where: {
        AND: [
          status ? { status: status as any } : {},
          regionId ? { regionId: regionId } : {},
        ],
      },
      // إذا طلبنا "recent" بيرتبهم من الأحدث للأقدم وبياخد أول 10 مثلاً
      orderBy: recent ? { occurredAt: 'desc' } : undefined,
      take: recent ? 10 : undefined,
    });
  }

  @Query(() => IncidentType, { nullable: true })
  async incident(@Args('id', { type: () => ID }) id: string) {
    return await this.prisma.incident.findUnique({ where: { id: id } });
  }
}