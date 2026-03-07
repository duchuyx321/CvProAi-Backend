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

import { Users } from '~/models';

@Table({ tableName: 'usage_quotas', timestamps: true, underscored: true })
export class Usage_quotas extends Model<Usage_quotas> {
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

    @Unique('uq_usage_quotas_user_period')
    @Column({
        type: DataType.CHAR(7),
        allowNull: false,
    })
    period_month!: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    ai_runs_used!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    ai_runs_limit!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    exports_used!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    exports_limit!: number;

    @BelongsTo(() => Users)
    user?: Users;
}
