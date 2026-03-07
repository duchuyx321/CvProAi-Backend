import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { Orders } from '~/models';
import { payment_status } from '~/models/orders.model';

@Table({
    tableName: 'payment_transactions',
    timestamps: true,
    underscored: true,
})
export class Payment_transactions extends Model<Payment_transactions> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;

    @ForeignKey(() => Orders)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    order_id!: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
    })
    provider!: string;

    @Column({
        type: DataType.STRING(128),
        allowNull: true,
    })
    provider_txn_id?: string;

    @Column({
        type: DataType.ENUM(...Object.values(payment_status)),
        allowNull: false,
        defaultValue: payment_status.PENDING,
    })
    status!: payment_status;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    paid_at?: Date;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    raw_payload?: Record<string, any>;

    @BelongsTo(() => Orders)
    order?: Orders;
}
