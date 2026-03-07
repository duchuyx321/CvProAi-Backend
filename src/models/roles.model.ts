import {
    Column,
    DataType,
    Model,
    PrimaryKey,
    Table,
    BelongsToMany,
} from 'sequelize-typescript';
import { Users, User_roles } from '~/models';

@Table({ tableName: 'roles', timestamps: true, underscored: true })
export class Roles extends Model<Roles> {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
        unique: true,
    })
    code!: string;

    @Column({
        type: DataType.STRING(100),
        allowNull: false,
    })
    name!: string;

    @BelongsToMany(() => Users, () => User_roles)
    users?: Users[];
}
