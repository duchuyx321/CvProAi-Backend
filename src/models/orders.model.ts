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

import { Users, Subscriptions, Plans, AiAddonPackages } from '~/models';

export enum payment_status {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    CANCELED = 'CANCELED',
    REFUNDED = 'REFUNDED',
}

export enum order_type {
    SUBSCRIPTION = 'SUBSCRIPTION',
    AI_ADDON = 'AI_ADDON',
    BOTH = 'BOTH',
}

@Table({ tableName: 'orders', timestamps: true, underscored: true })
export class Orders extends Model<Orders> {
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

    @Column({
        type: DataType.ENUM(...Object.values(order_type)),
        allowNull: false,
        defaultValue: order_type.SUBSCRIPTION,
    })
    order_type!: order_type;

    @Column({
        type: DataType.STRING(64),
        allowNull: false,
        unique: true,
    })
    order_code!: string;

    @ForeignKey(() => Plans)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    plan_id?: string;

    @ForeignKey(() => AiAddonPackages)
    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    addon_package_id?: string;

    @Column({
        type: DataType.BIGINT,
        allowNull: false,
    })
    amount_cents!: number;

    @Column({
        type: DataType.STRING(10),
        allowNull: false,
        defaultValue: 'VND',
    })
    currency!: string;

    @Column({
        type: DataType.ENUM(...Object.values(payment_status)),
        allowNull: false,
        defaultValue: payment_status.PENDING,
    })
    status!: payment_status;

    @Column({
        type: DataType.STRING(50),
        allowNull: true,
    })
    provider?: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: true,
    })
    provider_transaction_id?: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    description?: string;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    metadata?: Record<string, any>;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    paid_at?: Date;

    @BelongsTo(() => Users)
    declare user?: Users;

    @BelongsTo(() => Plans)
    declare plan?: Plans;

    @BelongsTo(() => AiAddonPackages)
    declare addon_package?: AiAddonPackages;

    @HasOne(() => Subscriptions)
    declare subscription?: Subscriptions;
}
