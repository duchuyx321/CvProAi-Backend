import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';

import { Users } from '~/models';

@Table({
    tableName: 'usage_quotas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
})
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

    @Column({
        type: DataType.DATE,
        allowNull: false,
        comment: 'Thời điểm hết hạn quota hiện tại',
    })
    quota_end_at!: Date;

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
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    cvs_used!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    cvs_limit!: number;
    @BelongsTo(() => Users)
    declare user?: Users;
}
