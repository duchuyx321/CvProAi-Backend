import {
    Column,
    DataType,
    HasMany,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { Subscriptions } from '~/models';

@Table({ tableName: 'plans', timestamps: false, underscored: true })
export class Plans extends Model<Plans> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;

    @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
    code!: string;

    @Column({ type: DataType.STRING(255), allowNull: false })
    name!: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    description?: string;

    @Column({ type: DataType.BIGINT, allowNull: false, defaultValue: 0 })
    price_cents!: string;

    @Column({
        type: DataType.STRING(10),
        allowNull: false,
        defaultValue: 'VND',
    })
    currency!: string;

    @Column({
        type: DataType.STRING(20),
        allowNull: false,
        defaultValue: 'MONTH',
    })
    interval!: string;

    @Column({ type: DataType.JSONB, allowNull: true })
    features?: any;

    @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
    is_active!: boolean;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    created_at!: Date;

    @HasMany(() => Subscriptions)
    subscriptions?: Subscriptions[];
}
