import {
    BelongsToMany,
    Column,
    DataType,
    Model,
    Table,
} from 'sequelize-typescript';
import { Users, User_roles } from '~/models';

@Table({ tableName: 'roles', timestamps: true, underscored: true })
export class Roles extends Model<Roles> {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        allowNull: false,
    })
    declare id: string;
    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    code!: string;
    @Column({ type: DataType.STRING, unique: true, allowNull: false })
    name!: string;

    @BelongsToMany(() => Users, () => User_roles)
    users?: Users[];
}
