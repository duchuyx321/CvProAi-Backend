import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    HasOne,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { Users, Plans, Order_subscriptions } from '~/models';

export enum subscription_status {
    ACTIVE = 'ACTIVE',
    CANCELED = 'CANCELED',
    EXPIRED = 'EXPIRED',
    PAST_DUE = 'PAST_DUE',
}

@Table({ tableName: 'subscriptions', timestamps: true, underscored: true })
export class Subscriptions extends Model<Subscriptions> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;

    @ForeignKey(() => Users)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    user_id!: string;

    @ForeignKey(() => Plans)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    plan_id!: string;

    @Column({
        type: DataType.ENUM(...Object.values(subscription_status)),
        allowNull: false,
        defaultValue: subscription_status.ACTIVE,
    })
    status!: subscription_status;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    current_period_start!: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    current_period_end?: Date;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
    cancel_at_period_end!: boolean;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    canceled_at?: Date;

    @BelongsTo(() => Users)
    user?: Users;

    @BelongsTo(() => Plans)
    plan?: Plans;

    @HasOne(() => Order_subscriptions)
    order_subscription?: Order_subscriptions;
}
