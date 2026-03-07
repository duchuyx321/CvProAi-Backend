import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    Unique,
} from 'sequelize-typescript';

import { Orders, Subscriptions } from '~/models';

@Table({
    tableName: 'order_subscriptions',
    timestamps: false,
    underscored: true,
})
export class Order_subscriptions extends Model<Order_subscriptions> {
    @PrimaryKey
    @ForeignKey(() => Orders)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    order_id!: string;

    @Unique
    @ForeignKey(() => Subscriptions)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    subscription_id!: string;

    @BelongsTo(() => Orders)
    order?: Orders;

    @BelongsTo(() => Subscriptions)
    subscription?: Subscriptions;
}
