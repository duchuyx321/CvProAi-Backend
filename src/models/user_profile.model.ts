import {
    Column,
    DataType,
    ForeignKey,
    HasOne,
    Model,
    PrimaryKey,
    Table,
} from 'sequelize-typescript';
import { Users } from '~/models';

@Table({ tableName: 'user_profile', timestamps: true, underscored: true })
export class User_profile extends Model<User_profile> {
    @PrimaryKey
    @ForeignKey(() => Users)
    @Column({ type: DataType.UUID, allowNull: false })
    declare user_id: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    phome?: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    avatar_url?: string;

    @Column({
        type: DataType.DATE,
        allowNull: true,
    })
    dob?: Date;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    location?: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    headline?: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
    })
    summary?: string;

    @Column({
        type: DataType.JSON,
        allowNull: true,
    })
    links?: Record<string, any>;

    @HasOne(() => Users)
    user?: Users;
}
