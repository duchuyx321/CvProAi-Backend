import {
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
    BelongsTo,
} from 'sequelize-typescript';
import { Users, Roles } from '~/models';

@Table({ tableName: 'user_roles', timestamps: true, underscored: true })
export class User_roles extends Model<User_roles> {
    @ForeignKey(() => Users)
    @Column({
        type: DataType.UUID,
        allowNull: false,
        primaryKey: true,
    })
    user_id!: string;

    @ForeignKey(() => Roles)
    @Column({
        type: DataType.UUID,
        allowNull: false,
        primaryKey: true,
    })
    role_id!: string;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
    })
    assigned_at!: Date;

    @BelongsTo(() => Users)
    user?: Users;

    @BelongsTo(() => Roles)
    role?: Roles;
}
