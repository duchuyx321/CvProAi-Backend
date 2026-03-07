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

@Table({ tableName: 'audit_logs', timestamps: true, underscored: true })
export class Audit_logs extends Model<Audit_logs> {
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
        allowNull: true,
    })
    actor_user_id?: string;

    @Column({
        type: DataType.STRING(80),
        allowNull: false,
    })
    action!: string;

    @Column({
        type: DataType.STRING(80),
        allowNull: true,
    })
    entity_type?: string;

    @Column({
        type: DataType.UUID,
        allowNull: true,
    })
    entity_id?: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    ip?: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    user_agent?: string;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    detail?: Record<string, any>;

    @BelongsTo(() => Users, 'actor_user_id')
    actor?: Users;
}
