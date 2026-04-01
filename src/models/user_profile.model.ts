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

@Table({ tableName: 'user_profile', timestamps: true, underscored: true })
export class User_profile extends Model<User_profile> {
    @PrimaryKey
    @ForeignKey(() => Users)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    user_id!: string;

    @Column({
        type: DataType.STRING(30),
        allowNull: true,
    })
    phone?: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    avatar_url?: string;

    @Column({
        type: DataType.DATEONLY,
        allowNull: true,
    })
    dob?: Date;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    location?: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    headline?: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    summary?: string;

    @Column({
        type: DataType.JSONB,
        allowNull: true,
    })
    links?: Record<string, any>;

    @BelongsTo(() => Users)
    user?: Users;
}
