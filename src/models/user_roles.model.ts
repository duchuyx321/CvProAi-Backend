import {
    BelongsTo,
    Column,
    DataType,
    ForeignKey,
    Model,
    Table,
} from 'sequelize-typescript';
import { Users, Roles } from '~/models';

@Table({ tableName: 'user_roles', timestamps: true, underscored: true })
export class User_roles extends Model<User_roles> {
    @ForeignKey(() => Users)
    @Column({ type: DataType.UUID, allowNull: false })
    user_id!: string;

    @ForeignKey(() => Roles)
    @Column({ type: DataType.UUID, allowNull: false })
    role_id!: string;

    @Column({
        type: DataType.DATE,
        defaultValue: DataType.NOW,
        allowNull: false,
    })
    assigned_at?: Date;

    @BelongsTo(() => Users)
    declare users: Users;
    @BelongsTo(() => Roles)
    declare roles: Roles;
}
