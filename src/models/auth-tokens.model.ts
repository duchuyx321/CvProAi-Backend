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

@Table({ tableName: 'auth_tokens', timestamps: true, underscored: true })
export class Auth_tokens extends Model<Auth_tokens> {
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
        type: DataType.STRING(30),
        allowNull: false,
    })
    type!: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    token_hash!: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
    })
    expires_at!: Date;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    consumed_at?: Date;

    @BelongsTo(() => Users)
    user?: Users;
}
